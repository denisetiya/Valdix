import { invalid, ok } from "../core/context.js";
import type { InternalResult, ParseContext } from "../core/context.js";
import {
  BaseSchema,
  type InputOf,
  type OutputOf
} from "../core/schema.js";
import { getValueType, isPlainObject } from "../core/utils.js";

export type TupleItems = readonly BaseSchema<any, any>[];

export type TupleInput<TItems extends TupleItems> = {
  [K in keyof TItems]: TItems[K] extends BaseSchema<any, infer TInput>
    ? TInput
    : never;
};

export type TupleOutput<TItems extends TupleItems> = {
  [K in keyof TItems]: TItems[K] extends BaseSchema<infer TOutput, any>
    ? TOutput
    : never;
};

export class TupleSchema<
  TItems extends TupleItems
> extends BaseSchema<TupleOutput<TItems>, TupleInput<TItems>> {
  public constructor(private readonly items: TItems) {
    super();
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<TupleOutput<TItems>> {
    if (!Array.isArray(input)) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "array",
        received: getValueType(input)
      });
      return invalid;
    }

    if (input.length !== this.items.length) {
      ctx.addIssue({
        code: "invalid_tuple_length",
        minimum: this.items.length,
        maximum: input.length
      });
      return invalid;
    }

    const output: unknown[] = new Array(this.items.length);

    for (let index = 0; index < this.items.length; index += 1) {
      const itemSchema = this.items[index]!;
      ctx.path.push(index);
      const parsed = itemSchema._parse(input[index], ctx);
      ctx.path.pop();

      if (!parsed.ok) {
        return invalid;
      }

      output[index] = parsed.value;
    }

    return ok(output as TupleOutput<TItems>);
  }

  public async _parseAsync(
    input: unknown,
    ctx: ParseContext
  ): Promise<InternalResult<TupleOutput<TItems>>> {
    if (!Array.isArray(input)) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "array",
        received: getValueType(input)
      });
      return invalid;
    }

    if (input.length !== this.items.length) {
      ctx.addIssue({
        code: "invalid_tuple_length",
        minimum: this.items.length,
        maximum: input.length
      });
      return invalid;
    }

    const output: unknown[] = new Array(this.items.length);

    for (let index = 0; index < this.items.length; index += 1) {
      const itemSchema = this.items[index]!;
      ctx.path.push(index);
      const parsed = await itemSchema._parseAsync(input[index], ctx);
      ctx.path.pop();

      if (!parsed.ok) {
        return invalid;
      }

      output[index] = parsed.value;
    }

    return ok(output as TupleOutput<TItems>);
  }
}

export class RecordSchema<
  TValue extends BaseSchema<any, any>
> extends BaseSchema<Record<string, OutputOf<TValue>>, Record<string, InputOf<TValue>>> {
  public constructor(private readonly valueSchema: TValue) {
    super();
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<Record<string, OutputOf<TValue>>> {
    if (!isPlainObject(input)) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "object",
        received: getValueType(input)
      });
      return invalid;
    }

    const output: Record<string, OutputOf<TValue>> = {};
    let hasError = false;

    for (const key of Object.keys(input)) {
      ctx.path.push(key);
      const parsed = this.valueSchema._parse(input[key], ctx);
      ctx.path.pop();

      if (!parsed.ok) {
        hasError = true;
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      output[key] = parsed.value;
    }

    if (hasError) {
      return invalid;
    }

    return ok(output);
  }

  public async _parseAsync(
    input: unknown,
    ctx: ParseContext
  ): Promise<InternalResult<Record<string, OutputOf<TValue>>>> {
    if (!isPlainObject(input)) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "object",
        received: getValueType(input)
      });
      return invalid;
    }

    const output: Record<string, OutputOf<TValue>> = {};
    let hasError = false;

    for (const key of Object.keys(input)) {
      ctx.path.push(key);
      const parsed = await this.valueSchema._parseAsync(input[key], ctx);
      ctx.path.pop();

      if (!parsed.ok) {
        hasError = true;
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      output[key] = parsed.value;
    }

    if (hasError) {
      return invalid;
    }

    return ok(output);
  }
}

export class StrictRecordSchema<
  TKey extends BaseSchema<string, any>,
  TValue extends BaseSchema<any, any>
> extends BaseSchema<Record<string, OutputOf<TValue>>, Record<string, InputOf<TValue>>> {
  public constructor(
    private readonly keySchema: TKey,
    private readonly valueSchema: TValue
  ) {
    super();
  }

  public _parse(
    input: unknown,
    ctx: ParseContext
  ): InternalResult<Record<string, OutputOf<TValue>>> {
    if (!isPlainObject(input)) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "object",
        received: getValueType(input)
      });
      return invalid;
    }

    const output: Record<string, OutputOf<TValue>> = {};
    let hasError = false;

    for (const rawKey of Object.keys(input)) {
      const rawValue = input[rawKey];

      ctx.path.push(rawKey);
      const parsedKey = this.keySchema._parse(rawKey, ctx);
      const parsedValue = this.valueSchema._parse(rawValue, ctx);
      ctx.path.pop();

      if (!parsedKey.ok || !parsedValue.ok) {
        hasError = true;
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      output[parsedKey.value] = parsedValue.value;
    }

    if (hasError) {
      return invalid;
    }

    return ok(output);
  }

  public async _parseAsync(
    input: unknown,
    ctx: ParseContext
  ): Promise<InternalResult<Record<string, OutputOf<TValue>>>> {
    if (!isPlainObject(input)) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "object",
        received: getValueType(input)
      });
      return invalid;
    }

    const output: Record<string, OutputOf<TValue>> = {};
    let hasError = false;

    for (const rawKey of Object.keys(input)) {
      const rawValue = input[rawKey];

      ctx.path.push(rawKey);
      const parsedKey = await this.keySchema._parseAsync(rawKey, ctx);
      const parsedValue = await this.valueSchema._parseAsync(rawValue, ctx);
      ctx.path.pop();

      if (!parsedKey.ok || !parsedValue.ok) {
        hasError = true;
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      output[parsedKey.value] = parsedValue.value;
    }

    if (hasError) {
      return invalid;
    }

    return ok(output);
  }
}

type SetRule =
  | { kind: "min"; value: number }
  | { kind: "max"; value: number };

export class SetSchema<
  TItem extends BaseSchema<any, any>
> extends BaseSchema<Set<OutputOf<TItem>>, Set<InputOf<TItem>>> {
  public constructor(
    private readonly itemSchema: TItem,
    private readonly rules: readonly SetRule[] = []
  ) {
    super();
  }

  private with(rule: SetRule): SetSchema<TItem> {
    return new SetSchema(this.itemSchema, [...this.rules, rule]);
  }

  public min(value: number): SetSchema<TItem> {
    return this.with({ kind: "min", value });
  }

  public max(value: number): SetSchema<TItem> {
    return this.with({ kind: "max", value });
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<Set<OutputOf<TItem>>> {
    if (!(input instanceof Set)) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "set",
        received: getValueType(input)
      });
      return invalid;
    }

    for (const rule of this.rules) {
      if (rule.kind === "min" && input.size < rule.value) {
        ctx.addIssue({
          code: "too_small",
          kind: "set",
          minimum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }
      if (rule.kind === "max" && input.size > rule.value) {
        ctx.addIssue({
          code: "too_big",
          kind: "set",
          maximum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
      }
    }

    const output = new Set<OutputOf<TItem>>();
    let index = 0;

    for (const item of input) {
      ctx.path.push(index);
      const parsed = this.itemSchema._parse(item, ctx);
      ctx.path.pop();
      index += 1;

      if (!parsed.ok) {
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }
      output.add(parsed.value);
    }

    if (ctx.issues.length > 0) {
      return invalid;
    }

    return ok(output);
  }

  public async _parseAsync(
    input: unknown,
    ctx: ParseContext
  ): Promise<InternalResult<Set<OutputOf<TItem>>>> {
    if (!(input instanceof Set)) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "set",
        received: getValueType(input)
      });
      return invalid;
    }

    for (const rule of this.rules) {
      if (rule.kind === "min" && input.size < rule.value) {
        ctx.addIssue({
          code: "too_small",
          kind: "set",
          minimum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }
      if (rule.kind === "max" && input.size > rule.value) {
        ctx.addIssue({
          code: "too_big",
          kind: "set",
          maximum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
      }
    }

    const output = new Set<OutputOf<TItem>>();
    let index = 0;

    for (const item of input) {
      ctx.path.push(index);
      const parsed = await this.itemSchema._parseAsync(item, ctx);
      ctx.path.pop();
      index += 1;

      if (!parsed.ok) {
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }
      output.add(parsed.value);
    }

    if (ctx.issues.length > 0) {
      return invalid;
    }

    return ok(output);
  }
}

type MapRule =
  | { kind: "min"; value: number }
  | { kind: "max"; value: number };

export class MapSchema<
  TKey extends BaseSchema<any, any>,
  TValue extends BaseSchema<any, any>
> extends BaseSchema<Map<OutputOf<TKey>, OutputOf<TValue>>, Map<InputOf<TKey>, InputOf<TValue>>> {
  public constructor(
    private readonly keySchema: TKey,
    private readonly valueSchema: TValue,
    private readonly rules: readonly MapRule[] = []
  ) {
    super();
  }

  private with(rule: MapRule): MapSchema<TKey, TValue> {
    return new MapSchema(this.keySchema, this.valueSchema, [...this.rules, rule]);
  }

  public min(value: number): MapSchema<TKey, TValue> {
    return this.with({ kind: "min", value });
  }

  public max(value: number): MapSchema<TKey, TValue> {
    return this.with({ kind: "max", value });
  }

  public _parse(
    input: unknown,
    ctx: ParseContext
  ): InternalResult<Map<OutputOf<TKey>, OutputOf<TValue>>> {
    if (!(input instanceof Map)) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "map",
        received: getValueType(input)
      });
      return invalid;
    }

    for (const rule of this.rules) {
      if (rule.kind === "min" && input.size < rule.value) {
        ctx.addIssue({
          code: "too_small",
          kind: "map",
          minimum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }
      if (rule.kind === "max" && input.size > rule.value) {
        ctx.addIssue({
          code: "too_big",
          kind: "map",
          maximum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
      }
    }

    const output = new Map<OutputOf<TKey>, OutputOf<TValue>>();
    let index = 0;

    for (const [key, value] of input) {
      ctx.path.push(index);
      const parsedKey = this.keySchema._parse(key, ctx);
      const parsedValue = this.valueSchema._parse(value, ctx);
      ctx.path.pop();
      index += 1;

      if (!parsedKey.ok || !parsedValue.ok) {
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      output.set(parsedKey.value, parsedValue.value);
    }

    if (ctx.issues.length > 0) {
      return invalid;
    }

    return ok(output);
  }

  public async _parseAsync(
    input: unknown,
    ctx: ParseContext
  ): Promise<InternalResult<Map<OutputOf<TKey>, OutputOf<TValue>>>> {
    if (!(input instanceof Map)) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "map",
        received: getValueType(input)
      });
      return invalid;
    }

    for (const rule of this.rules) {
      if (rule.kind === "min" && input.size < rule.value) {
        ctx.addIssue({
          code: "too_small",
          kind: "map",
          minimum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }
      if (rule.kind === "max" && input.size > rule.value) {
        ctx.addIssue({
          code: "too_big",
          kind: "map",
          maximum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
      }
    }

    const output = new Map<OutputOf<TKey>, OutputOf<TValue>>();
    let index = 0;

    for (const [key, value] of input) {
      ctx.path.push(index);
      const parsedKey = await this.keySchema._parseAsync(key, ctx);
      const parsedValue = await this.valueSchema._parseAsync(value, ctx);
      ctx.path.pop();
      index += 1;

      if (!parsedKey.ok || !parsedValue.ok) {
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      output.set(parsedKey.value, parsedValue.value);
    }

    if (ctx.issues.length > 0) {
      return invalid;
    }

    return ok(output);
  }
}
