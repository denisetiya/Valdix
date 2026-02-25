# React Integration

Valdix provides form-focused helpers in the `@denisetiya/valdix/react` subpath.

## Import

```ts
import {
  toFormErrorState,
  filterFieldErrorsByTouched,
  getFieldError,
  buildTouchedFromSummary
} from "@denisetiya/valdix/react";
```

## Main Helper: `toFormErrorState`

```ts
const result = schema.safeParse(values);

if (!result.success) {
  const state = toFormErrorState(result.error, {
    email: true
  });

  // state.message
  // state.formErrors
  // state.fieldErrors
  // state.summary
  // state.firstErrorField
}
```

Input can be:

- `ValdixError`
- `ErrorResponse`
- raw `ValdixIssue[]`

## Touched Filtering

```ts
const visibleErrors = filterFieldErrorsByTouched(state.fieldErrors, touched);
```

## First Field Error

```ts
const emailMessage = getFieldError(state, "email");
```

## Build Touched from Summary

```ts
const touched = buildTouchedFromSummary(state.summary);
```

Use this to quickly mark all errored fields as touched.

