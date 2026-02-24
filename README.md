# valdix

`valdix` adalah library validasi schema TypeScript yang terinspirasi dari Zod dengan beberapa fitur tambahan:

- zero dependency runtime
- performa tinggi
- API simpel
- pesan error multi-language

## Kenapa valdix

- Ringan: tidak ada dependency runtime eksternal.
- Cepat: parser sinkron dengan alokasi minimal.
- Mudah: `parse` / `safeParse` dan chaining schema seperti Zod.
- Multi-language: bawaan `id` dan `en`, bisa tambah locale sendiri.
- Modular: source dipisah ke `core`, `schemas`, dan `factories` agar scalable.

## Instalasi

```bash
pnpm add valdix
```

## Quick Start

```ts
import { v } from "valdix";

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
  console.log(result.error.issues);
} else {
  console.log(result.data);
}
```

## API Dasar

- `parse(input, options?)`: lempar `ValdixError` jika invalid.
- `safeParse(input, options?)`: return `{ success, data | error }`.
- `parseAsync(input, options?)` dan `safeParseAsync(input, options?)` untuk validasi async.
- `optional()`, `nullable()`, `nullish()`, `default(value)`, `catch(value)`.
- `refine(check, message?)`, `refineAsync(check, message?)`.
- `superRefine((value, ctx) => ctx.addIssue(...))`, `superRefineAsync(...)`.
- `transform(fn)`, `pipe(schema)`.
- `array()`, `or(schema)`, `and(schema)` di level base schema.
- `metadata({...})`, `brand("BrandName")` untuk kontrak schema yang lebih kuat.

## Schema Factory

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

## Fitur Baru

- `required` issue code untuk key object yang tidak ada.
- Regex check aman untuk `RegExp` dengan flag `g` / `y`.
- `ObjectSchema` tambahan: `omit`, `merge`, `keyof`, `partial`.
- `StringSchema` tambahan: `uuid()`, `datetime()`.
- `NumberSchema` tambahan: `multipleOf()`.
- Error API path-first: `find(path)`, `findAll(path)`, `contains(path)`.
- Error formatter: `summary()` dan `toResponse()` untuk payload API.
- Error contract RFC7807: `toProblemDetails()`.
- Standalone error utils: `findIssue`, `findIssues`, `containsIssue`, `buildErrorResponse`.
- `ObjectSchema` tambahan: `deepPartial()`, `deepRequired()`, `required(keys?)`.
- `ArraySchema` tambahan: `unique(selector?)`.
- `StringSchema` tambahan: `slug()`, `cuid()`.
- Factory baru: `v.strictObject(shape)`, `v.strictRecord(...)`.
- Export schema: `toJSONSchema(schema)`, `toOpenAPISchema(schema)`.
- React helper subpath: `valdix/react`.

## Multi-language Error

### Locale bawaan

- `id` (default)
- `en`

### Ganti locale global

```ts
import { v } from "valdix";

v.setLocale("en");
```

### Override locale per parse

```ts
const schema = v.string().email();
const result = schema.safeParse("invalid-email", { locale: "en" });
```

### Tambah locale custom

```ts
import { v } from "valdix";

v.registerLocale("jv", {
  custom: "Input ora valid.",
  invalid_type: "Tipe data ora cocok."
});
```

### Custom error map

```ts
import { v } from "valdix";

v.configure({
  errorMap: (issue, ctx) => `[${issue.code}] ${ctx.defaultMessage}`
});
```

## Error Handling

`ValdixError` sekarang punya query API yang lebih mudah diambil per path:

```ts
import { ValdixError, v } from "valdix";

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
    console.log(error.find("profile.email")); // issue pertama di path
    console.log(error.findAll("profile.email")); // semua issue di path
    console.log(error.contains("profile.email")); // true/false
    console.log(error.summary());
    // [{ field: "profile.email", label: "Profile > Email", code: "invalid_string", message: "Format email tidak valid." }]
    console.log(error.summary({ pathStyle: "dot" }));
    // [{ field: "profile.email", label: "profile.email", code: "invalid_string", message: "Format email tidak valid." }]
    console.log(error.summary({
      labels: { "profile.email": "Email Pengguna" }
    }));
    // [{ field: "profile.email", label: "Email Pengguna", code: "invalid_string", message: "Format email tidak valid." }]
    console.log(error.toResponse()); // payload siap kirim ke API response
    console.log(error.toProblemDetails()); // payload RFC7807 (problem+json)
  }
}
```

Untuk util functional (tanpa class method), gunakan:

```ts
import {
  buildErrorResponse,
  containsIssue,
  findIssue,
  findIssues
} from "valdix";
```

`flatten()` tetap tersedia untuk kompatibilitas, tetapi disarankan pakai `toResponse()`.

`toResponse()` sudah mengembalikan `summary` dalam format JSON terstruktur (`field`, `label`, `code`, `message`) dan `details`, jadi bisa langsung dipakai di backend/frontend tanpa formatting tambahan. Kamu juga bisa kirim `summaryOptions.labels` untuk custom label per field path.

## Schema Export

Gunakan exporter bawaan untuk dokumentasi atau OpenAPI:

```ts
import { toJSONSchema, toOpenAPISchema, v } from "valdix";

const UserSchema = v.object({
  id: v.string().uuid().brand("UserId"),
  email: v.string().email()
}).metadata({
  title: "UserPayload",
  description: "Schema untuk payload user"
});

const jsonSchema = toJSONSchema(UserSchema);
const openApiSchema = toOpenAPISchema(UserSchema);
```

## React Helper

Subpath `valdix/react` bisa langsung mapping error ke state form:

```ts
import { toFormErrorState } from "valdix/react";

const state = toFormErrorState(result.error, {
  email: true
});
```

## Contoh Pola Nyata

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

Detailed docs are available in the wiki folder:

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

Benchmark sederhana tersedia di `benchmarks/basic.bench.mjs`.

```bash
pnpm run bench
```

## License

MIT
