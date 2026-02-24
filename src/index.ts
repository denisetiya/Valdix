export type {
  ConfigOptions,
  ErrorDetail,
  ErrorResponse,
  ErrorResponseOptions,
  ErrorMap,
  ErrorSummaryItem,
  ErrorSummaryOptions,
  ProblemDetails,
  ProblemDetailsOptions,
  PathInput,
  SchemaMetadata,
  IssueCode,
  IssueInput,
  IssueKind,
  IssuePayload,
  LocaleCatalog,
  ParseOptions,
  PathSegment,
  SafeParseFailure,
  SafeParseResult,
  SafeParseSuccess,
  SuperRefinementContext,
  ValdixIssue
} from "./core/types.js";

export { ValdixError } from "./core/error.js";
export {
  buildErrorResponse,
  buildProblemDetails,
  containsIssue,
  findIssue,
  findIssues,
  groupIssuesByPath,
  summarizeIssues
} from "./core/error-utils.js";
export {
  toJSONSchema,
  toOpenAPISchema
} from "./core/json-schema.js";
export {
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
} from "./core/schema.js";
export type {
  Brand,
  Infer,
  InputOf,
  OutputOf,
  UnionOptions
} from "./core/schema.js";

export {
  configure,
  getLocale,
  registerLocale,
  setGlobalErrorMap,
  setLocale
} from "./core/config.js";

export {
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
} from "./schemas/primitives.js";

export {
  MapSchema,
  RecordSchema,
  SetSchema,
  StrictRecordSchema,
  TupleSchema
} from "./schemas/collections.js";
export type {
  TupleInput,
  TupleItems,
  TupleOutput
} from "./schemas/collections.js";

export {
  ObjectSchema
} from "./schemas/object.js";
export type {
  ObjectInput,
  ObjectOutput,
  ObjectShape
} from "./schemas/object.js";

export { DiscriminatedUnionSchema } from "./schemas/advanced.js";

export {
  any,
  array,
  bigint,
  boolean,
  coerce,
  date,
  discriminatedUnion,
  enumValues,
  instanceOf,
  intersection,
  literal,
  map,
  never,
  nullType,
  number,
  object,
  preprocess,
  record,
  set,
  strictRecord,
  strictObject,
  string,
  tuple,
  undefinedType,
  union,
  unknown
} from "./factories/builders.js";

import {
  any,
  array,
  bigint,
  boolean,
  coerce,
  date,
  discriminatedUnion,
  enumValues,
  instanceOf,
  intersection,
  literal,
  map,
  never,
  nullType,
  number,
  object,
  preprocess,
  record,
  set,
  strictRecord,
  strictObject,
  string,
  tuple,
  undefinedType,
  union,
  unknown
} from "./factories/builders.js";
import {
  configure,
  getLocale,
  registerLocale,
  setGlobalErrorMap,
  setLocale
} from "./core/config.js";
import {
  toJSONSchema,
  toOpenAPISchema
} from "./core/json-schema.js";

export const v = {
  string,
  number,
  bigint,
  boolean,
  date,
  literal,
  enum: enumValues,
  any,
  unknown,
  never,
  null: nullType,
  undefined: undefinedType,
  instanceOf,
  object,
  strictObject,
  array,
  tuple,
  record,
  strictRecord,
  set,
  map,
  union,
  intersection,
  discriminatedUnion,
  preprocess,
  coerce,
  toJSONSchema,
  toOpenAPISchema,
  configure,
  setLocale,
  getLocale,
  setGlobalErrorMap,
  registerLocale
};

export default v;
