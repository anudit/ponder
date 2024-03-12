import type { Hex } from "viem";
import type {
  Column,
  EnumColumn,
  ReferenceColumn,
  Scalar,
  ScalarColumn,
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

export type InferColumnType<column extends Column> = column extends {
  type: infer type extends Scalar;
  list: infer list extends boolean;
}
  ? list extends true
    ? InferScalarType<type>[]
    : InferScalarType<type>
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
      ? columns[columnName]["optional"] extends true
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
      ? columns[columnName]["optional"] extends false
        ? columnName
        : never
      : never;
  }[keyof columns]
>;

export type InferTableType<table extends Table> = {
  [columnName in keyof FilterRequiredColumns<table>]: InferColumnType<
    table[columnName]
  >;
} & {
  [columnName in keyof FilterOptionalColumns<table>]?: InferColumnType<
    table[columnName]
  >;
};
