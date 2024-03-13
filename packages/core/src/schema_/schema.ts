import type { Prettify } from "@/types/utils.js";
import {
  type BuilderIdColumn,
  type BuilderOneColumn,
  type BuilderReferenceColumn,
  type BuilderScalarColumn,
  type BuilderSchema,
  type BuilderTable,
  type RemoveBuilderSchema,
  bigint,
  boolean,
  float,
  hex,
  int,
  one,
  string,
} from "./columns.js";
import type { Scalar, Schema } from "./common.js";

type GetTable<
  table,
  tableName,
  schema,
  ///
  tableNames extends string = Exclude<keyof schema & string, tableName>,
> = table extends { id: BuilderIdColumn }
  ? {
      [columnName in keyof table]: table[columnName] extends BuilderScalarColumn
        ? BuilderScalarColumn
        : table[columnName] extends BuilderReferenceColumn
          ? BuilderReferenceColumn<Scalar, boolean, `${tableNames}.id`>
          : table[columnName] extends BuilderOneColumn
            ? BuilderOneColumn<Exclude<keyof table & string, columnName | "id">>
            : BuilderScalarColumn | BuilderReferenceColumn | BuilderOneColumn;
    }
  : BuilderTable;

export const createTable = <const table>(t: table): table => t as table;

const P = {
  createTable,
  string,
  bigint,
  int,
  float,
  hex,
  boolean,
  one,
};

type P = {
  /** @deprecated Identify function limits type inference. */
  createTable: <const table>(t: table) => table;
  string: () => BuilderScalarColumn<"string", false, false>;
  bigint: () => BuilderScalarColumn<"bigint", false, false>;
  int: () => BuilderScalarColumn<"int", false, false>;
  float: () => BuilderScalarColumn<"float", false, false>;
  hex: () => BuilderScalarColumn<"hex", false, false>;
  boolean: () => BuilderScalarColumn<"boolean", false, false>;
  one: <reference extends string>(
    ref: reference,
  ) => BuilderOneColumn<reference>;
};

type CreateSchemaParameters<schema> = {} extends schema
  ? {}
  : schema extends { (p: P): infer _schema extends BuilderSchema }
    ? {
        (p: P): {
          [tableName in keyof _schema]: GetTable<
            _schema[tableName],
            tableName,
            _schema
          >;
        };
      }
    : { (p: P): BuilderSchema };

type CreateSchemaReturnType<schema> = schema extends {
  (p: P): infer _schema extends BuilderSchema;
}
  ? Prettify<RemoveBuilderSchema<_schema>>
  : Schema;

export const createSchema = <const schema>(
  _schema: CreateSchemaParameters<schema>,
): CreateSchemaReturnType<schema> => {
  return (_schema as { (p: P): CreateSchemaReturnType<schema> })(P);
};
