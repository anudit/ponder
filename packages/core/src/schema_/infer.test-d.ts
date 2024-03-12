import type { Hex } from "viem";
import { assertType, test } from "vitest";
import type { ScalarColumn } from "./common.js";
import type {
  FilterOptionalColumns,
  FilterRequiredColumns,
  InferColumnType,
  InferScalarType,
  InferTableType,
} from "./infer.js";

test("infer scalar string", () => {
  type inferred = InferScalarType<"string">;
  //   ^?

  assertType<inferred>({} as unknown as string);
});

test("infer scalar boolean", () => {
  type inferred = InferScalarType<"boolean">;
  //   ^?

  assertType<inferred>({} as unknown as boolean);
});

test("infer scalar int", () => {
  type inferred = InferScalarType<"int">;
  //   ^?

  assertType<inferred>({} as unknown as number);
});

test("infer scalar float", () => {
  type inferred = InferScalarType<"float">;
  //   ^?

  assertType<inferred>({} as unknown as number);
});

test("infer scalar bigint", () => {
  type inferred = InferScalarType<"bigint">;
  //   ^?

  assertType<inferred>({} as unknown as bigint);
});

test("infer scalar hex", () => {
  type inferred = InferScalarType<"hex">;
  //   ^?

  assertType<inferred>({} as unknown as Hex);
});

test("infer column not list", () => {
  type inferred = InferColumnType<ScalarColumn<"string", false, false>>;
  //   ^?

  assertType<inferred>({} as unknown as string);
});

test("infer column list", () => {
  type inferred = InferColumnType<ScalarColumn<"string", false, true>>;
  //   ^?

  assertType<inferred>({} as unknown as string[]);
});

test("filter optional columns", () => {
  type filtered = FilterOptionalColumns<{
    // ^?
    col1: ScalarColumn<"string", false, false>;
    col2: ScalarColumn<"string", true, false>;
  }>;

  assertType<filtered>(
    {} as unknown as { col2: ScalarColumn<"string", true, false> },
  );
});

test("filter required columns", () => {
  type filtered = FilterRequiredColumns<{
    // ^?
    col1: ScalarColumn<"string", false, false>;
    col2: ScalarColumn<"string", true, false>;
  }>;

  assertType<filtered>(
    {} as unknown as { col1: ScalarColumn<"string", false, false> },
  );
});

test("infer table", () => {
  type inferred = InferTableType<{
    // ^?
    id: ScalarColumn<"string", false, false>;
    col: ScalarColumn<"string", true, false>;
  }>;

  assertType<inferred>(
    {} as unknown as { id: string; col?: string | undefined },
  );
});
