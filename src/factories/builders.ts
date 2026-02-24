import {
  ArraySchema,
  BaseSchema,
  IntersectionSchema,
  PreprocessSchema,
  UnionSchema
} from "../core/schema.js";
import type {
  UnionOptions
} from "../core/schema.js";
import {
  BigIntSchema,
  BooleanSchema,
  DateSchema,
  EnumSchema,
  InstanceOfSchema,
  LiteralSchema,
  NeverSchema,
  NullSchema,
  NumberSchema,
  StringSchema,
  UndefinedSchema,
  UnknownSchema,
  AnySchema
} from "../schemas/primitives.js";
import {
  MapSchema,
  RecordSchema,
  SetSchema,
  StrictRecordSchema,
  TupleSchema,
  type TupleItems
} from "../schemas/collections.js";
import {
  ObjectSchema,
  type ObjectShape
} from "../schemas/object.js";
import { DiscriminatedUnionSchema } from "../schemas/advanced.js";

export const string = (): StringSchema => new StringSchema();
export const number = (): NumberSchema => new NumberSchema();
export const bigint = (): BigIntSchema => new BigIntSchema();
export const boolean = (): BooleanSchema => new BooleanSchema();
export const date = (): DateSchema => new DateSchema();
export const literal = <const TLiteral extends string | number | boolean | null>(
  value: TLiteral
): LiteralSchema<TLiteral> => new LiteralSchema(value);
export const enumValues = <const TValues extends readonly [string, ...string[]]>(
  values: TValues
): EnumSchema<TValues> => new EnumSchema(values);
export const any = (): AnySchema => new AnySchema();
export const unknown = (): UnknownSchema => new UnknownSchema();
export const never = (): NeverSchema => new NeverSchema();
export const nullType = (): NullSchema => new NullSchema();
export const undefinedType = (): UndefinedSchema => new UndefinedSchema();
export const instanceOf = <TConstructor extends abstract new (...args: never[]) => unknown>(
  constructorFn: TConstructor
): InstanceOfSchema<TConstructor> => new InstanceOfSchema(constructorFn);

export const object = <TShape extends ObjectShape>(
  shape: TShape
): ObjectSchema<TShape> => new ObjectSchema(shape);
export const strictObject = <TShape extends ObjectShape>(
  shape: TShape
): ObjectSchema<TShape> => new ObjectSchema(shape).strict();
export const array = <TItem extends BaseSchema<any, any>>(
  item: TItem
): ArraySchema<TItem> => new ArraySchema(item);
export const tuple = <TItems extends TupleItems>(
  items: TItems
): TupleSchema<TItems> => new TupleSchema(items);
export const record = <TValue extends BaseSchema<any, any>>(
  valueSchema: TValue
): RecordSchema<TValue> => new RecordSchema(valueSchema);
export const strictRecord = <
  TKey extends BaseSchema<string, any>,
  TValue extends BaseSchema<any, any>
>(
  keySchema: TKey,
  valueSchema: TValue
): StrictRecordSchema<TKey, TValue> => new StrictRecordSchema(keySchema, valueSchema);
export const set = <TItem extends BaseSchema<any, any>>(
  itemSchema: TItem
): SetSchema<TItem> => new SetSchema(itemSchema);
export const map = <
  TKey extends BaseSchema<any, any>,
  TValue extends BaseSchema<any, any>
>(
  keySchema: TKey,
  valueSchema: TValue
): MapSchema<TKey, TValue> => new MapSchema(keySchema, valueSchema);
export const union = <TOptions extends UnionOptions>(
  options: TOptions
): UnionSchema<TOptions> => new UnionSchema(options);
export const intersection = <
  TLeft extends BaseSchema<any, any>,
  TRight extends BaseSchema<any, any>
>(
  left: TLeft,
  right: TRight
): IntersectionSchema<TLeft, TRight> => new IntersectionSchema(left, right);
export const discriminatedUnion = <
  TDiscriminator extends string,
  TOptions extends Record<string, BaseSchema<any, any>>
>(
  discriminator: TDiscriminator,
  options: TOptions
): DiscriminatedUnionSchema<TDiscriminator, TOptions> =>
  new DiscriminatedUnionSchema(discriminator, options);

export const preprocess = <TInput, TSchema extends BaseSchema<any, any>>(
  fn: (input: TInput) => unknown,
  schema: TSchema
): PreprocessSchema<TInput, TSchema> => new PreprocessSchema(fn, schema);

const coerceString = (): PreprocessSchema<unknown, StringSchema> =>
  preprocess((value: unknown) => {
    if (value === null || typeof value === "undefined") {
      return value;
    }
    return String(value);
  }, string());

const coerceNumber = (): PreprocessSchema<unknown, NumberSchema> =>
  preprocess((value: unknown) => {
    if (typeof value === "number") {
      return value;
    }
    return Number(value);
  }, number());

const coerceBigInt = (): PreprocessSchema<unknown, BigIntSchema> =>
  preprocess((value: unknown) => {
    if (typeof value === "bigint") {
      return value;
    }
    if (typeof value === "number" || typeof value === "string") {
      try {
        return BigInt(value);
      } catch {
        return value;
      }
    }
    return value;
  }, bigint());

const coerceBoolean = (): PreprocessSchema<unknown, BooleanSchema> =>
  preprocess((value: unknown) => {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true" || normalized === "1") {
        return true;
      }
      if (normalized === "false" || normalized === "0" || normalized === "") {
        return false;
      }
    }

    return Boolean(value);
  }, boolean());

const coerceDate = (): PreprocessSchema<unknown, DateSchema> =>
  preprocess((value: unknown) => {
    if (value instanceof Date) {
      return value;
    }
    return new Date(value as string | number);
  }, date());

export const coerce = {
  string: coerceString,
  number: coerceNumber,
  bigint: coerceBigInt,
  boolean: coerceBoolean,
  date: coerceDate
};
