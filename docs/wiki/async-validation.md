# Async Validation

Use async parsing when your schema contains asynchronous checks.

## API

- `parseAsync(input, options?)`
- `safeParseAsync(input, options?)`
- `refineAsync(asyncCheck, message?)`
- `superRefineAsync(asyncCheck)`

## Example: Async Username Rule

```ts
import { v } from "@denisetiya/valdix";

const UserSchema = v.object({
  username: v.string().refineAsync(async (value) => {
    // Example async check
    await Promise.resolve();
    return value.startsWith("usr_");
  }, "Username must start with usr_")
});

const result = await UserSchema.safeParseAsync({
  username: "usr_123"
});
```

## Example: Cross-Field Async Validation

```ts
const PasswordSchema = v.object({
  password: v.string().min(8),
  confirmPassword: v.string()
}).superRefineAsync(async (value, ctx) => {
  await Promise.resolve();
  if (value.password !== value.confirmPassword) {
    ctx.addIssue({
      code: "custom",
      path: ["confirmPassword"],
      message: "Password confirmation does not match."
    });
  }
});

const result = await PasswordSchema.safeParseAsync(payload);
```

## Important Rules

- If you use async refinements, always call async parse methods.
- Sync methods (`parse`, `safeParse`) are for purely synchronous schemas.

