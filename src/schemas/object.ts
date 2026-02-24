import { invalid, ok } from "../core/context.js";
import type { InternalResult, ParseContext } from "../core/context.js";
import {
  ArraySchema,
  BaseSchema,
  OptionalSchema,
  type InputOf,
  type OutputOf
} from "../core/schema.js";
import { getValueType, hasOwn, isPlainObject } from "../core/utils.js";
import { EnumSchema } from "./primitives.js";

export type ObjectShape = Record<string, BaseSchema<any, any>>;

type UnwrapOptional<TSchema extends BaseSchema<any, any>> =
  TSchema extends OptionalSchema<infer TInner>
    ? TInner
    : TSchema;

type RequiredShape<TShape extends ObjectShape> = {
  [K in keyof TShape]: UnwrapOptional<TShape[K]>;
};

type RequiredShapeByKeys<
  TShape extends ObjectShape,
  TKeys extends readonly (keyof TShape)[]
> = {
  [K in keyof TShape]: K extends TKeys[number]
    ? UnwrapOptional<TShape[K]>
    : TShape[K];
};

type DeepPartialSchema<TSchema extends BaseSchema<any, any>> =
  TSchema extends ObjectSchema<infer TInnerShape>
    ? ObjectSchema<DeepPartialShape<TInnerShape>>
    : TSchema extends ArraySchema<infer TItem>
      ? ArraySchema<DeepPartialSchema<TItem>>
      : TSchema;

type DeepPartialShape<TShape extends ObjectShape> = {
  [K in keyof TShape]: OptionalSchema<DeepPartialSchema<UnwrapOptional<TShape[K]>>>;
};

type Simplify<T> = {
  [K in keyof T]: T[K];
} & {};

type OptionalInputKeys<TShape extends ObjectShape> = {
  [K in keyof TShape]-?: undefined extends InputOf<TShape[K]>
    ? K
    : never;
}[keyof TShape];

type RequiredInputKeys<TShape extends ObjectShape> = Exclude<
  keyof TShape,
  OptionalInputKeys<TShape>
>;

type OptionalOutputKeys<TShape extends ObjectShape> = {
  [K in keyof TShape]-?: undefined extends OutputOf<TShape[K]>
    ? K
    : never;
}[keyof TShape];

type RequiredOutputKeys<TShape extends ObjectShape> = Exclude<
  keyof TShape,
  OptionalOutputKeys<TShape>
>;

export type ObjectInput<TShape extends ObjectShape> = Simplify<
  {
    [K in RequiredInputKeys<TShape>]: InputOf<TShape[K]>;
  } & {
    [K in OptionalInputKeys<TShape>]?: InputOf<TShape[K]>;
  }
>;

export type ObjectOutput<TShape extends ObjectShape> = Simplify<
  {
    [K in RequiredOutputKeys<TShape>]: OutputOf<TShape[K]>;
  } & {
    [K in OptionalOutputKeys<TShape>]?: OutputOf<TShape[K]>;
  }
>;

type UnknownKeyPolicy = "strip" | "passthrough" | "strict";

const acceptsMissingKey = (
  schema: BaseSchema<any, any>,
  ctx: ParseContext
): { accepted: true; value: unknown } | { accepted: false } => {
  const probeContext = ctx.fork();
  const parsed = schema._parse(undefined, probeContext);
  if (parsed.ok && probeContext.issues.length === 0) {
    return {
      accepted: true,
      value: parsed.value
    };
  }

  return { accepted: false };
};

export class ObjectSchema<
  TShape extends ObjectShape
> extends BaseSchema<ObjectOutput<TShape>, ObjectInput<TShape>> {
  protected readonly shape: TShape;
  protected readonly policy: UnknownKeyPolicy;
  private readonly shapeKeys: (keyof TShape)[];

  public constructor(
    shape: TShape,
    policy: UnknownKeyPolicy = "strip"
  ) {
    super();
    this.shape = shape;
    this.policy = policy;
    this.shapeKeys = Object.keys(shape) as (keyof TShape)[];
  }

  public strict(): ObjectSchema<TShape> {
    return new ObjectSchema(this.shape, "strict");
  }

  public passthrough(): ObjectSchema<TShape> {
    return new ObjectSchema(this.shape, "passthrough");
  }

  public strip(): ObjectSchema<TShape> {
    return new ObjectSchema(this.shape, "strip");
  }

  public extend<TNext extends ObjectShape>(
    nextShape: TNext
  ): ObjectSchema<TShape & TNext> {
    return new ObjectSchema(
      { ...this.shape, ...nextShape } as TShape & TNext,
      this.policy
    );
  }

  public merge<TNext extends ObjectShape>(
    other: ObjectSchema<TNext>
  ): ObjectSchema<TShape & TNext> {
    return new ObjectSchema(
      { ...this.shape, ...other.shape } as TShape & TNext,
      this.policy
    );
  }

  public pick<TKeys extends readonly (keyof TShape)[]>(
    keys: TKeys
  ): ObjectSchema<Pick<TShape, TKeys[number]>> {
    const picked = {} as Pick<TShape, TKeys[number]>;
    for (const key of keys) {
      picked[key] = this.shape[key];
    }
    return new ObjectSchema(picked, this.policy);
  }

  public omit<TKeys extends readonly (keyof TShape)[]>(
    keys: TKeys
  ): ObjectSchema<Omit<TShape, TKeys[number]>> {
    const omitted = { ...this.shape } as Omit<TShape, TKeys[number]> & Record<string, unknown>;
    for (const key of keys) {
      delete omitted[String(key)];
    }
    return new ObjectSchema(omitted as Omit<TShape, TKeys[number]>, this.policy);
  }

  public partial(): ObjectSchema<{ [K in keyof TShape]: OptionalSchema<TShape[K]> }> {
    const partialShape = {} as {
      [K in keyof TShape]: OptionalSchema<TShape[K]>;
    };

    for (const key of this.shapeKeys) {
      const fieldSchema = this.shape[key] as TShape[typeof key];
      partialShape[key] = fieldSchema.optional() as OptionalSchema<TShape[typeof key]>;
    }

    return new ObjectSchema(partialShape, this.policy);
  }

  public deepPartial(): ObjectSchema<DeepPartialShape<TShape>> {
    const partialShape = {} as DeepPartialShape<TShape>;

    for (const key of this.shapeKeys) {
      const fieldSchema = this.shape[key] as BaseSchema<any, any>;
      const unwrapped = fieldSchema instanceof OptionalSchema
        ? fieldSchema.unwrap()
        : fieldSchema;

      const deepSchema = this.deepPartialSchema(
        unwrapped
      ) as DeepPartialSchema<UnwrapOptional<TShape[typeof key]>>;

      partialShape[key] = deepSchema.optional() as DeepPartialShape<TShape>[typeof key];
    }

    return new ObjectSchema(partialShape, this.policy);
  }

  public required(): ObjectSchema<RequiredShape<TShape>>;
  public required<TKeys extends readonly (keyof TShape)[]>(
    keys: TKeys
  ): ObjectSchema<RequiredShapeByKeys<TShape, TKeys>>;
  public required(
    keys?: readonly (keyof TShape)[]
  ): ObjectSchema<any> {
    const requiredShape: ObjectShape = {};
    const targetKeys = keys
      ? new Set(keys.map((key) => String(key)))
      : undefined;

    for (const key of this.shapeKeys) {
      const keyString = String(key);
      const schema = this.shape[key] as BaseSchema<any, any>;
      const shouldRequire = !targetKeys || targetKeys.has(keyString);

      if (shouldRequire && schema instanceof OptionalSchema) {
        requiredShape[keyString] = schema.unwrap();
        continue;
      }

      requiredShape[keyString] = schema;
    }

    return new ObjectSchema(requiredShape, this.policy);
  }

  public keyof(): EnumSchema<[Extract<keyof TShape, string>, ...Extract<keyof TShape, string>[]]> {
    const keys = this.shapeKeys as Extract<keyof TShape, string>[];
    if (keys.length === 0) {
      throw new Error("Cannot build keyof() from empty object shape.");
    }
    return new EnumSchema(keys as [Extract<keyof TShape, string>, ...Extract<keyof TShape, string>[]]);
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<ObjectOutput<TShape>> {
    if (!isPlainObject(input)) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "object",
        received: getValueType(input)
      });
      return invalid;
    }

    const source = input as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    let hasError = false;

    for (const key of this.shapeKeys) {
      const keyString = String(key);
      const schema = this.shape[key] as TShape[typeof key];
      const exists = hasOwn(source, keyString);

      if (!exists) {
        const missing = acceptsMissingKey(schema, ctx);
        if (missing.accepted) {
          if (typeof missing.value !== "undefined") {
            output[keyString] = missing.value;
          }
          continue;
        }

        ctx.path.push(keyString);
        ctx.addIssue({
          code: "required"
        });
        ctx.path.pop();
        hasError = true;
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      const rawValue = source[keyString];
      ctx.path.push(keyString);
      const parsed = schema._parse(rawValue, ctx);
      ctx.path.pop();

      if (!parsed.ok) {
        hasError = true;
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (typeof parsed.value !== "undefined") {
        output[keyString] = parsed.value;
      }
    }

    const sourceKeys = Object.keys(source);
    const unknownKeys = sourceKeys.filter((key) => !hasOwn(this.shape, key));

    if (this.policy === "strict" && unknownKeys.length > 0) {
      ctx.addIssue({
        code: "unknown_keys",
        keys: unknownKeys
      });
      hasError = true;
      if (ctx.abortEarly) {
        return invalid;
      }
    } else if (this.policy === "passthrough" && unknownKeys.length > 0) {
      for (const key of unknownKeys) {
        output[key] = source[key];
      }
    }

    if (hasError) {
      return invalid;
    }

    return ok(output as ObjectOutput<TShape>);
  }

  private deepPartialSchema<TSchema extends BaseSchema<any, any>>(
    schema: TSchema
  ): BaseSchema<any, any> {
    if (schema instanceof OptionalSchema) {
      return this.deepPartialSchema(schema.unwrap()).optional();
    }

    if (schema instanceof ObjectSchema) {
      return schema.deepPartial();
    }

    if (schema instanceof ArraySchema) {
      const itemSchema = schema.getItemSchema();
      return schema.withItem(this.deepPartialSchema(itemSchema));
    }

    return schema;
  }
}
