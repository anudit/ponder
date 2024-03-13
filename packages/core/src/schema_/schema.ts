import {
  type BuilderIdColumn,
  type BuilderReferenceColumn,
  type BuilderScalarColumn,
  type BuilderSchema,
  type BuilderTable,
  bigint,
  boolean,
  float,
  hex,
  int,
  string,
} from "./columns.js";
import type { Schema } from "./common.js";

type GetTable<table> = {} extends table
  ? {}
  : table extends BuilderIdColumn
    ? {
        [columnName in keyof table]:
          | BuilderScalarColumn
          | BuilderReferenceColumn;
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
  // a?: tableNames;
  createTable: <const table>(t: GetTable<table>) => table;
  string: () => BuilderScalarColumn<"string", false, false>;
  bigint: () => BuilderScalarColumn<"bigint", false, false>;
  int: () => BuilderScalarColumn<"int", false, false>;
  float: () => BuilderScalarColumn<"float", false, false>;
  hex: () => BuilderScalarColumn<"hex", false, false>;
  boolean: () => BuilderScalarColumn<"boolean", false, false>;
};

type GetSchema<schema> = {} extends schema
  ? {}
  : schema extends ((p: unknown) => infer _schema extends object)
    ? (p: P) => _schema | object
    : (p: P) => object;

export const createSchema = <const schema>(
  _schema: GetSchema<schema>,
): schema => {
  return schema();
};
