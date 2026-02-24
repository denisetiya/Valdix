import {
  buildErrorResponse,
  buildProblemDetails,
  summarizeIssues
} from "./error-utils.js";
import type {
  ErrorResponse,
  ErrorResponseOptions,
  ErrorSummaryItem,
  ErrorSummaryOptions,
  PathInput,
  ProblemDetails,
  ProblemDetailsOptions,
  ValdixIssue
} from "./types.js";
import { pathInputToString, pathToString } from "./utils.js";

const buildIssueIndex = (issues: readonly ValdixIssue[]): Map<string, ValdixIssue[]> => {
  const index = new Map<string, ValdixIssue[]>();

  for (const issue of issues) {
    const path = pathToString(issue.path);
    const bucket = index.get(path);
    if (bucket) {
      bucket.push(issue);
      continue;
    }
    index.set(path, [issue]);
  }

  return index;
};

export class ValdixError extends Error {
  public readonly issues: ValdixIssue[];
  private readonly issueIndex: Map<string, ValdixIssue[]>;

  public constructor(issues: ValdixIssue[]) {
    super(issues[0]?.message ?? "Validation error");
    this.name = "ValdixError";
    this.issues = issues;
    this.issueIndex = buildIssueIndex(issues);
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public find(path: PathInput): ValdixIssue | undefined {
    const pathKey = pathInputToString(path);
    return this.issueIndex.get(pathKey)?.[0];
  }

  public findAll(path: PathInput): ValdixIssue[] {
    const pathKey = pathInputToString(path);
    const issues = this.issueIndex.get(pathKey);
    return issues ? [...issues] : [];
  }

  public contains(path: PathInput): boolean {
    const pathKey = pathInputToString(path);
    return this.issueIndex.has(pathKey);
  }

  public summary(options?: ErrorSummaryOptions): ErrorSummaryItem[] {
    return summarizeIssues(this.issues, options);
  }

  public flatten(): {
    formErrors: string[];
    fieldErrors: Record<string, string[]>;
  } {
    const response = buildErrorResponse(this.issues);
    return {
      formErrors: response.formErrors,
      fieldErrors: response.fieldErrors
    };
  }

  public toResponse(options?: ErrorResponseOptions): ErrorResponse {
    return buildErrorResponse(this.issues, options);
  }

  public toProblemDetails(options?: ProblemDetailsOptions): ProblemDetails {
    return buildProblemDetails(this.issues, options);
  }

  public toJSON(): { message: string; issues: ValdixIssue[] } {
    return {
      message: this.message,
      issues: this.issues
    };
  }
}
