import type {
  IssueKind,
  LocaleCatalog,
  ValdixIssue
} from "../core/types.js";
import { formatUnknown } from "../core/utils.js";

const describeBound = (
  issue: Omit<ValdixIssue, "message">,
  locale: "en" | "id"
): string => {
  const isMin = issue.code === "too_small";
  const bound = isMin ? issue.minimum : issue.maximum;
  if (typeof bound === "undefined") {
    return locale === "en" ? "a valid range" : "rentang yang valid";
  }

  if (issue.exact) {
    return locale === "en"
      ? `exactly ${String(bound)}`
      : `tepat ${String(bound)}`;
  }

  const fallback = isMin ? ">=" : "<=";
  const operator = issue.inclusive
    ? fallback
    : isMin
      ? ">"
      : "<";

  return `${operator} ${String(bound)}`;
};

const KIND_LABEL_EN: Record<IssueKind, string> = {
  string: "String length",
  number: "Number value",
  bigint: "BigInt value",
  array: "Array length",
  date: "Date value",
  tuple: "Tuple length",
  set: "Set size",
  map: "Map size"
};

const KIND_LABEL_ID: Record<IssueKind, string> = {
  string: "Panjang string",
  number: "Nilai angka",
  bigint: "Nilai BigInt",
  array: "Panjang array",
  date: "Nilai tanggal",
  tuple: "Panjang tuple",
  set: "Ukuran set",
  map: "Ukuran map"
};

const describeStringValidationEn = (validation?: string): string => {
  if (!validation) {
    return "Invalid text format.";
  }

  if (validation === "email") {
    return "Email format is invalid.";
  }
  if (validation === "url") {
    return "URL format is invalid.";
  }
  if (validation === "uuid") {
    return "UUID format is invalid.";
  }
  if (validation === "datetime") {
    return "Date-time format is invalid.";
  }
  if (validation === "slug") {
    return "Slug format is invalid. Use lowercase letters, numbers, and hyphens.";
  }
  if (validation === "cuid") {
    return "CUID format is invalid.";
  }

  return "Invalid text format.";
};

const describeStringValidationId = (validation?: string): string => {
  if (!validation) {
    return "Format teks tidak valid.";
  }

  if (validation === "email") {
    return "Format email tidak valid.";
  }
  if (validation === "url") {
    return "Format URL tidak valid.";
  }
  if (validation === "uuid") {
    return "Format UUID tidak valid.";
  }
  if (validation === "datetime") {
    return "Format tanggal dan waktu tidak valid.";
  }
  if (validation === "slug") {
    return "Format slug tidak valid. Gunakan huruf kecil, angka, dan tanda hubung (-).";
  }
  if (validation === "cuid") {
    return "Format CUID tidak valid.";
  }

  return "Format teks tidak valid.";
};

const describeArrayValidationEn = (validation?: string): string => {
  if (validation === "unique") {
    return "List cannot contain duplicate values.";
  }
  return validation
    ? `Array validation failed: ${validation}.`
    : "Invalid array.";
};

const describeArrayValidationId = (validation?: string): string => {
  if (validation === "unique") {
    return "Daftar tidak boleh berisi data duplikat.";
  }
  return validation
    ? `Validasi array gagal: ${validation}.`
    : "Array tidak valid.";
};

const describeHumanBoundEn = (
  issue: Omit<ValdixIssue, "message">
): string | undefined => {
  const bound = issue.code === "too_small" ? issue.minimum : issue.maximum;
  if (typeof bound === "undefined") {
    return undefined;
  }

  if (issue.kind === "string" && typeof bound === "number") {
    if (issue.exact) {
      return `Text length must be exactly ${bound} characters.`;
    }

    if (issue.code === "too_small") {
      return issue.inclusive === false
        ? `Text length must be more than ${bound} characters.`
        : `Text length must be at least ${bound} characters.`;
    }

    return issue.inclusive === false
      ? `Text length must be less than ${bound} characters.`
      : `Text length must be at most ${bound} characters.`;
  }

  return undefined;
};

const describeHumanBoundId = (
  issue: Omit<ValdixIssue, "message">
): string | undefined => {
  const bound = issue.code === "too_small" ? issue.minimum : issue.maximum;
  if (typeof bound === "undefined") {
    return undefined;
  }

  if (issue.kind === "string" && typeof bound === "number") {
    if (issue.exact) {
      return `Panjang teks harus tepat ${bound} karakter.`;
    }

    if (issue.code === "too_small") {
      return issue.inclusive === false
        ? `Panjang teks harus lebih dari ${bound} karakter.`
        : `Panjang teks minimal ${bound} karakter.`;
    }

    return issue.inclusive === false
      ? `Panjang teks harus kurang dari ${bound} karakter.`
      : `Panjang teks maksimal ${bound} karakter.`;
  }

  return undefined;
};

export const EN_MESSAGES: Required<LocaleCatalog> = {
  required: () => "Field is required.",
  invalid_type: (issue) =>
    `Expected ${issue.expected ?? "valid value"}, received ${issue.received ?? "unknown"}.`,
  invalid_literal: (issue) =>
    `Expected literal ${formatUnknown(issue.literal)}.`,
  invalid_enum_value: (issue) =>
    `Expected one of: ${(issue.options ?? []).map(formatUnknown).join(", ")}.`,
  too_small: (issue) => {
    const human = describeHumanBoundEn(issue);
    if (human) {
      return human;
    }
    const kind = issue.kind ? KIND_LABEL_EN[issue.kind] : "Value";
    return `${kind} must be ${describeBound(issue, "en")}.`;
  },
  too_big: (issue) => {
    const human = describeHumanBoundEn(issue);
    if (human) {
      return human;
    }
    const kind = issue.kind ? KIND_LABEL_EN[issue.kind] : "Value";
    return `${kind} must be ${describeBound(issue, "en")}.`;
  },
  invalid_string: (issue) => describeStringValidationEn(issue.validation),
  invalid_number: (issue) =>
    issue.validation
      ? `Invalid number: ${issue.validation}.`
      : "Invalid number.",
  invalid_bigint: (issue) =>
    issue.validation
      ? `Invalid bigint: ${issue.validation}.`
      : "Invalid bigint.",
  invalid_date: () => "Invalid date.",
  invalid_array: (issue) => describeArrayValidationEn(issue.validation),
  invalid_union: () => "Input did not match any union option.",
  invalid_intersection: () => "Input did not satisfy all intersection schemas.",
  invalid_discriminator: (issue) =>
    `Invalid discriminator "${issue.discriminator ?? "unknown"}". Allowed: ${(issue.allowedDiscriminators ?? []).join(", ")}.`,
  unknown_keys: (issue) =>
    `Unknown key(s): ${(issue.keys ?? []).join(", ")}.`,
  invalid_tuple_length: (issue) =>
    `Expected tuple length ${String(issue.minimum ?? "?")}, received ${String(issue.maximum ?? "?")}.`,
  invalid_instance: (issue) =>
    `Expected instance of ${issue.constructorName ?? "target constructor"}.`,
  custom: () => "Invalid input."
};

export const ID_MESSAGES: Required<LocaleCatalog> = {
  required: () => "Field wajib diisi.",
  invalid_type: (issue) =>
    `Seharusnya ${issue.expected ?? "nilai valid"}, tetapi menerima ${issue.received ?? "tidak diketahui"}.`,
  invalid_literal: (issue) =>
    `Seharusnya literal ${formatUnknown(issue.literal)}.`,
  invalid_enum_value: (issue) =>
    `Seharusnya salah satu dari: ${(issue.options ?? []).map(formatUnknown).join(", ")}.`,
  too_small: (issue) => {
    const human = describeHumanBoundId(issue);
    if (human) {
      return human;
    }
    const kind = issue.kind ? KIND_LABEL_ID[issue.kind] : "Nilai";
    return `${kind} harus ${describeBound(issue, "id")}.`;
  },
  too_big: (issue) => {
    const human = describeHumanBoundId(issue);
    if (human) {
      return human;
    }
    const kind = issue.kind ? KIND_LABEL_ID[issue.kind] : "Nilai";
    return `${kind} harus ${describeBound(issue, "id")}.`;
  },
  invalid_string: (issue) => describeStringValidationId(issue.validation),
  invalid_number: (issue) =>
    issue.validation
      ? `Angka tidak valid: ${issue.validation}.`
      : "Angka tidak valid.",
  invalid_bigint: (issue) =>
    issue.validation
      ? `BigInt tidak valid: ${issue.validation}.`
      : "BigInt tidak valid.",
  invalid_date: () => "Tanggal tidak valid.",
  invalid_array: (issue) => describeArrayValidationId(issue.validation),
  invalid_union: () => "Input tidak cocok dengan pilihan union mana pun.",
  invalid_intersection: () => "Input tidak memenuhi semua schema intersection.",
  invalid_discriminator: (issue) =>
    `Discriminator "${issue.discriminator ?? "tidak diketahui"}" tidak valid. Pilihan: ${(issue.allowedDiscriminators ?? []).join(", ")}.`,
  unknown_keys: (issue) =>
    `Key tidak dikenal: ${(issue.keys ?? []).join(", ")}.`,
  invalid_tuple_length: (issue) =>
    `Panjang tuple seharusnya ${String(issue.minimum ?? "?")}, diterima ${String(issue.maximum ?? "?")}.`,
  invalid_instance: (issue) =>
    `Seharusnya instance dari ${issue.constructorName ?? "konstruktor target"}.`,
  custom: () => "Input tidak valid."
};
