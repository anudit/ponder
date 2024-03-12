import type { Hex } from "viem";
import { assertType, test } from "vitest";
import { type RemoveBuilderTable, hex, int, string } from "./columns.js";
import type { InferTableType } from "./infer.js";
import { createTable } from "./schema.js";

test("createTable scalar", () => {
  const table = createTable({
    //  ^?
    id: hex(),
    col: string().optional(),
    col1: int().list(),
  });

  type inferred = InferTableType<RemoveBuilderTable<typeof table>>;

  assertType<inferred>(
    {} as unknown as { id: Hex; col: string; col1: number[] },
  );
});
