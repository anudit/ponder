import { assertType, test } from "vitest";
import { string } from "./columns.js";

test("base", () => {
  const c = string();
  //    ^?

  assertType<keyof typeof c>(
    {} as unknown as "optional" | "list" | "references",
  );
  assertType<Omit<typeof c, "optional" | "list" | "references">>(
    {} as unknown as {
      " type": "scalar";
      " scalar": "string";
      " optional": false;
      " list": false;
    },
  );
});

test("optional", () => {
  const c = string().optional();
  //    ^?

  assertType<keyof typeof c>({} as unknown as "list" | "references");
  assertType<Omit<typeof c, "list" | "references">>(
    {} as unknown as {
      " type": "scalar";
      " scalar": "string";
      " optional": true;
      " list": false;
    },
  );
});

test("list", () => {
  const c = string().list();
  //    ^?

  assertType<keyof typeof c>({} as unknown as "optional");
  assertType<Omit<typeof c, "optional">>(
    {} as unknown as {
      " type": "scalar";
      " scalar": "string";
      " optional": false;
      " list": true;
    },
  );
});

test("optional + list", () => {
  const c = string().optional().list();
  //    ^?

  assertType<Omit<typeof c, "optional">>(
    {} as unknown as {
      " type": "scalar";
      " scalar": "string";
      " optional": true;
      " list": true;
    },
  );
});

test("list + optional", () => {
  const c = string().list().optional();
  //    ^?

  assertType<Omit<typeof c, "optional">>(
    {} as unknown as {
      " type": "scalar";
      " scalar": "string";
      " optional": true;
      " list": true;
    },
  );
});

test("references", () => {
  const c = string().references("OtherTable.id");
  //    ^?

  assertType<keyof typeof c>({} as unknown as "optional");
  assertType<Omit<typeof c, "optional">>(
    {} as unknown as {
      " type": "reference";
      " scalar": "string";
      " optional": false;
      " reference": "OtherTable.id";
    },
  );
});

test("references + optional", () => {
  const c = string().references("OtherTable.id").optional();
  //    ^?

  assertType<Omit<typeof c, "optional">>(
    {} as unknown as {
      " type": "reference";
      " scalar": "string";
      " optional": true;
      " reference": "OtherTable.id";
    },
  );
});

test("optional + references", () => {
  const c = string().optional().references("OtherTable.id");
  //    ^?

  assertType<Omit<typeof c, "optional">>(
    {} as unknown as {
      " type": "reference";
      " scalar": "string";
      " optional": true;
      " reference": "OtherTable.id";
    },
  );
});
