import type {
  ErrorMap,
  LocaleCatalog,
  MessageTemplate,
  ValdixIssue
} from "./types.js";

const applyTemplate = (
  template: MessageTemplate | undefined,
  issue: Omit<ValdixIssue, "message">
): string | undefined => {
  if (!template) {
    return undefined;
  }
  return typeof template === "function" ? template(issue) : template;
};

export const resolveDefaultMessage = (
  locale: string,
  issue: Omit<ValdixIssue, "message">,
  localeRegistry: ReadonlyMap<string, LocaleCatalog>,
  fallbackCatalog: LocaleCatalog
): string => {
  const activeCatalog = localeRegistry.get(locale);
  return (
    applyTemplate(activeCatalog?.[issue.code], issue) ??
    applyTemplate(fallbackCatalog[issue.code], issue) ??
    "Invalid input."
  );
};

export const resolveMessage = (
  issue: Omit<ValdixIssue, "message">,
  locale: string,
  parseMap: ErrorMap | undefined,
  globalMap: ErrorMap | undefined,
  explicitMessage: string | undefined,
  localeRegistry: ReadonlyMap<string, LocaleCatalog>,
  fallbackCatalog: LocaleCatalog
): string => {
  const defaultMessage = explicitMessage ?? resolveDefaultMessage(
    locale,
    issue,
    localeRegistry,
    fallbackCatalog
  );

  if (parseMap) {
    return parseMap(issue, { defaultMessage, locale });
  }
  if (globalMap) {
    return globalMap(issue, { defaultMessage, locale });
  }

  return defaultMessage;
};

