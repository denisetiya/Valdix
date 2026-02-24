# Recipes

## 1) Enforce Strict Payload + Clean Error Contract

```ts
const CreateUserSchema = v.strictObject({
  name: v.string().min(3),
  email: v.string().email()
});

const result = CreateUserSchema.safeParse(payload, { locale: "en" });

if (!result.success) {
  return {
    status: 422,
    body: result.error.toResponse({
      message: "Validation failed",
      summaryOptions: {
        labels: {
          name: "Full Name",
          email: "Email Address"
        }
      }
    })
  };
}
```

## 2) Patch Endpoint with Deep Partial

```ts
const UserSchema = v.object({
  profile: v.object({
    name: v.string(),
    socials: v.array(v.object({
      url: v.string().url()
    }))
  })
});

const UserPatchSchema = UserSchema.deepPartial();
```

## 3) Create Endpoint with Deep Required

```ts
const StrictCreateSchema = UserSchema.deepRequired();
```

## 4) Key-Constrained Dictionary

```ts
const SlugScoreSchema = v.strictRecord(
  v.string().regex(/^[a-z0-9-]+$/),
  v.number().int().nonnegative()
);
```

## 5) Async Uniqueness Check

```ts
const RegisterSchema = v.object({
  email: v.string().email().refineAsync(async (value) => {
    const exists = await fakeCheck(value);
    return !exists;
  }, "Email already registered")
});

const result = await RegisterSchema.safeParseAsync(payload);
```

## 6) Export for OpenAPI

```ts
const openApiSchema = v.toOpenAPISchema(
  v.object({
    id: v.string().uuid().brand("UserId"),
    email: v.string().email()
  }).metadata({
    title: "User",
    description: "User API schema"
  })
);
```

