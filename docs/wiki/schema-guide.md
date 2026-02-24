# Schema Guide

## Primitive Factories

- `v.string()`
- `v.number()`
- `v.bigint()`
- `v.boolean()`
- `v.date()`
- `v.literal(value)`
- `v.enum([...])`
- `v.instanceOf(MyClass)`
- `v.any()`, `v.unknown()`, `v.never()`, `v.null()`, `v.undefined()`

## Common String Rules

```ts
const S = v.string()
  .min(3)
  .max(100)
  .email()
  .url()
  .uuid()
  .datetime()
  .slug()
  .cuid();
```

Also supported:

- `.regex(re)`
- `.startsWith("x")`
- `.endsWith("y")`
- `.includes("z")`
- `.trim()`, `.toLowerCase()`, `.toUpperCase()`

## Common Number Rules

```ts
const N = v.number()
  .int()
  .min(0)
  .max(100)
  .multipleOf(5)
  .positive();
```

## Object and Collection Schemas

```ts
const Schema = v.strictObject({
  profile: v.object({
    name: v.string(),
    tags: v.array(v.string()).unique()
  }),
  scores: v.strictRecord(v.string().regex(/^[a-z]+$/), v.number().int())
});
```

Factories:

- `v.object(shape)` / `v.strictObject(shape)`
- `v.array(itemSchema)`
- `v.tuple([...])`
- `v.record(valueSchema)`
- `v.strictRecord(keySchema, valueSchema)`
- `v.set(itemSchema)`
- `v.map(keySchema, valueSchema)`
- `v.union([...])`
- `v.intersection(a, b)`
- `v.discriminatedUnion("kind", options)`

## Object Utilities

Available on `ObjectSchema`:

- `strict()`, `passthrough()`, `strip()`
- `extend(shape)`, `merge(other)`
- `pick(keys)`, `omit(keys)`
- `partial()`
- `deepPartial()`
- `required(keys?)`
- `deepRequired()`
- `keyof()`

## Base Schema Utilities

Available on most schemas:

- `optional()`, `nullable()`, `nullish()`
- `default(value)`, `catch(value)`
- `refine(check, message?)`
- `refineAsync(check, message?)`
- `superRefine((value, ctx) => ctx.addIssue(...))`
- `superRefineAsync(...)`
- `transform(fn)`, `pipe(schema)`
- `metadata({...})`
- `brand("BrandName")`

## Coercion

```ts
v.coerce.string();
v.coerce.number();
v.coerce.bigint();
v.coerce.boolean();
v.coerce.date();
```

