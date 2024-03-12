import { assertType, test } from "vitest";
import { string } from "./columns.js";

test("base", () => {
  const c = string();
  //    ^?

  assertType<keyof typeof c>({} as unknown as " column" | "optional" | "list");
  assertType<(typeof c)[" column"]>(
    {} as unknown as {
      _type: "s";
      type: "string";
      optional: false;
      list: false;
    },
  );
});

test("optional", () => {
  const c = string().optional();
  //    ^?

  assertType<keyof typeof c>({} as unknown as " column" | "list");
  assertType<(typeof c)[" column"]>(
    {} as unknown as {
      _type: "s";
      type: "string";
      optional: true;
      list: false;
    },
  );
});

test("list", () => {
  const c = string().list();
  //    ^?

  assertType<keyof typeof c>({} as unknown as " column" | "optional");
  assertType<(typeof c)[" column"]>(
    {} as unknown as {
      _type: "s";
      type: "string";
      optional: false;
      list: true;
    },
  );
});

test("optional + list", () => {
  const c = string().optional().list();
  //    ^?

  assertType<keyof typeof c>({} as unknown as " column");
  assertType<(typeof c)[" column"]>(
    {} as unknown as {
      _type: "s";
      type: "string";
      optional: true;
      list: true;
    },
  );
});

test("list + optional", () => {
  const c = string().list().optional();
  //    ^?

  assertType<keyof typeof c>({} as unknown as " column");
  assertType<(typeof c)[" column"]>(
    {} as unknown as {
      _type: "s";
      type: "string";
      optional: true;
      list: true;
    },
  );
});

test("references", () => {
  const c = string().references("OtherTable.id");
  //    ^?

  assertType<keyof typeof c>({} as unknown as " column" | "optional");
  assertType<(typeof c)[" column"]>(
    {} as unknown as {
      _type: "r";
      type: "string";
      optional: false;
      reference: "OtherTable.id";
    },
  );
});

test("references + optional", () => {
  const c = string().references("OtherTable.id").optional();
  //    ^?

  assertType<keyof typeof c>({} as unknown as " column");
  assertType<(typeof c)[" column"]>(
    {} as unknown as {
      _type: "r";
      type: "string";
      optional: true;
      reference: "OtherTable.id";
    },
  );
});

test("optional + references", () => {
  const c = string().optional().references("OtherTable.id");
  //    ^?

  assertType<keyof typeof c>({} as unknown as " column");
  assertType<(typeof c)[" column"]>(
    {} as unknown as {
      _type: "r";
      type: "string";
      optional: true;
      reference: "OtherTable.id";
    },
  );
});
