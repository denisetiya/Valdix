import {
  ArraySchema,
  AsyncRefinementSchema,
  AsyncSuperRefinementSchema,
  BaseSchema,
  BrandSchema,
  CatchSchema,
  DefaultSchema,
  IntersectionSchema,
  MetadataSchema,
  NullableSchema,
  OptionalSchema,
  PipelineSchema,
  PreprocessSchema,
  RefinementSchema,
  SuperRefinementSchema,
  TransformSchema,
  UnionSchema
} from "./schema.js";
import type { SchemaMetadata } from "./types.js";
import {
  AnySchema,
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
  UnknownSchema
} from "../schemas/primitives.js";
import {
  MapSchema,
  RecordSchema,
  SetSchema,
  StrictRecordSchema,
  TupleSchema
} from "../schemas/collections.js";
import { ObjectSchema } from "../schemas/object.js";
import { DiscriminatedUnionSchema } from "../schemas/advanced.js";

export type JSONSchema = Record<string, unknown>;
export type OpenAPISchema = Record<string, unknown>;

interface SchemaBuildOptions {
  openapi: boolean;
}

const addMetadata = (
  schema: JSONSchema,
  metadata: SchemaMetadata
): JSONSchema => ({
  ...schema,
  ...metadata
});

const withBrand = (
  schema: JSONSchema,
  brandName?: string
): JSONSchema => {
  if (!brandName) {
    return {
      ...schema,
      "x-brand": true
    };
  }

  return {
    ...schema,
    "x-brand": brandName
  };
};

const withNullable = (
  schema: JSONSchema,
  options: SchemaBuildOptions
): JSONSchema => {
  if (options.openapi) {
    return {
      ...schema,
      nullable: true
    };
  }

  return {
    anyOf: [
      schema,
      { type: "null" }
    ]
  };
};

const buildStringSchema = (
  schema: StringSchema
): JSONSchema => {
  const rules = (schema as unknown as {
    rules: Array<{
      kind: string;
      value?: string | number | RegExp;
    }>;
  }).rules;

  let json: JSONSchema = { type: "string" };
  const patternParts: string[] = [];

  for (const rule of rules) {
    if (rule.kind === "min" && typeof rule.value === "number") {
      json = { ...json, minLength: rule.value };
      continue;
    }
    if (rule.kind === "max" && typeof rule.value === "number") {
      json = { ...json, maxLength: rule.value };
      continue;
    }
    if (rule.kind === "length" && typeof rule.value === "number") {
      json = {
        ...json,
        minLength: rule.value,
        maxLength: rule.value
      };
      continue;
    }
    if (rule.kind === "email") {
      json = { ...json, format: "email" };
      continue;
    }
    if (rule.kind === "url") {
      json = { ...json, format: "uri" };
      continue;
    }
    if (rule.kind === "uuid") {
      json = { ...json, format: "uuid" };
      continue;
    }
    if (rule.kind === "datetime") {
      json = { ...json, format: "date-time" };
      continue;
    }
    if (rule.kind === "slug") {
      patternParts.push("^[a-z0-9]+(?:-[a-z0-9]+)*$");
      continue;
    }
    if (rule.kind === "cuid") {
      patternParts.push("^c[^\\s-]{8,}$");
      continue;
    }
    if (rule.kind === "regex" && rule.value instanceof RegExp) {
      patternParts.push(rule.value.source);
      continue;
    }
  }

  if (patternParts.length > 0) {
    json = {
      ...json,
      pattern: patternParts[patternParts.length - 1]
    };
  }

  return json;
};

const buildNumberSchema = (
  schema: NumberSchema
): JSONSchema => {
  const rules = (schema as unknown as {
    rules: Array<{
      kind: string;
      value?: number;
    }>;
  }).rules;

  let json: JSONSchema = { type: "number" };

  for (const rule of rules) {
    if (rule.kind === "min" && typeof rule.value === "number") {
      json = { ...json, minimum: rule.value };
      continue;
    }
    if (rule.kind === "max" && typeof rule.value === "number") {
      json = { ...json, maximum: rule.value };
      continue;
    }
    if (rule.kind === "int") {
      json = { ...json, type: "integer" };
      continue;
    }
    if (rule.kind === "multipleOf" && typeof rule.value === "number") {
      json = { ...json, multipleOf: rule.value };
      continue;
    }
    if (rule.kind === "positive") {
      json = { ...json, exclusiveMinimum: 0 };
      continue;
    }
    if (rule.kind === "nonnegative") {
      json = { ...json, minimum: 0 };
      continue;
    }
    if (rule.kind === "negative") {
      json = { ...json, exclusiveMaximum: 0 };
      continue;
    }
    if (rule.kind === "nonpositive") {
      json = { ...json, maximum: 0 };
    }
  }

  return json;
};

const buildBigIntSchema = (schema: BigIntSchema): JSONSchema => {
  const rules = (schema as unknown as {
    rules: Array<{
      kind: string;
      value?: bigint;
    }>;
  }).rules;

  let json: JSONSchema = {
    type: "string",
    pattern: "^-?[0-9]+$",
    "x-valdix-type": "bigint"
  };

  for (const rule of rules) {
    if (rule.kind === "min" && typeof rule.value !== "undefined") {
      json = { ...json, "x-minimum": String(rule.value) };
      continue;
    }
    if (rule.kind === "max" && typeof rule.value !== "undefined") {
      json = { ...json, "x-maximum": String(rule.value) };
      continue;
    }
  }

  return json;
};

const unwrapOptional = (
  schema: BaseSchema<any, any>
): { schema: BaseSchema<any, any>; optional: boolean } => {
  let current = schema;
  let optional = false;

  while (current instanceof OptionalSchema) {
    optional = true;
    current = current.unwrap();
  }

  return {
    schema: current,
    optional
  };
};

const buildSchemaInternal = (
  inputSchema: BaseSchema<any, any>,
  options: SchemaBuildOptions
): JSONSchema => {
  let schema = inputSchema;
  const metadataChain: SchemaMetadata[] = [];
  let brandName: string | undefined;

  while (true) {
    if (schema instanceof MetadataSchema) {
      metadataChain.push(schema.meta);
      schema = schema.unwrap();
      continue;
    }

    if (schema instanceof BrandSchema) {
      const nextBrand = schema.brandName;
      if (typeof nextBrand === "string") {
        brandName = nextBrand;
      }
      schema = schema.unwrap();
      continue;
    }

    if (schema instanceof CatchSchema) {
      schema = (schema as unknown as { inner: BaseSchema<any, any> }).inner;
      continue;
    }

    if (schema instanceof RefinementSchema || schema instanceof AsyncRefinementSchema) {
      schema = (schema as unknown as { inner: BaseSchema<any, any> }).inner;
      continue;
    }

    if (schema instanceof SuperRefinementSchema || schema instanceof AsyncSuperRefinementSchema) {
      schema = (schema as unknown as { inner: BaseSchema<any, any> }).inner;
      continue;
    }

    if (schema instanceof TransformSchema) {
      const inner = (schema as unknown as { inner: BaseSchema<any, any> }).inner;
      const built = buildSchemaInternal(inner, options);
      let next: JSONSchema = {
        ...built,
        "x-valdix-transform": true
      };
      if (brandName) {
        next = withBrand(next, brandName);
      }
      for (const metadata of metadataChain) {
        next = addMetadata(next, metadata);
      }
      return next;
    }

    if (schema instanceof PreprocessSchema) {
      const inner = (schema as unknown as { inner: BaseSchema<any, any> }).inner;
      const built = buildSchemaInternal(inner, options);
      let next: JSONSchema = {
        ...built,
        "x-valdix-preprocess": true
      };
      if (brandName) {
        next = withBrand(next, brandName);
      }
      for (const metadata of metadataChain) {
        next = addMetadata(next, metadata);
      }
      return next;
    }

    break;
  }

  let json: JSONSchema;

  if (schema instanceof OptionalSchema) {
    const optional = unwrapOptional(schema);
    json = buildSchemaInternal(optional.schema, options);
    json = { ...json, "x-valdix-optional": true };
  } else if (schema instanceof NullableSchema) {
    const inner = (schema as unknown as { inner: BaseSchema<any, any> }).inner;
    json = withNullable(buildSchemaInternal(inner, options), options);
  } else if (schema instanceof DefaultSchema) {
    const inner = (schema as unknown as { inner: BaseSchema<any, any> }).inner;
    const fallback = (schema as unknown as {
      fallback: unknown | (() => unknown);
    }).fallback;
    const innerJson = buildSchemaInternal(inner, options);
    json = {
      ...innerJson,
      ...(typeof fallback === "function"
        ? {}
        : { default: fallback })
    };
  } else if (schema instanceof StringSchema) {
    json = buildStringSchema(schema);
  } else if (schema instanceof NumberSchema) {
    json = buildNumberSchema(schema);
  } else if (schema instanceof BigIntSchema) {
    json = buildBigIntSchema(schema);
  } else if (schema instanceof BooleanSchema) {
    json = { type: "boolean" };
  } else if (schema instanceof DateSchema) {
    json = { type: "string", format: "date-time" };
  } else if (schema instanceof LiteralSchema) {
    const literalValue = (schema as unknown as { literalValue: unknown }).literalValue;
    json = { const: literalValue };
  } else if (schema instanceof EnumSchema) {
    const values = (schema as unknown as { values: readonly string[] }).values;
    json = {
      type: "string",
      enum: [...values]
    };
  } else if (schema instanceof AnySchema || schema instanceof UnknownSchema) {
    json = {};
  } else if (schema instanceof NeverSchema) {
    json = { not: {} };
  } else if (schema instanceof NullSchema) {
    json = { type: "null" };
  } else if (schema instanceof UndefinedSchema) {
    json = {
      "x-valdix-type": "undefined"
    };
  } else if (schema instanceof InstanceOfSchema) {
    const ctor = (schema as unknown as { ctor: { name?: string } }).ctor;
    json = {
      type: "object",
      "x-instanceof": ctor?.name ?? "AnonymousClass"
    };
  } else if (schema instanceof ArraySchema) {
    const itemSchema = schema.getItemSchema();
    const rules = (schema as unknown as {
      rules: Array<{
        kind: string;
        value: number;
      }>;
      uniqueSelector?: unknown;
    }).rules;
    let arrayJson: JSONSchema = {
      type: "array",
      items: buildSchemaInternal(itemSchema, options)
    };

    for (const rule of rules) {
      if (rule.kind === "min") {
        arrayJson = { ...arrayJson, minItems: rule.value };
        continue;
      }
      if (rule.kind === "max") {
        arrayJson = { ...arrayJson, maxItems: rule.value };
        continue;
      }
      if (rule.kind === "length") {
        arrayJson = {
          ...arrayJson,
          minItems: rule.value,
          maxItems: rule.value
        };
      }
    }

    if ((schema as unknown as { uniqueSelector?: unknown }).uniqueSelector) {
      arrayJson = {
        ...arrayJson,
        "x-valdix-unique": true
      };
    }

    json = arrayJson;
  } else if (schema instanceof TupleSchema) {
    const items = (schema as unknown as { items: BaseSchema<any, any>[] }).items;
    const tupleItems = items.map((item) => buildSchemaInternal(item, options));
    json = {
      type: "array",
      prefixItems: tupleItems,
      minItems: tupleItems.length,
      maxItems: tupleItems.length
    };
  } else if (schema instanceof RecordSchema) {
    const valueSchema = (schema as unknown as { valueSchema: BaseSchema<any, any> }).valueSchema;
    json = {
      type: "object",
      additionalProperties: buildSchemaInternal(valueSchema, options)
    };
  } else if (schema instanceof StrictRecordSchema) {
    const keySchema = (schema as unknown as { keySchema: BaseSchema<any, any> }).keySchema;
    const valueSchema = (schema as unknown as { valueSchema: BaseSchema<any, any> }).valueSchema;
    json = {
      type: "object",
      propertyNames: buildSchemaInternal(keySchema, options),
      additionalProperties: buildSchemaInternal(valueSchema, options)
    };
  } else if (schema instanceof SetSchema) {
    const itemSchema = (schema as unknown as { itemSchema: BaseSchema<any, any> }).itemSchema;
    json = {
      type: "array",
      uniqueItems: true,
      items: buildSchemaInternal(itemSchema, options)
    };
  } else if (schema instanceof MapSchema) {
    const keySchema = (schema as unknown as { keySchema: BaseSchema<any, any> }).keySchema;
    const valueSchema = (schema as unknown as { valueSchema: BaseSchema<any, any> }).valueSchema;
    json = {
      type: "array",
      items: {
        type: "array",
        minItems: 2,
        maxItems: 2,
        prefixItems: [
          buildSchemaInternal(keySchema, options),
          buildSchemaInternal(valueSchema, options)
        ]
      },
      "x-valdix-type": "map"
    };
  } else if (schema instanceof ObjectSchema) {
    const shape = (schema as unknown as { shape: Record<string, BaseSchema<any, any>> }).shape;
    const policy = (schema as unknown as { policy: "strip" | "passthrough" | "strict" }).policy;

    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const optional = unwrapOptional(value);
      properties[key] = buildSchemaInternal(optional.schema, options);
      if (!optional.optional) {
        required.push(key);
      }
    }

    json = {
      type: "object",
      properties,
      ...(required.length > 0 ? { required } : {}),
      additionalProperties: policy === "passthrough"
    };
  } else if (schema instanceof DiscriminatedUnionSchema) {
    const optionsMap = (schema as unknown as {
      options: Record<string, BaseSchema<any, any>>;
      discriminator: string;
    }).options;
    const discriminator = (schema as unknown as {
      discriminator: string;
    }).discriminator;
    json = {
      oneOf: Object.values(optionsMap).map((option) =>
        buildSchemaInternal(option, options)),
      discriminator: {
        propertyName: discriminator
      }
    };
  } else if (schema instanceof UnionSchema) {
    const optionsSchemas = (schema as unknown as {
      options: BaseSchema<any, any>[];
    }).options;
    json = {
      anyOf: optionsSchemas.map((option) => buildSchemaInternal(option, options))
    };
  } else if (schema instanceof IntersectionSchema) {
    const left = (schema as unknown as { left: BaseSchema<any, any> }).left;
    const right = (schema as unknown as { right: BaseSchema<any, any> }).right;
    json = {
      allOf: [
        buildSchemaInternal(left, options),
        buildSchemaInternal(right, options)
      ]
    };
  } else if (schema instanceof PipelineSchema) {
    const first = (schema as unknown as { first: BaseSchema<any, any> }).first;
    const second = (schema as unknown as { second: BaseSchema<any, any> }).second;
    json = {
      allOf: [
        buildSchemaInternal(first, options),
        buildSchemaInternal(second, options)
      ],
      "x-valdix-pipeline": true
    };
  } else {
    json = {};
  }

  if (brandName) {
    json = withBrand(json, brandName);
  }

  for (const metadata of metadataChain) {
    json = addMetadata(json, metadata);
  }

  return json;
};

export const toJSONSchema = (
  schema: BaseSchema<any, any>
): JSONSchema => buildSchemaInternal(schema, { openapi: false });

export const toOpenAPISchema = (
  schema: BaseSchema<any, any>
): OpenAPISchema => buildSchemaInternal(schema, { openapi: true });
