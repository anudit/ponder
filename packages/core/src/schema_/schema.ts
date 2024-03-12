import {
  type BuilderScalarColumn,
  type BuilderTable,
  bigint,
  boolean,
  float,
  hex,
  int,
  string,
} from "./columns.js";
import type { IdColumn } from "./common.js";

export type GetColumn<column> = column | BuilderScalarColumn;

type GetTable<table> = {} extends table
  ? {}
  : table extends { id: { " column": IdColumn } }
    ? {
        [columnName in keyof table]: BuilderScalarColumn;
      }
    : BuilderTable;

export const createTable = <const table>(t: GetTable<table>): table =>
  t as table;

const P = {
  createTable,
  string,
  bigint,
  int,
  float,
  hex,
  boolean,
};

type P = {
  // createTable
  string: () => BuilderScalarColumn<"string", false, false>;
  bigint: () => BuilderScalarColumn<"bigint", false, false>;
  int: () => BuilderScalarColumn<"int", false, false>;
  float: () => BuilderScalarColumn<"float", false, false>;
  hex: () => BuilderScalarColumn<"hex", false, false>;
  boolean: () => BuilderScalarColumn<"boolean", false, false>;
};

type GetSchema<schema> = {} extends schema
  ? {}
  : { [tableName in keyof schema]: GetTable<schema[tableName]> };

export const createSchema = <const schema>(
  _schema: (p: P) => GetSchema<schema>,
) => {
  const builtSchema = _schema(P);

  return builtSchema;
};
