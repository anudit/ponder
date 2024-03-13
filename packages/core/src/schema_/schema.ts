import type { Prettify } from "@/types/utils.js";
import {
  type BuilderIdColumn,
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
  createTable: <const table>(t: GetTable<table>) => table;
  string: () => BuilderScalarColumn<"string", false, false>;
  bigint: () => BuilderScalarColumn<"bigint", false, false>;
  int: () => BuilderScalarColumn<"int", false, false>;
  float: () => BuilderScalarColumn<"float", false, false>;
  hex: () => BuilderScalarColumn<"hex", false, false>;
  boolean: () => BuilderScalarColumn<"boolean", false, false>;
};

type CreateSchemaParameters<schema> = {} extends schema
  ? {}
  : schema extends { (p: P): infer _schema extends BuilderSchema }
    ? { (p: P): _schema } | { (p: P): BuilderSchema }
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
