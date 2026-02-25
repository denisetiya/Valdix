# Valdix Wiki

Valdix is a zero-dependency TypeScript schema validation library with:

- Synchronous and asynchronous parsing
- Structured error contracts for backend and frontend
- Multi-language error messages (`id`, `en`, custom catalogs)
- JSON Schema and OpenAPI export support
- React-oriented error helpers (`@denisetiya/valdix/react`)

This wiki is the detailed reference for implementation and integration.

## Navigation

- [Getting Started](./getting-started.md)
- [Schema Guide](./schema-guide.md)
- [Error Handling](./error-handling.md)
- [Async Validation](./async-validation.md)
- [Schema Export (JSON Schema / OpenAPI)](./schema-export.md)
- [React Integration](./react-integration.md)
- [Recipes](./recipes.md)
- [Migration Notes](./migration-notes.md)

## Quick Mental Model

1. Define schema with `v.*` factories.
2. Parse with `parse` / `safeParse` or `parseAsync` / `safeParseAsync`.
3. On failure, consume `ValdixError`:
   - field lookups: `find`, `findAll`, `contains`
   - structured response: `toResponse`
   - RFC7807 response: `toProblemDetails`
4. Optionally export schema with `toJSONSchema` / `toOpenAPISchema`.

## Project Conventions

- Runtime target: ESM (`type: "module"`)
- Package manager: `pnpm`
- Build outputs: `dist/*.js` + declaration files

