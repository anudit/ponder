import type { Prettify } from "@/types/utils.js";
import type {
  ID,
  IdColumn,
  OneColumn,
  ReferenceColumn,
  Scalar,
  ScalarColumn,
  Table,
} from "./common.js";

type Optional<column extends BuilderScalarColumn[" column"]> =
  () => BuilderScalarColumn<column["type"], true, column["list"]>;

const optional =
  <column extends BuilderScalarColumn[" column"]>(
    col: column,
  ): Optional<column> =>
  // @ts-expect-error
  () => {
    const newCol = {
      _type: col._type,
      type: col.type,
      optional: true,
      list: col.list,
    } as const;

    if (newCol.list) {
      return { " column": newCol };
    } else {
      return {
        " column": newCol,
        list: list(newCol),
        references: references(newCol),
      };
    }
  };

type List<column extends BuilderScalarColumn[" column"]> =
  () => BuilderScalarColumn<column["type"], column["optional"], true>;

const list =
  <column extends BuilderScalarColumn[" column"]>(col: column): List<column> =>
  // @ts-expect-error
  () => {
    const newCol = {
      _type: col._type,
      type: col.type,
      optional: col.optional,
      list: true,
    } as const;

    if (newCol.optional) {
      return { " column": newCol };
    } else {
      return {
        " column": newCol,
        optional: optional(newCol),
      };
    }
  };

type ReferenceOptional<column extends BuilderReferenceColumn[" column"]> =
  () => BuilderReferenceColumn<column["type"], true, column["reference"]>;

const referenceOptional =
  <column extends BuilderReferenceColumn[" column"]>(
    col: column,
  ): ReferenceOptional<column> =>
  () => {
    const newCol = {
      _type: col._type,
      type: col.type,
      optional: true,
      reference: col.reference,
    } as const;

    return { " column": newCol };
  };

type References<column extends BuilderScalarColumn[" column"]> = <
  reference extends string,
>(
  ref: reference,
) => BuilderReferenceColumn<column["type"], column["optional"], reference>;

const references =
  <column extends BuilderScalarColumn[" column"]>(
    col: column,
  ): References<column> =>
  // @ts-expect-error
  <reference extends string>(ref: reference) => {
    const newCol = {
      _type: "r",
      type: col.type,
      optional: col.optional,
      reference: ref,
    } as const;

    if (newCol.optional) {
      return { " col": newCol };
    } else {
      return { " col": newCol, optional: referenceOptional(newCol) };
    }
  };

const scalarColumn =
  <scalar extends Scalar>(type: scalar) =>
  (): Prettify<BuilderScalarColumn<scalar, false, false>> => {
    const column = {
      _type: "s",
      type,
      optional: false,
      list: false,
    } as const;

    return {
      " column": column,
      optional: optional(column),
      list: list(column),
      references: references(column),
    };
  };

export type BuilderIdColumn<id extends ID = ID> = {
  " column": IdColumn<id>;
};

export type BuilderScalarColumn<
  scalar extends Scalar = Scalar,
  optional extends boolean = boolean,
  list extends boolean = boolean,
  ///
  col = ScalarColumn<scalar, optional, list>,
> = list extends false
  ? optional extends false
    ? {
        " column": col;
        optional: Optional<ScalarColumn<scalar, optional, list>>;
        list: List<ScalarColumn<scalar, optional, list>>;
        references: References<ScalarColumn<scalar, optional, list>>;
      }
    : {
        " column": col;
        list: List<ScalarColumn<scalar, optional, list>>;
        references: References<ScalarColumn<scalar, optional, list>>;
      }
  : optional extends false
    ? {
        " column": col;
        optional: Optional<ScalarColumn<scalar, optional, list>>;
      }
    : { " column": col };

export type BuilderReferenceColumn<
  scalar extends Scalar = Scalar,
  optional extends boolean = boolean,
  reference extends string = string,
  ///
  col = ReferenceColumn<scalar, optional, reference>,
> = optional extends false
  ? {
      " column": col;
      optional: ReferenceOptional<ReferenceColumn<scalar, optional, reference>>;
    }
  : {
      " column": col;
    };

export type BuilderOneColumn<reference extends string = string> = {
  " column": OneColumn<reference>;
};

/**
 * Table type used in the schema builder pattern.
 */
export type BuilderTable = {
  [columnName in keyof Table]: { " column": Table[columnName] };
};

export type BuilderSchema = { [tableName: string]: BuilderTable };

export type RemoveBuilderColumn<column extends BuilderScalarColumn> =
  column[" column"];

export type RemoveBuilderTable<table extends BuilderTable> = {
  [columnName in keyof table]: table[columnName][" column"];
};

export type RemoveBuilderSchema<schema extends BuilderSchema> = {
  [entityName in keyof schema]: Prettify<
    RemoveBuilderTable<schema[entityName]>
  >;
};

export const string = scalarColumn("string");
export const int = scalarColumn("int");
export const float = scalarColumn("float");
export const boolean = scalarColumn("boolean");
export const hex = scalarColumn("hex");
export const bigint = scalarColumn("bigint");

export const one = <reference extends string>(
  ref: reference,
): BuilderOneColumn<reference> => ({
  " column": { _type: "o", reference: ref },
});
