import type { Prettify } from "@/types/utils.js";
import type { ReferenceColumn, Scalar, ScalarColumn } from "./common.js";

type Optional<column extends BuilderScalarColumn> = () => BuilderScalarColumn<
  column[" scalar"],
  true,
  column[" list"]
>;

const optional =
  <column extends BuilderScalarColumn>(col: column): Optional<column> =>
  // @ts-expect-error
  () => {
    const newCol = {
      " type": col[" type"],
      " scalar": col[" scalar"],
      " optional": true,
      " list": col[" list"],
    } as const;

    if (newCol[" list"]) {
      return newCol;
    } else {
      return {
        ...newCol,
        list: list(newCol),
        references: references(newCol),
      };
    }
  };

type List<column extends BuilderScalarColumn> = () => BuilderScalarColumn<
  column[" scalar"],
  column[" optional"],
  true
>;

const list =
  <column extends BuilderScalarColumn>(col: column): List<column> =>
  // @ts-expect-error
  () => {
    const newCol = {
      " type": col[" type"],
      " scalar": col[" scalar"],
      " optional": col[" optional"],
      " list": true,
    } as const;

    if (newCol[" optional"]) {
      return newCol;
    } else {
      return {
        ...newCol,
        optional: optional(newCol),
      };
    }
  };

type ReferenceOptional<column extends BuilderReferenceColumn> =
  () => BuilderReferenceColumn<column[" scalar"], true, column[" reference"]>;

const referenceOptional =
  <column extends BuilderReferenceColumn>(
    col: column,
  ): ReferenceOptional<column> =>
  () => {
    return {
      " type": col[" type"],
      " scalar": col[" scalar"],
      " optional": true,
      " reference": col[" reference"],
    };
  };

type References<column extends BuilderScalarColumn> = <
  reference extends string,
>(
  ref: reference,
) => BuilderReferenceColumn<column[" scalar"], column[" optional"], reference>;

const references =
  <column extends BuilderScalarColumn>(col: column): References<column> =>
  // @ts-expect-error
  <reference extends string>(ref: reference) => {
    const newCol = {
      " type": "reference",
      " scalar": col[" scalar"],
      " optional": col[" optional"],
      " reference": ref,
    } as const;

    if (newCol[" optional"]) {
      return newCol;
    } else {
      return { ...newCol, optional: referenceOptional(newCol) };
    }
  };

const scalarColumn =
  <scalar extends Scalar>(_scalar: scalar) =>
  (): Prettify<BuilderScalarColumn<scalar, false, false>> => {
    const column = {
      " type": "scalar",
      " scalar": _scalar,
      " optional": false,
      " list": false,
    } as const;

    return {
      ...column,
      optional: optional(column),
      list: list(column),
      references: references(column),
    };
  };

export type BuilderScalarColumn<
  scalar extends Scalar = Scalar,
  optional extends boolean = boolean,
  list extends boolean = boolean,
  ///
  base extends ScalarColumn<scalar, optional, list> = ScalarColumn<
    scalar,
    optional,
    list
  >,
> = list extends false
  ? optional extends false
    ? base & {
        optional: Optional<base>;
        list: List<base>;
        references: References<base>;
      }
    : base & {
        list: List<base>;
        references: References<base>;
      }
  : optional extends false
    ? base & {
        optional: Optional<base>;
      }
    : base;

export type BuilderReferenceColumn<
  scalar extends Scalar = Scalar,
  optional extends boolean = boolean,
  reference extends string = string,
  ///
  base extends ReferenceColumn<scalar, optional, reference> = ReferenceColumn<
    scalar,
    optional,
    reference
  >,
> = optional extends false
  ? base & {
      optional: ReferenceOptional<base>;
    }
  : base;

export type BuilderOneColumn<reference extends string = string> = {
  " type": "one";
  " reference": reference;
};

export const string = scalarColumn("string");
export const int = scalarColumn("int");
export const float = scalarColumn("float");
export const boolean = scalarColumn("boolean");
export const hex = scalarColumn("hex");
export const bigint = scalarColumn("bigint");

export const one = <reference extends string>(
  ref: reference,
): BuilderOneColumn<reference> => ({
  " type": "one",
  " reference": ref,
});
