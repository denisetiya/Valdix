import { invalid, ok } from "../core/context.js";
import type { InternalResult, ParseContext } from "../core/context.js";
import {
  BaseSchema,
  type OutputOf
} from "../core/schema.js";
import { getValueType, regexTest } from "../core/utils.js";

type StringRule =
  | { kind: "min"; value: number }
  | { kind: "max"; value: number }
  | { kind: "length"; value: number }
  | { kind: "regex"; value: RegExp }
  | { kind: "email" }
  | { kind: "url" }
  | { kind: "uuid" }
  | { kind: "datetime" }
  | { kind: "slug" }
  | { kind: "cuid" }
  | { kind: "startsWith"; value: string }
  | { kind: "endsWith"; value: string }
  | { kind: "includes"; value: string };

const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATETIME_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;

const SLUG_RE =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const CUID_RE =
  /^c[^\s-]{8,}$/;

export class StringSchema extends BaseSchema<string> {
  public constructor(private readonly rules: readonly StringRule[] = []) {
    super();
  }

  private with(rule: StringRule): StringSchema {
    return new StringSchema([...this.rules, rule]);
  }

  public min(value: number): StringSchema {
    return this.with({ kind: "min", value });
  }

  public max(value: number): StringSchema {
    return this.with({ kind: "max", value });
  }

  public length(value: number): StringSchema {
    return this.with({ kind: "length", value });
  }

  public regex(value: RegExp): StringSchema {
    return this.with({ kind: "regex", value });
  }

  public email(): StringSchema {
    return this.with({ kind: "email" });
  }

  public url(): StringSchema {
    return this.with({ kind: "url" });
  }

  public uuid(): StringSchema {
    return this.with({ kind: "uuid" });
  }

  public datetime(): StringSchema {
    return this.with({ kind: "datetime" });
  }

  public slug(): StringSchema {
    return this.with({ kind: "slug" });
  }

  public cuid(): StringSchema {
    return this.with({ kind: "cuid" });
  }

  public startsWith(value: string): StringSchema {
    return this.with({ kind: "startsWith", value });
  }

  public endsWith(value: string): StringSchema {
    return this.with({ kind: "endsWith", value });
  }

  public includes(value: string): StringSchema {
    return this.with({ kind: "includes", value });
  }

  public nonempty(): StringSchema {
    return this.min(1);
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<string> {
    if (typeof input !== "string") {
      ctx.addIssue({
        code: "invalid_type",
        expected: "string",
        received: getValueType(input)
      });
      return invalid;
    }

    for (const rule of this.rules) {
      if (rule.kind === "min" && input.length < rule.value) {
        ctx.addIssue({
          code: "too_small",
          kind: "string",
          minimum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "max" && input.length > rule.value) {
        ctx.addIssue({
          code: "too_big",
          kind: "string",
          maximum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "length" && input.length !== rule.value) {
        ctx.addIssue({
          code: input.length < rule.value ? "too_small" : "too_big",
          kind: "string",
          minimum: rule.value,
          maximum: rule.value,
          exact: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "regex" && !regexTest(rule.value, input)) {
        ctx.addIssue({
          code: "invalid_string",
          validation: `pattern ${rule.value}`
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "email" && !EMAIL_RE.test(input)) {
        ctx.addIssue({
          code: "invalid_string",
          validation: "email"
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "url") {
        let validUrl = true;
        try {
          void new URL(input);
        } catch {
          validUrl = false;
        }

        if (!validUrl) {
          ctx.addIssue({
            code: "invalid_string",
            validation: "url"
          });
          if (ctx.abortEarly) {
            return invalid;
          }
        }
        continue;
      }

      if (rule.kind === "uuid" && !UUID_RE.test(input)) {
        ctx.addIssue({
          code: "invalid_string",
          validation: "uuid"
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (
        rule.kind === "datetime" &&
        (!DATETIME_RE.test(input) || Number.isNaN(Date.parse(input)))
      ) {
        ctx.addIssue({
          code: "invalid_string",
          validation: "datetime"
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "slug" && !SLUG_RE.test(input)) {
        ctx.addIssue({
          code: "invalid_string",
          validation: "slug"
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "cuid" && !CUID_RE.test(input)) {
        ctx.addIssue({
          code: "invalid_string",
          validation: "cuid"
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "startsWith" && !input.startsWith(rule.value)) {
        ctx.addIssue({
          code: "invalid_string",
          validation: `startsWith "${rule.value}"`
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "endsWith" && !input.endsWith(rule.value)) {
        ctx.addIssue({
          code: "invalid_string",
          validation: `endsWith "${rule.value}"`
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "includes" && !input.includes(rule.value)) {
        ctx.addIssue({
          code: "invalid_string",
          validation: `includes "${rule.value}"`
        });
        if (ctx.abortEarly) {
          return invalid;
        }
      }
    }

    return ok(input);
  }
}

type NumberRule =
  | { kind: "min"; value: number }
  | { kind: "max"; value: number }
  | { kind: "int" }
  | { kind: "finite" }
  | { kind: "safe" }
  | { kind: "multipleOf"; value: number }
  | { kind: "positive" }
  | { kind: "nonnegative" }
  | { kind: "negative" }
  | { kind: "nonpositive" };

export class NumberSchema extends BaseSchema<number> {
  public constructor(private readonly rules: readonly NumberRule[] = []) {
    super();
  }

  private with(rule: NumberRule): NumberSchema {
    return new NumberSchema([...this.rules, rule]);
  }

  public min(value: number): NumberSchema {
    return this.with({ kind: "min", value });
  }

  public max(value: number): NumberSchema {
    return this.with({ kind: "max", value });
  }

  public int(): NumberSchema {
    return this.with({ kind: "int" });
  }

  public finite(): NumberSchema {
    return this.with({ kind: "finite" });
  }

  public safe(): NumberSchema {
    return this.with({ kind: "safe" });
  }

  public multipleOf(value: number): NumberSchema {
    return this.with({ kind: "multipleOf", value });
  }

  public positive(): NumberSchema {
    return this.with({ kind: "positive" });
  }

  public nonnegative(): NumberSchema {
    return this.with({ kind: "nonnegative" });
  }

  public negative(): NumberSchema {
    return this.with({ kind: "negative" });
  }

  public nonpositive(): NumberSchema {
    return this.with({ kind: "nonpositive" });
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<number> {
    if (typeof input !== "number" || Number.isNaN(input)) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "number",
        received: getValueType(input)
      });
      return invalid;
    }

    for (const rule of this.rules) {
      if (rule.kind === "min" && input < rule.value) {
        ctx.addIssue({
          code: "too_small",
          kind: "number",
          minimum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "max" && input > rule.value) {
        ctx.addIssue({
          code: "too_big",
          kind: "number",
          maximum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "int" && !Number.isInteger(input)) {
        ctx.addIssue({
          code: "invalid_number",
          validation: "integer"
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "finite" && !Number.isFinite(input)) {
        ctx.addIssue({
          code: "invalid_number",
          validation: "finite"
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (
        rule.kind === "safe" &&
        (input < Number.MIN_SAFE_INTEGER || input > Number.MAX_SAFE_INTEGER)
      ) {
        ctx.addIssue({
          code: "invalid_number",
          validation: "safe integer"
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "multipleOf" && input % rule.value !== 0) {
        ctx.addIssue({
          code: "invalid_number",
          validation: `multipleOf ${rule.value}`
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "positive" && input <= 0) {
        ctx.addIssue({
          code: "too_small",
          kind: "number",
          minimum: 0,
          inclusive: false
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "nonnegative" && input < 0) {
        ctx.addIssue({
          code: "too_small",
          kind: "number",
          minimum: 0,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "negative" && input >= 0) {
        ctx.addIssue({
          code: "too_big",
          kind: "number",
          maximum: 0,
          inclusive: false
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "nonpositive" && input > 0) {
        ctx.addIssue({
          code: "too_big",
          kind: "number",
          maximum: 0,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
      }
    }

    return ok(input);
  }
}

export class BooleanSchema extends BaseSchema<boolean> {
  public _parse(input: unknown, ctx: ParseContext): InternalResult<boolean> {
    if (typeof input !== "boolean") {
      ctx.addIssue({
        code: "invalid_type",
        expected: "boolean",
        received: getValueType(input)
      });
      return invalid;
    }
    return ok(input);
  }
}

type DateRule =
  | { kind: "min"; value: Date }
  | { kind: "max"; value: Date };

export class DateSchema extends BaseSchema<Date> {
  public constructor(private readonly rules: readonly DateRule[] = []) {
    super();
  }

  private with(rule: DateRule): DateSchema {
    return new DateSchema([...this.rules, rule]);
  }

  public min(value: Date): DateSchema {
    return this.with({ kind: "min", value });
  }

  public max(value: Date): DateSchema {
    return this.with({ kind: "max", value });
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<Date> {
    if (!(input instanceof Date) || Number.isNaN(input.getTime())) {
      ctx.addIssue({
        code: "invalid_date"
      });
      return invalid;
    }

    for (const rule of this.rules) {
      if (rule.kind === "min" && input.getTime() < rule.value.getTime()) {
        ctx.addIssue({
          code: "too_small",
          kind: "date",
          minimum: BigInt(rule.value.getTime()),
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "max" && input.getTime() > rule.value.getTime()) {
        ctx.addIssue({
          code: "too_big",
          kind: "date",
          maximum: BigInt(rule.value.getTime()),
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
      }
    }

    return ok(input);
  }
}

type BigIntRule =
  | { kind: "min"; value: bigint }
  | { kind: "max"; value: bigint }
  | { kind: "positive" }
  | { kind: "nonnegative" }
  | { kind: "negative" }
  | { kind: "nonpositive" };

export class BigIntSchema extends BaseSchema<bigint> {
  public constructor(private readonly rules: readonly BigIntRule[] = []) {
    super();
  }

  private with(rule: BigIntRule): BigIntSchema {
    return new BigIntSchema([...this.rules, rule]);
  }

  public min(value: bigint): BigIntSchema {
    return this.with({ kind: "min", value });
  }

  public max(value: bigint): BigIntSchema {
    return this.with({ kind: "max", value });
  }

  public positive(): BigIntSchema {
    return this.with({ kind: "positive" });
  }

  public nonnegative(): BigIntSchema {
    return this.with({ kind: "nonnegative" });
  }

  public negative(): BigIntSchema {
    return this.with({ kind: "negative" });
  }

  public nonpositive(): BigIntSchema {
    return this.with({ kind: "nonpositive" });
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<bigint> {
    if (typeof input !== "bigint") {
      ctx.addIssue({
        code: "invalid_type",
        expected: "bigint",
        received: getValueType(input)
      });
      return invalid;
    }

    for (const rule of this.rules) {
      if (rule.kind === "min" && input < rule.value) {
        ctx.addIssue({
          code: "too_small",
          kind: "bigint",
          minimum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "max" && input > rule.value) {
        ctx.addIssue({
          code: "too_big",
          kind: "bigint",
          maximum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "positive" && input <= 0n) {
        ctx.addIssue({
          code: "too_small",
          kind: "bigint",
          minimum: 0n,
          inclusive: false
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "nonnegative" && input < 0n) {
        ctx.addIssue({
          code: "too_small",
          kind: "bigint",
          minimum: 0n,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "negative" && input >= 0n) {
        ctx.addIssue({
          code: "too_big",
          kind: "bigint",
          maximum: 0n,
          inclusive: false
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "nonpositive" && input > 0n) {
        ctx.addIssue({
          code: "too_big",
          kind: "bigint",
          maximum: 0n,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
      }
    }

    return ok(input);
  }
}

export class LiteralSchema<
  TLiteral extends string | number | boolean | null
> extends BaseSchema<TLiteral> {
  public constructor(private readonly literalValue: TLiteral) {
    super();
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<TLiteral> {
    if (!Object.is(input, this.literalValue)) {
      ctx.addIssue({
        code: "invalid_literal",
        literal: this.literalValue
      });
      return invalid;
    }
    return ok(this.literalValue);
  }
}

export class EnumSchema<
  TValues extends readonly [string, ...string[]]
> extends BaseSchema<TValues[number]> {
  private readonly valueSet: Set<string>;

  public constructor(private readonly values: TValues) {
    super();
    this.valueSet = new Set(values);
  }

  public valuesList(): readonly string[] {
    return this.values;
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<TValues[number]> {
    if (typeof input !== "string" || !this.valueSet.has(input)) {
      ctx.addIssue({
        code: "invalid_enum_value",
        options: this.values
      });
      return invalid;
    }
    return ok(input as TValues[number]);
  }
}

export class AnySchema extends BaseSchema<any> {
  public _parse(input: unknown): InternalResult<any> {
    return ok(input);
  }
}

export class UnknownSchema extends BaseSchema<unknown> {
  public _parse(input: unknown): InternalResult<unknown> {
    return ok(input);
  }
}

export class NeverSchema extends BaseSchema<never> {
  public _parse(_input: unknown, ctx: ParseContext): InternalResult<never> {
    ctx.addIssue({
      code: "invalid_type",
      expected: "never",
      received: "unknown"
    });
    return invalid;
  }
}

export class NullSchema extends BaseSchema<null> {
  public _parse(input: unknown, ctx: ParseContext): InternalResult<null> {
    if (input !== null) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "null",
        received: getValueType(input)
      });
      return invalid;
    }
    return ok(null);
  }
}

export class UndefinedSchema extends BaseSchema<undefined> {
  public _parse(input: unknown, ctx: ParseContext): InternalResult<undefined> {
    if (typeof input !== "undefined") {
      ctx.addIssue({
        code: "invalid_type",
        expected: "undefined",
        received: getValueType(input)
      });
      return invalid;
    }
    return ok(undefined);
  }
}

export class InstanceOfSchema<
  TConstructor extends abstract new (...args: never[]) => unknown
> extends BaseSchema<InstanceType<TConstructor>> {
  public constructor(private readonly ctor: TConstructor) {
    super();
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<InstanceType<TConstructor>> {
    if (!(input instanceof this.ctor)) {
      ctx.addIssue({
        code: "invalid_instance",
        constructorName: this.ctor.name || "AnonymousClass"
      });
      return invalid;
    }
    return ok(input as InstanceType<TConstructor>);
  }
}

export type PrimitiveOutput<TSchema extends BaseSchema<any, any>> = OutputOf<TSchema>;
