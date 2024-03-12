export type Scalar = "string" | "int" | "float" | "boolean" | "hex" | "bigint";

export type ID = "string" | "int" | "bigint" | "hex";

export type ScalarColumn<
  scalar extends Scalar = Scalar,
  optional extends boolean = boolean,
  list extends boolean = boolean,
> = {
  _type: "s";
  type: scalar;
  optional: optional;
  list: list;
};

export type IdColumn<id extends ID = ID> = ScalarColumn<id, false, false>;

export type ReferenceColumn<
  scalar extends Scalar = Scalar,
  optional extends boolean = boolean,
  list extends boolean = boolean,
  reference extends string = string,
> = {
  _type: "r";
  type: scalar;
  optional: optional;
  list: list;
  reference: reference;
};

export type OneColumn<reference extends string = string> = {
  _type: "o";
  reference: reference;
};

export type ManyColumn<
  referenceTable extends string = string,
  referenceColumn extends string = string,
> = {
  _type: "m";
  referenceTable: referenceTable;
  referenceColumn: referenceColumn;
};

export type EnumColumn<
  type extends string = string,
  optional extends boolean = boolean,
  list extends boolean = boolean,
> = {
  _type: "e";
  type: type;
  optional: optional;
  list: list;
};

export type Column =
  | ScalarColumn
  | ReferenceColumn
  | OneColumn
  | ManyColumn
  | EnumColumn;

export type Table = { id: IdColumn } & {
  [columnName: string]: Column;
};

/**
 * Table type used in the schema builder pattern.
 */
export type BuilderTable = {
  [columnName in keyof Table]: { " column": Table[columnName] };
};

export type Enum = readonly string[];

export type Schema = { [tableName: string]: Table } & {
  [enumName: string]: Enum;
};
