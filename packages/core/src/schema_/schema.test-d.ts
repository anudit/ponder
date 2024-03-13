import type { Hex } from "viem";
import { assertType, test } from "vitest";
import type { InferSchemaType } from "./infer.js";
import { createSchema } from "./schema.js";

test("createSchema scalar", () => {
  const schema = createSchema((p) => ({ t: { id: p.hex() } }));
  //    ^?

  type inferred = InferSchemaType<typeof schema>;
  //   ^?

  assertType<inferred>({} as unknown as { t: { id: Hex } });
});

test("createSchema reference", () => {
  const schema = createSchema((p) => ({
    //  ^?
    t1: {
      id: p.hex(),
    },
    t2: {
      id: p.hex(),
      col: p.hex().references("t1.id"),
    },
  }));

  type inferred = InferSchemaType<typeof schema>;
  //   ^?

  assertType<inferred>(
    {} as unknown as { t1: { id: Hex }; t2: { id: Hex; col: Hex } },
  );
});

test("createSchema one", () => {
  const schema = createSchema((p) => ({
    //  ^?
    t1: {
      id: p.hex(),
    },
    t2: {
      id: p.hex(),
      col1: p.hex().references("t1.id"),
      col2: p.one("col1"),
    },
  }));

  type inferred = InferSchemaType<typeof schema>;
  //   ^?

  assertType<inferred>(
    {} as unknown as { t1: { id: Hex }; t2: { id: Hex; col1: Hex } },
  );
});
