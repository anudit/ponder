import {
  type BuilderOneColumn,
  type BuilderReferenceColumn,
  type BuilderScalarColumn,
  bigint,
  boolean,
  float,
  hex,
  int,
  one,
  string,
} from "./columns.js";
import type {
  IdColumn,
  OneColumn,
  ReferenceColumn,
  ScalarColumn,
} from "./common.js";

type GetTable<
  table,
  tableName = string,
  schema = {},
  ///
  tableNames extends string = {} extends schema
    ? string
    : Exclude<keyof schema & string, tableName>,
> = {} extends table
  ? {}
  : table extends {
        id: IdColumn;
      }
    ? {
        [columnName in keyof table]: table[columnName] extends ScalarColumn
          ? ScalarColumn
          : table[columnName] extends ReferenceColumn
            ? ReferenceColumn<
                table[columnName][" scalar"],
                table[columnName][" optional"],
                `${tableNames}.id`
              >
            : table[columnName] extends OneColumn
              ? OneColumn<Exclude<keyof table & string, columnName | "id">>
              : ScalarColumn | ReferenceColumn | OneColumn;
      }
    : { id: IdColumn } & {
        [columnName: string]: ScalarColumn | ReferenceColumn | OneColumn;
      };

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
  one,
};

type P = {
  createTable: <const table>(t: GetTable<table>) => table;
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
  : {
      [tableName in keyof schema]: GetTable<
        schema[tableName],
        tableName,
        schema
      >;
    };

export const createSchema = <const schema>(
  _schema: (p: P) => CreateSchemaParameters<schema>,
): schema => {
  return _schema(P) as schema;
};
