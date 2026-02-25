# Getting Started

## Installation

```bash
pnpm add @denisetiya/valdix
```

## Basic Parse Flow

```ts
import { v } from "@denisetiya/valdix";

const UserSchema = v.object({
  id: v.number().int().positive(),
  name: v.string().min(2),
  email: v.string().email(),
  role: v.enum(["admin", "user"]).default("user")
});

const result = UserSchema.safeParse({
  id: 1,
  name: "Deni",
  email: "deni@example.com"
});

if (!result.success) {
  console.log(result.error.toResponse());
} else {
  console.log(result.data);
}
```

## Parse Modes

- `parse(input, options?)`
  - Throws `ValdixError` on invalid input
- `safeParse(input, options?)`
  - Returns `{ success: true, data }` or `{ success: false, error }`
- `parseAsync(input, options?)`
  - Async version of `parse`
- `safeParseAsync(input, options?)`
  - Async version of `safeParse`

## Global Configuration

```ts
import { v } from "@denisetiya/valdix";

v.configure({
  locale: "id",
  abortEarly: false
});
```

## Per-Parse Override

```ts
const result = UserSchema.safeParse(payload, {
  locale: "en",
  abortEarly: true
});
```

## Locales

- Built-in: `"id"` and `"en"`
- Custom locale registration:

```ts
import { v } from "@denisetiya/valdix";

v.registerLocale("jv", {
  custom: "Input ora valid.",
  invalid_type: "Tipe data ora cocok."
});
```

