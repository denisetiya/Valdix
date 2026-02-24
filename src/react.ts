import { buildErrorResponse } from "./core/error-utils.js";
import type {
  ErrorResponse,
  ErrorSummaryItem,
  ValdixErrorLike,
  ValdixIssue
} from "./core/types.js";

export interface FormTouchedMap {
  [field: string]: boolean;
}

export interface FormErrorState {
  message: string;
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
  summary: ErrorSummaryItem[];
  touched: FormTouchedMap;
  firstErrorField?: string;
}

const isIssueArray = (value: unknown): value is ValdixIssue[] =>
  Array.isArray(value);

const isErrorResponse = (value: unknown): value is ErrorResponse =>
  typeof value === "object" &&
  value !== null &&
  "issues" in value &&
  "fieldErrors" in value &&
  "summary" in value;

const isValdixErrorLike = (value: unknown): value is ValdixErrorLike =>
  typeof value === "object" &&
  value !== null &&
  "issues" in value &&
  Array.isArray((value as { issues?: unknown }).issues);

export const toFormErrorState = (
  input: ErrorResponse | ValdixErrorLike | ValdixIssue[],
  touched: FormTouchedMap = {}
): FormErrorState => {
  const response = isErrorResponse(input)
    ? input
    : buildErrorResponse(
      isIssueArray(input)
        ? input
        : isValdixErrorLike(input)
          ? input.issues
          : []
    );

  const firstErrorField = response.summary.find((entry) => entry.field.length > 0)?.field;

  return {
    message: response.message,
    formErrors: response.formErrors,
    fieldErrors: response.fieldErrors,
    summary: response.summary,
    touched: { ...touched },
    ...(typeof firstErrorField === "string" ? { firstErrorField } : {})
  };
};

export const filterFieldErrorsByTouched = (
  fieldErrors: Record<string, string[]>,
  touched: FormTouchedMap
): Record<string, string[]> => {
  const filtered: Record<string, string[]> = {};

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (touched[field]) {
      filtered[field] = messages;
    }
  }

  return filtered;
};

export const getFieldError = (
  state: FormErrorState,
  field: string
): string | undefined => state.fieldErrors[field]?.[0];

export const buildTouchedFromSummary = (
  summary: readonly ErrorSummaryItem[]
): FormTouchedMap => {
  const touched: FormTouchedMap = {};

  for (const entry of summary) {
    if (entry.field.length > 0) {
      touched[entry.field] = true;
    }
  }

  return touched;
};

