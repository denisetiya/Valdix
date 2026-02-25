# Migration Notes

This page highlights behavior and API changes introduced in recent iterations.

## Summary Output Format

`summary()` now returns structured objects:

```ts
type ErrorSummaryItem = {
  field: string;
  label: string;
  code: IssueCode;
  message: string;
};
```

If your old code expected `string[]`, migrate UI mapping to use `item.message` and `item.label`.

## Error Response Contract

`toResponse()` now includes:

- `summary` as `ErrorSummaryItem[]`
- `details` as a detailed list

## RFC7807 Support

Use:

- `error.toProblemDetails()`
- `buildProblemDetails(issues)`

for standard `application/problem+json` responses.

## Async Validation APIs

New methods:

- `parseAsync`
- `safeParseAsync`
- `refineAsync`
- `superRefineAsync`

Switch to async parse flow where needed.

## New Schema Utilities

- `deepRequired()`
- `strictRecord(keySchema, valueSchema)`
- `metadata(...)`
- `brand("Name")`

## React Subpath

`@denisetiya/valdix/react` is now available for form-state mapping.

