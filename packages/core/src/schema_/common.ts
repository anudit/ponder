export type Scalar = "string" | "int" | "float" | "boolean" | "hex" | "bigint";
export type ID = "string" | "int" | "bigint" | "hex";

export type ScalarColumn<
  scalar extends Scalar = Scalar,
  optional extends boolean = boolean,
  list extends boolean = boolean,
> = {
  type: "scalar";
  scalar: scalar;
  optional: optional;
  list: list;
};

export type IdColumn<id extends ID = ID> = ScalarColumn<id, false, false>;

export type ReferenceColumn<
  scalar extends Scalar = Scalar,
  optional extends boolean = boolean,
  reference extends string = string,
> = {
  type: "reference";
  scalar: scalar;
  optional: optional;
  reference: reference;
};

export type OneColumn<reference extends string = string> = {
  type: "one";
  reference: reference;
};

export type ManyColumn<
  referenceTable extends string = string,
  referenceColumn extends string = string,
> = {
  type: "m";
  referenceTable: referenceTable;
  referenceColumn: referenceColumn;
};

export type EnumColumn<
  _enum extends string = string,
  optional extends boolean = boolean,
  list extends boolean = boolean,
> = {
  type: "enum";
  enum: _enum;
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

export type Enum = readonly string[];

export type IsTable<a extends Table | Enum> = a extends readonly unknown[]
  ? false
  : true;

export type Schema = { [tableName: string]: Table };
