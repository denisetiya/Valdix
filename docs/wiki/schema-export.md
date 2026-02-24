# Schema Export (JSON Schema / OpenAPI)

Valdix can export schemas to:

- JSON Schema: `toJSONSchema(schema)`
- OpenAPI Schema: `toOpenAPISchema(schema)`

Both are available from:

- top-level exports (`import { toJSONSchema } from "valdix"`)
- `v` helper (`v.toJSONSchema(schema)`)

## Example

```ts
import { toJSONSchema, toOpenAPISchema, v } from "valdix";

const UserSchema = v.object({
  id: v.string().uuid().brand("UserId"),
  email: v.string().email(),
  tags: v.array(v.string()).unique()
}).metadata({
  title: "UserPayload",
  description: "Schema for user payload"
});

const jsonSchema = toJSONSchema(UserSchema);
const openapiSchema = toOpenAPISchema(UserSchema);
```

## Metadata and Extensions

`metadata()` values are merged into exported schema output.

Common fields:

- `title`
- `description`
- `examples`
- `deprecated`
- `format`
- `docsUrl`

Branding produces an extension:

- `x-brand: "BrandName"` (or `true` if unnamed)

## Notes

- Export focuses on practical interoperability.
- Some advanced runtime-only checks are represented via `x-valdix-*` extension fields.

