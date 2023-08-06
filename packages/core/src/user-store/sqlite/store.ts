import type Sqlite from "better-sqlite3";
import { randomBytes } from "crypto";
import { Kysely, sql, SqliteDialect } from "kysely";

import type { Schema } from "@/schema/types";
import { blobToBigInt } from "@/utils/decode";

import type { ModelFilter, ModelInstance, UserStore } from "../store";
import {
  type FilterType,
  formatModelFieldValue,
  formatModelInstance,
  getWhereOperatorAndValue,
  MAX_INTEGER,
  validateFilter,
} from "../utils";

const gqlScalarToSqlType = {
  Boolean: "integer",
  Int: "integer",
  String: "text",
  BigInt: "blob",
  Bytes: "text",
  Float: "text",
} as const;

export class SqliteUserStore implements UserStore {
  db: Kysely<any>;

  schema?: Schema;
  versionId?: string;

  constructor({ db }: { db: Sqlite.Database }) {
    this.db = new Kysely({
      dialect: new SqliteDialect({ database: db }),
    });
  }

  /**
   * Resets the database by dropping existing tables and creating new tables.
   * If no new schema is provided, the existing schema is used.
   *
   * @param options.schema New schema to be used.
   */
  reload = async ({ schema }: { schema?: Schema } = {}) => {
    // If there is no existing schema and no schema was provided, do nothing.
    if (!this.schema && !schema) return;

    await this.db.transaction().execute(async (tx) => {
      // Drop tables from existing schema.
      if (this.schema) {
        await Promise.all(
          this.schema.entities.map((model) => {
            const tableName = `${model.name}_${this.versionId}`;
            tx.schema.dropTable(tableName);
          })
        );
      }

      if (schema) this.schema = schema;

      this.versionId = randomBytes(4).toString("hex");

      // Create tables for new schema.
      await Promise.all(
        this.schema!.entities.map(async (model) => {
          const tableName = `${model.name}_${this.versionId}`;
          let tableBuilder = tx.schema.createTable(tableName);
          model.fields.forEach((field) => {
            switch (field.kind) {
              case "SCALAR": {
                tableBuilder = tableBuilder.addColumn(
                  field.name,
                  gqlScalarToSqlType[field.scalarTypeName],
                  (col) => {
                    if (field.notNull) col = col.notNull();
                    return col;
                  }
                );
                break;
              }
              case "ENUM": {
                tableBuilder = tableBuilder.addColumn(
                  field.name,
                  "text",
                  (col) => {
                    if (field.notNull) col = col.notNull();
                    col = col.check(
                      sql`${sql.ref(field.name)} in (${sql.join(
                        field.enumValues.map((v) => sql.lit(v))
                      )})`
                    );
                    return col;
                  }
                );
                break;
              }
              case "LIST": {
                tableBuilder = tableBuilder.addColumn(
                  field.name,
                  "text",
                  (col) => {
                    if (field.notNull) col = col.notNull();
                    return col;
                  }
                );
                break;
              }
              case "RELATIONSHIP": {
                tableBuilder = tableBuilder.addColumn(
                  field.name,
                  gqlScalarToSqlType[field.relatedEntityIdType.name],
                  (col) => {
                    if (field.notNull) col = col.notNull();
                    return col;
                  }
                );
                break;
              }
            }
          });

          // Add the effective block number columns.
          tableBuilder = tableBuilder.addColumn(
            "effectiveFrom",
            "integer",
            (col) => col.notNull()
          );
          tableBuilder = tableBuilder.addColumn(
            "effectiveTo",
            "integer",
            (col) => col.notNull()
          );
          tableBuilder = tableBuilder.addPrimaryKeyConstraint(
            `${tableName}_id_effectiveTo_unique`,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            ["id", "effectiveTo"]
          );

          await tableBuilder.execute();
        })
      );
    });
  };

  /**
   * Tears down the store by dropping all tables for the current schema.
   */
  teardown = async () => {
    if (!this.schema) return;

    // Drop tables from existing schema.
    await this.db.transaction().execute(async (tx) => {
      await Promise.all(
        this.schema!.entities.map((model) => {
          const tableName = `${model.name}_${this.versionId}`;
          tx.schema.dropTable(tableName);
        })
      );
    });
  };

  findUnique = async ({
    modelName,
    blockNumber = MAX_INTEGER,
    id,
  }: {
    modelName: string;
    blockNumber?: number;
    id: string | number | bigint;
  }) => {
    const tableName = `${modelName}_${this.versionId}`;
    const formattedId = formatModelFieldValue({ value: id });

    const instances = await this.db
      .selectFrom(tableName)
      .selectAll()
      .where("id", "=", formattedId)
      .where("effectiveFrom", "<=", blockNumber)
      .where("effectiveTo", ">=", blockNumber)
      .execute();

    if (instances.length > 1) {
      throw new Error(`Expected 1 instance, found ${instances.length}`);
    }

    return instances[0]
      ? this.deserializeInstance({ modelName, instance: instances[0] })
      : null;
  };

  create = async ({
    modelName,
    blockNumber,
    id,
    data = {},
  }: {
    modelName: string;
    blockNumber: number;
    id: string | number | bigint;
    data?: Omit<ModelInstance, "id">;
  }) => {
    const tableName = `${modelName}_${this.versionId}`;
    const createInstance = formatModelInstance({ id, data });

    const instance = await this.db
      .insertInto(tableName)
      .values({
        ...createInstance,
        effectiveFrom: blockNumber,
        effectiveTo: MAX_INTEGER,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.deserializeInstance({ modelName, instance });
  };

  update = async ({
    modelName,
    blockNumber,
    id,
    data = {},
  }: {
    modelName: string;
    blockNumber: number;
    id: string | number | bigint;
    data?: Partial<Omit<ModelInstance, "id">>;
  }) => {
    const tableName = `${modelName}_${this.versionId}`;
    const formattedId = formatModelFieldValue({ value: id });
    const updateInstance = formatModelInstance({ id, data });

    const instance = await this.db.transaction().execute(async (tx) => {
      // Find the latest version of this instance.
      const latestInstance = await tx
        .selectFrom(tableName)
        .selectAll()
        .where("id", "=", formattedId)
        .orderBy("effectiveTo", "desc")
        .executeTakeFirstOrThrow();

      // If the latest version has the same effectiveFrom block number as the update,
      // this update is occurring within the same block/second. Update in place.
      if (latestInstance.effectiveFrom === blockNumber) {
        return await tx
          .updateTable(tableName)
          .set(updateInstance)
          .where("id", "=", formattedId)
          .where("effectiveFrom", "=", blockNumber)
          .returningAll()
          .executeTakeFirstOrThrow();
      }

      if (latestInstance.effectiveFrom > blockNumber) {
        throw new Error(`Cannot update an instance in the past`);
      }

      // If the latest version has an earlier effectiveFrom block number than the update,
      // we need to update the latest version AND insert a new version.
      await tx
        .updateTable(tableName)
        .set({ effectiveTo: blockNumber - 1 })
        .where("id", "=", formattedId)
        .where("effectiveTo", "=", MAX_INTEGER)
        .execute();

      return await tx
        .insertInto(tableName)
        .values({
          ...latestInstance,
          ...updateInstance,
          effectiveFrom: blockNumber,
          effectiveTo: MAX_INTEGER,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    });

    return this.deserializeInstance({ modelName, instance });
  };

  upsert = async ({
    modelName,
    blockNumber,
    id,
    create = {},
    update = {},
  }: {
    modelName: string;
    blockNumber: number;
    id: string | number | bigint;
    create?: Omit<ModelInstance, "id">;
    update?: Partial<Omit<ModelInstance, "id">>;
  }) => {
    const tableName = `${modelName}_${this.versionId}`;
    const formattedId = formatModelFieldValue({ value: id });
    const createInstance = formatModelInstance({ id, data: create });
    const updateInstance = formatModelInstance({ id, data: update });

    const instance = await this.db.transaction().execute(async (tx) => {
      // Attempt to find the latest version of this instance.
      const latestInstance = await tx
        .selectFrom(tableName)
        .selectAll()
        .where("id", "=", formattedId)
        .orderBy("effectiveTo", "desc")
        .executeTakeFirst();

      // If there is no latest version, insert a new version using the create data.
      if (!latestInstance) {
        return await tx
          .insertInto(tableName)
          .values({
            ...createInstance,
            effectiveFrom: blockNumber,
            effectiveTo: MAX_INTEGER,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
      }

      // If the latest version has the same effectiveFrom block number as the update,
      // this update is occurring within the same block/second. Update in place.
      if (latestInstance.effectiveFrom === blockNumber) {
        return await tx
          .updateTable(tableName)
          .set(updateInstance)
          .where("id", "=", formattedId)
          .where("effectiveFrom", "=", blockNumber)
          .returningAll()
          .executeTakeFirstOrThrow();
      }

      if (latestInstance.effectiveFrom > blockNumber) {
        throw new Error(`Cannot update an instance in the past`);
      }

      // If the latest version has an earlier effectiveFrom block number than the update,
      // we need to update the latest version AND insert a new version.
      await tx
        .updateTable(tableName)
        .set({ effectiveTo: blockNumber - 1 })
        .where("id", "=", formattedId)
        .where("effectiveTo", "=", MAX_INTEGER)
        .execute();

      return await tx
        .insertInto(tableName)
        .values({
          ...latestInstance,
          ...updateInstance,
          effectiveFrom: blockNumber,
          effectiveTo: MAX_INTEGER,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    });

    return this.deserializeInstance({ modelName, instance });
  };

  delete = async ({
    modelName,
    blockNumber,
    id,
  }: {
    modelName: string;
    blockNumber: number;
    id: string | number | bigint;
  }) => {
    const tableName = `${modelName}_${this.versionId}`;
    const formattedId = formatModelFieldValue({ value: id });

    const instance = await this.db.transaction().execute(async (tx) => {
      // Update the latest version to be effective until the delete block number.
      const deletedInstance = await tx
        .updateTable(tableName)
        .set({ effectiveTo: blockNumber - 1 })
        .where("id", "=", formattedId)
        .where("effectiveTo", "=", MAX_INTEGER)
        .returning(["id", "effectiveFrom"])
        .executeTakeFirst();

      // If, after the update, the latest version is only effective from
      // the delete block number, delete the instance in place. It "never existed".
      if (deletedInstance?.effectiveFrom === blockNumber) {
        await tx
          .deleteFrom(tableName)
          .where("id", "=", formattedId)
          .where("effectiveFrom", "=", blockNumber)
          .returning(["id"])
          .executeTakeFirst();
      }

      return !!deletedInstance;
    });

    return instance;
  };

  findMany = async ({
    modelName,
    blockNumber = MAX_INTEGER,
    filter = {},
  }: {
    modelName: string;
    blockNumber: number;
    filter?: ModelFilter;
  }) => {
    const tableName = `${modelName}_${this.versionId}`;

    if (filter.blockNumber) blockNumber = filter.blockNumber;

    let query = this.db
      .selectFrom(tableName)
      .selectAll()
      .where("effectiveFrom", "<=", blockNumber)
      .where("effectiveTo", ">=", blockNumber);

    const { where, first, skip, orderBy, orderDirection } =
      validateFilter(filter);

    if (where) {
      Object.entries(where).forEach(([whereKey, rawValue]) => {
        const [fieldName, rawFilterType] = whereKey.split(/_(.*)/s);
        // This is a hack to handle the "" operator, which the regex above doesn't handle
        const filterType = (
          rawFilterType === undefined ? "" : rawFilterType
        ) as FilterType;

        const { operator, value } = getWhereOperatorAndValue({
          filterType,
          value: rawValue,
        });

        query = query.where(fieldName, operator, value);
      });
    }

    if (skip) {
      query = query.offset(skip);
    }
    if (first) {
      query = query.limit(first);
    }
    if (orderBy) {
      query = query.orderBy(orderBy, orderDirection);
    }

    const instances = await query.execute();

    return instances.map((instance) =>
      this.deserializeInstance({ modelName, instance })
    );
  };

  revert = async ({ safeBlockNumber }: { safeBlockNumber: number }) => {
    await this.db.transaction().execute(async (tx) => {
      await Promise.all(
        (this.schema?.entities ?? []).map(async (entity) => {
          const modelName = entity.name;
          const tableName = `${modelName}_${this.versionId}`;

          // Delete any versions that are newer than the safe block number.
          await tx
            .deleteFrom(tableName)
            .where("effectiveFrom", ">", safeBlockNumber)
            .execute();

          // Now, any versions that have effectiveTo greater than or equal
          // to the safe block number are the new latest version.
          await tx
            .updateTable(tableName)
            .where("effectiveTo", ">=", safeBlockNumber)
            .set({ effectiveTo: MAX_INTEGER })
            .execute();
        })
      );
    });
  };

  private deserializeInstance = ({
    modelName,
    instance,
  }: {
    modelName: string;
    instance: Record<string, unknown>;
  }) => {
    const entity = this.schema!.entities.find((e) => e.name === modelName)!;

    const deserializedInstance = {} as ModelInstance;

    entity.fields.forEach((field) => {
      const value = instance[field.name] as string | number | null | undefined;

      if (value === null || value === undefined) {
        deserializedInstance[field.name] = null;
        return;
      }

      if (field.kind === "SCALAR" && field.scalarTypeName === "Boolean") {
        deserializedInstance[field.name] = value === 1 ? true : false;
        return;
      }

      if (field.kind === "SCALAR" && field.scalarTypeName === "BigInt") {
        deserializedInstance[field.name] = blobToBigInt(
          value as unknown as Buffer
        );
        return;
      }

      if (
        field.kind === "RELATIONSHIP" &&
        field.relatedEntityIdType.name === "BigInt"
      ) {
        deserializedInstance[field.name] = blobToBigInt(
          value as unknown as Buffer
        );
        return;
      }

      if (field.kind === "LIST") {
        let parsedValue = JSON.parse(value as string);
        if (field.baseGqlType.name === "BigInt")
          parsedValue = parsedValue.map(BigInt);
        deserializedInstance[field.name] = parsedValue;
        return;
      }

      deserializedInstance[field.name] = value;
    });

    return deserializedInstance;
  };
}
