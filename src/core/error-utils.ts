import type {
  ErrorDetail,
  ErrorResponse,
  ErrorResponseOptions,
  ErrorSummaryItem,
  ErrorSummaryOptions,
  PathSegment,
  PathInput,
  ValdixIssue
} from "./types.js";
import { pathInputToString, pathToString } from "./utils.js";

const DEFAULT_ERROR_MESSAGE = "Validation error";
const CAMEL_BOUNDARY = /([a-z0-9])([A-Z])/g;
const SYMBOL_SEPARATOR = /[_-]+/g;
const WORD_SEPARATOR = /\s+/;

const ACRONYM_TOKENS = new Set([
  "id",
  "url",
  "api",
  "ip",
  "uuid",
  "cuid",
  "http",
  "https"
]);

const humanizeToken = (token: string): string => {
  const lower = token.toLowerCase();
  if (ACRONYM_TOKENS.has(lower)) {
    return lower.toUpperCase();
  }

  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const humanizeKey = (value: string): string => {
  const normalized = value
    .replace(CAMEL_BOUNDARY, "$1 $2")
    .replace(SYMBOL_SEPARATOR, " ")
    .trim();

  if (normalized.length === 0) {
    return value;
  }

  return normalized
    .split(WORD_SEPARATOR)
    .map(humanizeToken)
    .join(" ");
};

const formatIndexLabel = (
  index: number,
  locale: "id" | "en"
): string => locale === "id"
  ? `item ke-${index + 1}`
  : `item ${index + 1}`;

const formatPathLabel = (
  path: readonly PathSegment[],
  locale: "id" | "en"
): string => {
  if (path.length === 0) {
    return locale === "id" ? "Form" : "Form";
  }

  const chunks: string[] = [];

  for (const segment of path) {
    if (typeof segment === "number") {
      const suffix = formatIndexLabel(segment, locale);
      if (chunks.length === 0) {
        chunks.push(humanizeToken(suffix));
      } else {
        chunks[chunks.length - 1] = `${chunks[chunks.length - 1]} ${suffix}`;
      }
      continue;
    }

    chunks.push(humanizeKey(segment));
  }

  return chunks.join(" > ");
};

const resolveSummaryItem = (
  issue: ValdixIssue,
  options?: ErrorSummaryOptions
): ErrorSummaryItem => {
  const includePath = options?.includePath ?? true;
  const pathStyle = options?.pathStyle ?? "label";
  const labelLocale = options?.labelLocale ?? "id";
  const path = pathToString(issue.path);
  const customLabel = options?.labels?.[path];

  if (!includePath) {
    return {
      field: "",
      label: labelLocale === "id" ? "Pesan" : "Message",
      code: issue.code,
      message: issue.message
    };
  }

  const pathLabel = customLabel ?? (pathStyle === "dot"
    ? path || formatPathLabel(issue.path, labelLocale)
    : formatPathLabel(issue.path, labelLocale));

  return {
    field: path,
    label: pathLabel,
    code: issue.code,
    message: issue.message
  };
};

export const findIssue = (
  issues: readonly ValdixIssue[],
  path: PathInput
): ValdixIssue | undefined => {
  const targetPath = pathInputToString(path);
  for (const issue of issues) {
    if (pathToString(issue.path) === targetPath) {
      return issue;
    }
  }
  return undefined;
};

export const findIssues = (
  issues: readonly ValdixIssue[],
  path: PathInput
): ValdixIssue[] => {
  const targetPath = pathInputToString(path);
  const matches: ValdixIssue[] = [];

  for (const issue of issues) {
    if (pathToString(issue.path) === targetPath) {
      matches.push(issue);
    }
  }

  return matches;
};

export const containsIssue = (
  issues: readonly ValdixIssue[],
  path: PathInput
): boolean => {
  const targetPath = pathInputToString(path);
  for (const issue of issues) {
    if (pathToString(issue.path) === targetPath) {
      return true;
    }
  }
  return false;
};

export const groupIssuesByPath = (
  issues: readonly ValdixIssue[]
): Record<string, ValdixIssue[]> => {
  const grouped: Record<string, ValdixIssue[]> = {};

  for (const issue of issues) {
    const path = pathToString(issue.path);
    if (!grouped[path]) {
      grouped[path] = [];
    }
    grouped[path].push(issue);
  }

  return grouped;
};

export const summarizeIssues = (
  issues: readonly ValdixIssue[],
  options?: ErrorSummaryOptions
): ErrorSummaryItem[] => {
  const dedupe = options?.dedupe ?? false;
  const limit =
    typeof options?.limit === "number" && options.limit > 0
      ? options.limit
      : Number.POSITIVE_INFINITY;

  const summary: ErrorSummaryItem[] = [];
  const seen = dedupe ? new Set<string>() : undefined;

  for (const issue of issues) {
    const item = resolveSummaryItem(issue, options);
    const dedupeKey = `${item.field}\u0000${item.code}\u0000${item.message}`;

    if (seen && seen.has(dedupeKey)) {
      continue;
    }
    if (seen) {
      seen.add(dedupeKey);
    }

    summary.push(item);
    if (summary.length >= limit) {
      break;
    }
  }

  return summary;
};

export const buildErrorResponse = (
  issues: readonly ValdixIssue[],
  options?: ErrorResponseOptions
): ErrorResponse => {
  const summaryOptions = options?.summaryOptions;
  const formErrors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};
  const details: ErrorDetail[] = [];
  const labelLocale = summaryOptions?.labelLocale ?? "id";

  for (const issue of issues) {
    const path = pathToString(issue.path);
    const label = summaryOptions?.labels?.[path] ?? formatPathLabel(issue.path, labelLocale);

    details.push({
      path,
      label,
      code: issue.code,
      message: issue.message
    });

    if (path.length === 0) {
      formErrors.push(issue.message);
      continue;
    }

    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }

  return {
    message:
      options?.message ??
      formErrors[0] ??
      issues[0]?.message ??
      DEFAULT_ERROR_MESSAGE,
    issues: [...issues],
    formErrors,
    fieldErrors,
    summary: summarizeIssues(issues, summaryOptions),
    details
  };
};
