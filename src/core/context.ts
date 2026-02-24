import {
  getFallbackCatalog,
  getLocaleRegistry,
  getParseDefaults
} from "./config.js";
import { resolveMessage } from "./messages.js";
import type {
  ErrorMap,
  IssueInput,
  ParseOptions,
  PathSegment,
  ValdixIssue
} from "./types.js";

interface ParseSettings {
  locale: string;
  abortEarly: boolean;
  parseErrorMap: ErrorMap | undefined;
  globalErrorMap: ErrorMap | undefined;
}

export interface ParseContext {
  readonly locale: string;
  readonly abortEarly: boolean;
  readonly parseErrorMap: ErrorMap | undefined;
  readonly globalErrorMap: ErrorMap | undefined;
  readonly path: PathSegment[];
  readonly issues: ValdixIssue[];
  addIssue: (issue: IssueInput) => void;
  fork: () => ParseContext;
}

const createContext = (
  settings: ParseSettings,
  path: PathSegment[],
  issues: ValdixIssue[]
): ParseContext => {
  const ctx: ParseContext = {
    ...settings,
    path,
    issues,
    addIssue: (issue) => {
      const fullPath = issue.path
        ? [...ctx.path, ...issue.path]
        : [...ctx.path];

      const issueBase: Omit<ValdixIssue, "message"> = {
        ...issue,
        path: fullPath
      };

      const message = resolveMessage(
        issueBase,
        settings.locale,
        settings.parseErrorMap,
        settings.globalErrorMap,
        issue.message,
        getLocaleRegistry(),
        getFallbackCatalog()
      );

      issues.push({ ...issueBase, message });
    },
    fork: () => createContext(settings, [...ctx.path], [])
  };

  return ctx;
};

export const createParseContext = (options?: ParseOptions): ParseContext => {
  const defaults = getParseDefaults();
  return createContext(
    {
      locale: options?.locale ?? defaults.locale,
      abortEarly: options?.abortEarly ?? defaults.abortEarly,
      parseErrorMap: options?.errorMap,
      globalErrorMap: defaults.errorMap
    },
    [],
    []
  );
};

export interface InternalSuccess<T> {
  ok: true;
  value: T;
}

export interface InternalFailure {
  ok: false;
}

export type InternalResult<T> = InternalSuccess<T> | InternalFailure;

export const ok = <T>(value: T): InternalSuccess<T> => ({ ok: true, value });

export const invalid: InternalFailure = { ok: false };

