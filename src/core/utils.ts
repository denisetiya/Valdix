import type { PathInput, PathSegment } from "./types.js";

const DIGIT_SEGMENT = /^\d+$/;

const safeStringify = (value: unknown): string => {
  const seen = new WeakSet<object>();
  try {
    return JSON.stringify(value, (_key, current) => {
      if (typeof current === "object" && current !== null) {
        if (seen.has(current)) {
          return "[Circular]";
        }
        seen.add(current);
      }
      return current;
    }) ?? String(value);
  } catch {
    return String(value);
  }
};

export const formatUnknown = (value: unknown): string => {
  if (typeof value === "string") {
    return `"${value}"`;
  }
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (value === null) {
    return "null";
  }
  if (typeof value === "undefined") {
    return "undefined";
  }
  return safeStringify(value);
};

export const getValueType = (value: unknown): string => {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  if (value instanceof Date) {
    return "date";
  }
  if (value instanceof Set) {
    return "set";
  }
  if (value instanceof Map) {
    return "map";
  }
  return typeof value;
};

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

export const hasOwn = (target: object, key: string): boolean => {
  return Object.prototype.hasOwnProperty.call(target, key);
};

export const regexTest = (expression: RegExp, input: string): boolean => {
  if (expression.global || expression.sticky) {
    const flags = expression.flags
      .replace(/g/g, "")
      .replace(/y/g, "");
    return new RegExp(expression.source, flags).test(input);
  }

  return expression.test(input);
};

export const pathToString = (path: PathSegment[]): string => {
  if (path.length === 0) {
    return "";
  }

  return path
    .map((segment) => String(segment))
    .join(".");
};

export const normalizePath = (path: PathInput): PathSegment[] => {
  if (Array.isArray(path)) {
    return [...path];
  }

  if (path.length === 0) {
    return [];
  }

  return path
    .split(".")
    .filter((segment) => segment.length > 0)
    .map((segment) => (DIGIT_SEGMENT.test(segment) ? Number(segment) : segment));
};

export const pathInputToString = (path: PathInput): string =>
  pathToString(normalizePath(path));
