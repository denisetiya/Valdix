export type PathSegment = string | number;
export type PathInput = string | PathSegment[];

export type IssueCode =
  | "required"
  | "invalid_type"
  | "invalid_literal"
  | "invalid_enum_value"
  | "too_small"
  | "too_big"
  | "invalid_string"
  | "invalid_number"
  | "invalid_bigint"
  | "invalid_date"
  | "invalid_array"
  | "invalid_union"
  | "invalid_intersection"
  | "invalid_discriminator"
  | "unknown_keys"
  | "invalid_tuple_length"
  | "invalid_instance"
  | "custom";

export type IssueKind =
  | "string"
  | "number"
  | "bigint"
  | "array"
  | "date"
  | "tuple"
  | "set"
  | "map";

export interface IssuePayload {
  code: IssueCode;
  path: PathSegment[];
  expected?: string;
  received?: string;
  minimum?: number | bigint;
  maximum?: number | bigint;
  inclusive?: boolean;
  exact?: boolean;
  kind?: IssueKind;
  validation?: string;
  options?: readonly (string | number | boolean | null)[];
  literal?: string | number | boolean | null;
  keys?: string[];
  unionErrors?: ValdixIssue[][];
  discriminator?: string;
  allowedDiscriminators?: readonly string[];
  constructorName?: string;
}

export interface ValdixIssue extends IssuePayload {
  message: string;
}

export type IssueInput = Omit<IssuePayload, "path"> & {
  path?: PathSegment[];
  message?: string;
};

export type ErrorMap = (
  issue: Omit<ValdixIssue, "message">,
  context: { defaultMessage: string; locale: string }
) => string;

export interface ParseOptions {
  locale?: string;
  abortEarly?: boolean;
  errorMap?: ErrorMap;
}

export interface SchemaMetadata {
  title?: string;
  description?: string;
  examples?: unknown[];
  deprecated?: boolean;
  format?: string;
  docsUrl?: string;
  [key: string]: unknown;
}

export interface SuperRefinementContext {
  addIssue: (issue: IssueInput) => void;
}

export interface ConfigOptions {
  locale?: string;
  abortEarly?: boolean;
  errorMap?: ErrorMap;
}

export interface SafeParseSuccess<T> {
  success: true;
  data: T;
}

export interface SafeParseFailure {
  success: false;
  error: ValdixErrorLike;
}

export type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseFailure;

export type MessageTemplate =
  | string
  | ((issue: Omit<ValdixIssue, "message">) => string);

export type LocaleCatalog = Partial<Record<IssueCode, MessageTemplate>>;

export interface ErrorSummaryOptions {
  includePath?: boolean;
  dedupe?: boolean;
  limit?: number;
  pathStyle?: "dot" | "label";
  labelLocale?: "id" | "en";
  labels?: Record<string, string>;
}

export interface ErrorResponseOptions {
  message?: string;
  summaryOptions?: ErrorSummaryOptions;
}

export interface ProblemDetailsOptions extends ErrorResponseOptions {
  typeUri?: string;
  title?: string;
  status?: number;
  instance?: string;
}

export interface ErrorSummaryItem {
  field: string;
  label: string;
  code: IssueCode;
  message: string;
}

export interface ErrorDetail {
  path: string;
  label: string;
  code: IssueCode;
  message: string;
}

export interface ErrorResponse {
  message: string;
  issues: ValdixIssue[];
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
  summary: ErrorSummaryItem[];
  details: ErrorDetail[];
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors: ErrorSummaryItem[];
  fieldErrors: Record<string, string[]>;
  issues: ValdixIssue[];
}

export interface ValdixErrorLike extends Error {
  issues: ValdixIssue[];
}
