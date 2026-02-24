import { EN_MESSAGES, ID_MESSAGES } from "../locale/defaults.js";
import type {
  ConfigOptions,
  ErrorMap,
  LocaleCatalog
} from "./types.js";

interface GlobalValdixConfig {
  locale: string;
  abortEarly: boolean;
  errorMap: ErrorMap | undefined;
  locales: Map<string, LocaleCatalog>;
}

const globalConfig: GlobalValdixConfig = {
  locale: "id",
  abortEarly: false,
  errorMap: undefined,
  locales: new Map([
    ["en", EN_MESSAGES],
    ["id", ID_MESSAGES]
  ])
};

export const configure = (options: ConfigOptions): void => {
  if (options.locale) {
    globalConfig.locale = options.locale;
  }
  if (typeof options.abortEarly === "boolean") {
    globalConfig.abortEarly = options.abortEarly;
  }
  if ("errorMap" in options) {
    globalConfig.errorMap = options.errorMap;
  }
};

export const setLocale = (locale: string): void => {
  globalConfig.locale = locale;
};

export const getLocale = (): string => {
  return globalConfig.locale;
};

export const setGlobalErrorMap = (map?: ErrorMap): void => {
  globalConfig.errorMap = map;
};

export const registerLocale = (
  locale: string,
  catalog: LocaleCatalog
): void => {
  const previous = globalConfig.locales.get(locale) ?? {};
  globalConfig.locales.set(locale, { ...previous, ...catalog });
};

export const getLocaleRegistry = (): ReadonlyMap<string, LocaleCatalog> => {
  return globalConfig.locales;
};

export const getParseDefaults = (): {
  locale: string;
  abortEarly: boolean;
  errorMap: ErrorMap | undefined;
} => {
  return {
    locale: globalConfig.locale,
    abortEarly: globalConfig.abortEarly,
    errorMap: globalConfig.errorMap
  };
};

export const getFallbackCatalog = (): LocaleCatalog => {
  return EN_MESSAGES;
};

