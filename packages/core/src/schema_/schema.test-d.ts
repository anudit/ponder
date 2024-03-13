import type { Hex } from "viem";
import { assertType, test } from "vitest";
import {
  type RemoveBuilderSchema,
  type RemoveBuilderTable,
  hex,
  int,
  string,
} from "./columns.js";
import type { InferSchemaType, InferTableType } from "./infer.js";
import { createSchema, createTable } from "./schema.js";

test("createTable scalar", () => {
  const table = createTable({
    //  ^?
    id: hex(),
    col: string().optional(),
    col1: int().list(),
  });

  type inferred = InferTableType<RemoveBuilderTable<typeof table>>;
  //   ^?

  assertType<inferred>(
    {} as unknown as { id: Hex; col: string; col1: number[] },
  );
});

test("createSchema scalar", () => {
  const schema = createSchema((_p) => ({ a: "a" }) as const);
  //    ^?

  type inferred = InferSchemaType<RemoveBuilderSchema<typeof schema>>;
  //   ^?

  assertType<inferred>({} as unknown as { t: { id: Hex } });
});

test("createSchema reference", () => {
  const schema = createSchema((p) => ({
    //  ^?
    t1: p.createTable({
      id: p.hex(),
    }),
    t2: p.createTable({
      id: p.hex(),
      col: p.hex().references("t1.id"),
    }),
  }));

  type inferred = InferSchemaType<RemoveBuilderSchema<typeof schema>>;
  //   ^?

  assertType<inferred>(
    {} as unknown as { t1: { id: Hex }; t2: { id: Hex; col: Hex } },
  );
});
