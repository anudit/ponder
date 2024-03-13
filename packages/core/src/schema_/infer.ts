import type { Prettify } from "@/types/utils.js";
import type { Hex } from "viem";
import type {
  Column,
  EnumColumn,
  ReferenceColumn,
  Scalar,
  ScalarColumn,
  Schema,
  Table,
} from "./common.js";

export type InferScalarType<scalar extends Scalar> = scalar extends "string"
  ? string
  : scalar extends "int"
    ? number
    : scalar extends "float"
      ? number
      : scalar extends "boolean"
        ? boolean
        : scalar extends "hex"
          ? Hex
          : scalar extends "bigint"
            ? bigint
            : never;

export type InferColumnType<column extends Column> = column extends ScalarColumn
  ? column[" list"] extends true
    ? InferScalarType<column[" scalar"]>[]
    : InferScalarType<column[" scalar"]>
  : column extends ReferenceColumn
    ? InferScalarType<column[" scalar"]>
    : never;

export type FilterOptionalColumns<
  columns extends { [columnsName: string]: Column },
> = Pick<
  columns,
  {
    [columnName in keyof columns]: columns[columnName] extends
      | ScalarColumn
      | ReferenceColumn
      | EnumColumn
      ? columns[columnName][" optional"] extends true
        ? columnName
        : never
      : never;
  }[keyof columns]
>;

export type FilterRequiredColumns<
  columns extends { [columnsName: string]: Column },
> = Pick<
  columns,
  {
    [columnName in keyof columns]: columns[columnName] extends
      | ScalarColumn
      | ReferenceColumn
      | EnumColumn
      ? columns[columnName][" optional"] extends false
        ? columnName
        : never
      : never;
  }[keyof columns]
>;

export type InferTableType<table extends Table> = Prettify<
  {
    [columnName in keyof FilterRequiredColumns<table>]: InferColumnType<
      table[columnName]
    >;
  } & {
    [columnName in keyof FilterOptionalColumns<table>]?: InferColumnType<
      table[columnName]
    >;
  }
>;

export type InferSchemaType<schema extends Schema> = {
  [tableName in keyof schema]: InferTableType<schema[tableName]>;
};
