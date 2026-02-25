# @denisetiya/valdix

`@denisetiya/valdix` is a TypeScript schema validation library inspired by Zod, with additional features for backend and frontend integration:

- zero runtime dependencies
- high performance
- simple API surface
- multi-language error messages
- structured error contracts for APIs and forms

## Why @denisetiya/valdix

- Lightweight: no external runtime dependencies.
- Fast: synchronous parser with minimal allocations.
- Practical: `parse` / `safeParse` plus chainable schema APIs.
- Internationalized: built-in `id` and `en` locales, plus custom locale registration.
- Modular: source code is organized into `core`, `schemas`, and `factories`.

## Installation

```bash
pnpm add @denisetiya/valdix
```

## Quick Start

```ts
import { v } from "@denisetiya/valdix";

const UserSchema = v.object({
  id: v.number().int().positive(),
  name: v.string().min(2),
  email: v.string().email(),
  role: v.enum(["admin", "user"]).default("user"),
  bio: v.string().max(160).optional()
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

## Core API

- `parse(input, options?)`: throws `ValdixError` when invalid.
- `safeParse(input, options?)`: returns `{ success, data | error }`.
- `parseAsync(input, options?)`, `safeParseAsync(input, options?)`: async parsing flow.
- `optional()`, `nullable()`, `nullish()`, `default(value)`, `catch(value)`.
- `refine(check, message?)`, `refineAsync(check, message?)`.
- `superRefine((value, ctx) => ctx.addIssue(...))`, `superRefineAsync(...)`.
- `transform(fn)`, `pipe(schema)`.
- `array()`, `or(schema)`, `and(schema)`.
- `metadata({...})`, `brand("BrandName")`.

## Schema Factories

- `v.string()`
- `v.number()`
- `v.bigint()`
- `v.boolean()`
- `v.date()`
- `v.literal(value)`
- `v.enum([...])`
- `v.null()`
- `v.undefined()`
- `v.instanceOf(MyClass)`
- `v.object(shape)`
- `v.strictObject(shape)`
- `v.array(itemSchema)`
- `v.tuple([schema1, schema2])`
- `v.record(valueSchema)`
- `v.strictRecord(keySchema, valueSchema)`
- `v.set(itemSchema)`
- `v.map(keySchema, valueSchema)`
- `v.union([schema1, schema2])`
- `v.intersection(schemaA, schemaB)`
- `v.discriminatedUnion("type", { ... })`
- `v.preprocess(fn, schema)`
- `v.coerce.string()`, `v.coerce.number()`, `v.coerce.bigint()`, `v.coerce.boolean()`, `v.coerce.date()`

## Feature Highlights

- Path-first error API: `find(path)`, `findAll(path)`, `contains(path)`.
- Structured summary output: `summary()` returns JSON objects (`field`, `label`, `code`, `message`).
- API-ready error output: `toResponse()`.
- RFC7807 output: `toProblemDetails()`.
- Error utilities: `findIssue`, `findIssues`, `containsIssue`, `buildErrorResponse`, `buildProblemDetails`.
- Object utilities: `partial()`, `deepPartial()`, `required(keys?)`, `deepRequired()`, `omit()`, `merge()`, `keyof()`.
- Collection utility: `array().unique(selector?)`.
- String utilities: `slug()`, `cuid()`, `uuid()`, `datetime()`.
- Schema export: `toJSONSchema(schema)`, `toOpenAPISchema(schema)`.
- React helper subpath: `@denisetiya/valdix/react`.

## Multi-language Errors

### Built-in locales

- `id` (default)
- `en`

### Set global locale

```ts
import { v } from "@denisetiya/valdix";

v.setLocale("en");
// or v.configure({ locale: "en" });
```

### Override locale per parse

```ts
const schema = v.string().email();
const result = schema.safeParse("invalid-email", { locale: "en" });
```

### Register a custom locale

```ts
import { v } from "@denisetiya/valdix";

v.registerLocale("jv", {
  custom: "Invalid input (custom locale).",
  invalid_type: "Invalid value type."
});
```

### Custom error map

```ts
import { v } from "@denisetiya/valdix";

v.configure({
  errorMap: (issue, ctx) => `[${issue.code}] ${ctx.defaultMessage}`
});
```

## Error Handling

```ts
import { ValdixError, v } from "@denisetiya/valdix";

try {
  v.strictObject({
    profile: v.object({
      email: v.string().email()
    })
  }).parse({
    profile: {
      email: "invalid-email"
    }
  });
} catch (error) {
  if (error instanceof ValdixError) {
    console.log(error.find("profile.email"));
    console.log(error.findAll("profile.email"));
    console.log(error.contains("profile.email"));

    console.log(error.summary());
    // [{ field, label, code, message }]

    console.log(error.summary({
      labels: { "profile.email": "User Email" }
    }));

    console.log(error.toResponse({
      message: "Validation failed"
    }));

    console.log(error.toProblemDetails({
      title: "Payload validation failed",
      instance: "/api/users"
    }));
  }
}
```

`flatten()` is still available for compatibility, but `toResponse()` is recommended.

## Schema Export

```ts
import { toJSONSchema, toOpenAPISchema, v } from "@denisetiya/valdix";

const UserSchema = v.object({
  id: v.string().uuid().brand("UserId"),
  email: v.string().email()
}).metadata({
  title: "UserPayload",
  description: "Schema for user payload"
});

const jsonSchema = toJSONSchema(UserSchema);
const openApiSchema = toOpenAPISchema(UserSchema);
```

## React Helper

Use `@denisetiya/valdix/react` for form-oriented error mapping:

```ts
import { toFormErrorState } from "@denisetiya/valdix/react";

const state = toFormErrorState(result.error, {
  email: true
});
```

## Real-World Pattern Examples

```ts
const SlugSchema = v
  .string()
  .trim()
  .toLowerCase()
  .pipe(v.string().regex(/^[a-z0-9-]+$/));

const slug = SlugSchema.parse("  HELLO-WORLD  ");
// "hello-world"
```

```ts
const EventSchema = v.discriminatedUnion("type", {
  user: v.object({
    type: v.literal("user"),
    username: v.string().min(3)
  }),
  system: v.object({
    type: v.literal("system"),
    level: v.number().int()
  })
});
```

## Development

```bash
pnpm install
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
pnpm run bench
```

## Wiki Documentation

Detailed docs are available in:

- [Wiki Home](./docs/wiki/Home.md)
- [Getting Started](./docs/wiki/getting-started.md)
- [Schema Guide](./docs/wiki/schema-guide.md)
- [Error Handling](./docs/wiki/error-handling.md)
- [Async Validation](./docs/wiki/async-validation.md)
- [Schema Export](./docs/wiki/schema-export.md)
- [React Integration](./docs/wiki/react-integration.md)
- [Recipes](./docs/wiki/recipes.md)
- [Migration Notes](./docs/wiki/migration-notes.md)

## Benchmark

A basic benchmark is available at `benchmarks/basic.bench.mjs`.

```bash
pnpm run bench
```

## License

MIT
