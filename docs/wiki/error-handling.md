# Error Handling

Valdix returns rich validation errors through `ValdixError`.

## Error Shape

Each issue has:

- `code`
- `path` (array of segments)
- `message`
- optional metadata (`expected`, `received`, `validation`, etc.)

## Accessing Issues

```ts
const result = schema.safeParse(payload);
if (!result.success) {
  const err = result.error;

  err.find("profile.email");           // first issue at path
  err.findAll("profile.email");        // all issues at path
  err.contains(["profile", "email"]);  // boolean
}
```

## Summary Output (Structured JSON)

```ts
if (!result.success) {
  const summary = result.error.summary({
    pathStyle: "label", // "label" | "dot"
    labels: {
      "profile.email": "User Email"
    }
  });

  // summary: Array<{ field, label, code, message }>
}
```

`summary()` now returns structured objects, not plain strings.

## API Response (Backend-Friendly)

```ts
if (!result.success) {
  return res.status(422).json(
    result.error.toResponse({
      message: "Validation failed",
      summaryOptions: {
        labels: {
          email: "Email"
        }
      }
    })
  );
}
```

`toResponse()` includes:

- `message`
- `issues`
- `formErrors`
- `fieldErrors`
- `summary` (structured list)
- `details`

## RFC7807 Problem Details

```ts
if (!result.success) {
  return res.status(422).json(
    result.error.toProblemDetails({
      title: "Payload validation failed",
      instance: "/api/users"
    })
  );
}
```

Includes:

- `type`
- `title`
- `status`
- `detail`
- `instance` (optional)
- `errors` (summary list)
- `fieldErrors`
- `issues`

## Utility Functions

You can also use standalone utilities:

```ts
import {
  buildErrorResponse,
  buildProblemDetails,
  findIssue,
  findIssues,
  containsIssue,
  summarizeIssues
} from "valdix";
```

