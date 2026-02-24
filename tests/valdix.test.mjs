import test from "node:test";
import assert from "node:assert/strict";

import {
  ValdixError,
  buildErrorResponse,
  containsIssue,
  findIssue,
  findIssues,
  groupIssuesByPath,
  summarizeIssues,
  v
} from "../dist/index.js";

test("parse object with default and optional field", () => {
  const schema = v.object({
    name: v.string().min(2),
    age: v.number().int().min(0),
    nickname: v.string().optional(),
    role: v.enum(["admin", "user"]).default("user")
  });

  const parsed = schema.parse({
    name: "Deni",
    age: 25
  });

  assert.deepEqual(parsed, {
    name: "Deni",
    age: 25,
    role: "user"
  });
});

test("safeParse returns paths and localized message", () => {
  const schema = v.object({
    email: v.string().email(),
    age: v.number().min(17)
  });

  const result = schema.safeParse(
    {
      email: "bukan-email",
      age: 10
    },
    { locale: "id" }
  );

  assert.equal(result.success, false);
  if (result.success) {
    assert.fail("Expected parse to fail");
  }

  assert.equal(result.error.issues.length, 2);
  assert.equal(result.error.issues[0].path.join("."), "email");
  assert.match(result.error.issues[0].message, /Format email tidak valid/);
  assert.equal(result.error.issues[1].path.join("."), "age");
});

test("missing field reports required issue code", () => {
  const schema = v.object({
    name: v.string(),
    age: v.number()
  });

  const result = schema.safeParse({ name: "Deni" });
  assert.equal(result.success, false);
  if (result.success) {
    assert.fail("Expected parse to fail");
  }

  assert.equal(result.error.issues[0].code, "required");
  assert.equal(result.error.issues[0].path.join("."), "age");
});

test("abortEarly stops after first issue", () => {
  const schema = v.object({
    title: v.string().min(5),
    count: v.number().positive()
  });

  const result = schema.safeParse(
    {
      title: "abc",
      count: -2
    },
    { abortEarly: true }
  );

  assert.equal(result.success, false);
  if (result.success) {
    assert.fail("Expected parse to fail");
  }
  assert.equal(result.error.issues.length, 1);
});

test("union validates first successful branch", () => {
  const schema = v.union([
    v.string().regex(/^usr_/),
    v.number().int().positive()
  ]);

  assert.equal(schema.parse("usr_123"), "usr_123");
  assert.equal(schema.parse(99), 99);

  const invalid = schema.safeParse({});
  assert.equal(invalid.success, false);
});

test("strict object mode rejects unknown keys", () => {
  const schema = v
    .object({
      id: v.number()
    })
    .strict();

  const result = schema.safeParse({ id: 1, extra: true });
  assert.equal(result.success, false);
  if (result.success) {
    assert.fail("Expected parse to fail");
  }

  assert.equal(result.error.issues[0].code, "unknown_keys");
});

test("coerce helpers convert input before validation", () => {
  assert.equal(v.coerce.number().parse("42"), 42);
  assert.equal(v.coerce.boolean().parse("false"), false);
  assert.equal(v.coerce.bigint().parse("42"), 42n);
  assert.ok(v.coerce.date().parse("2026-01-01") instanceof Date);
});

test("transform and pipe can normalize value", () => {
  const slug = v
    .string()
    .trim()
    .toLowerCase()
    .pipe(v.string().regex(/^[a-z0-9-]+$/));

  assert.equal(slug.parse("  HELLO-WORLD  "), "hello-world");
});

test("ValdixError.flatten groups issue by path", () => {
  const schema = v.object({
    name: v.string().min(4),
    age: v.number().positive()
  });

  let captured;
  try {
    schema.parse({ name: "a", age: -1 });
  } catch (error) {
    captured = error;
  }

  assert.ok(captured instanceof ValdixError);
  const flattened = captured.flatten();
  assert.ok(flattened.fieldErrors.name.length > 0);
  assert.ok(flattened.fieldErrors.age.length > 0);
});

test("ValdixError helpers support path-first issue lookups", () => {
  const schema = v.object({
    profile: v.object({
      email: v.string().email(),
      tags: v.array(v.string()).unique()
    })
  });

  const result = schema.safeParse({
    profile: {
      email: "invalid-email",
      tags: ["alpha", "alpha"]
    }
  });

  assert.equal(result.success, false);
  if (result.success) {
    assert.fail("Expected parse to fail");
  }

  assert.equal(result.error.contains("profile.email"), true);
  assert.equal(result.error.contains(["profile", "tags", 1]), true);
  assert.equal(result.error.find("profile.email")?.code, "invalid_string");
  assert.equal(result.error.findAll("profile.email").length, 1);

  const summary = result.error.summary({ dedupe: true });
  assert.ok(summary.some((entry) =>
    entry.field === "profile.email" &&
    entry.label === "Profile > Email" &&
    entry.code === "invalid_string"));

  const dotSummary = result.error.summary({
    dedupe: true,
    pathStyle: "dot"
  });
  assert.ok(dotSummary.some((entry) => entry.label === "profile.email"));
});

test("error utilities mirror ValdixError behavior", () => {
  const schema = v.object({
    email: v.string().email(),
    tags: v.array(v.string()).unique()
  });

  const result = schema.safeParse({
    email: "bad-email",
    tags: ["x", "x"]
  });

  assert.equal(result.success, false);
  if (result.success) {
    assert.fail("Expected parse to fail");
  }

  const issues = result.error.issues;
  assert.equal(findIssue(issues, "email")?.code, "invalid_string");
  assert.equal(findIssues(issues, "tags.1").length, 1);
  assert.equal(containsIssue(issues, "tags.1"), true);

  const grouped = groupIssuesByPath(issues);
  assert.equal(grouped.email.length, 1);
  assert.equal(grouped["tags.1"].length, 1);

  const summary = summarizeIssues(issues, { includePath: false });
  assert.ok(summary.length >= 2);
  assert.equal(summary[0].field, "");
  assert.equal(summary[0].label, "Pesan");

  const response = buildErrorResponse(issues, {
    message: "Payload invalid",
    summaryOptions: {
      labels: {
        email: "Alamat Email",
        "tags.1": "Tag #2"
      }
    }
  });
  assert.equal(response.message, "Payload invalid");
  assert.equal(response.fieldErrors.email.length, 1);
  assert.equal(response.fieldErrors["tags.1"].length, 1);
  assert.equal(response.summary[0].field, "email");
  assert.equal(response.summary[0].label, "Alamat Email");
  assert.equal(response.summary[0].message, "Format email tidak valid.");
  assert.equal(response.details[0].label, "Alamat Email");
  assert.equal(response.details[1].label, "Tag #2");
});

test("toResponse returns API-ready error payload", () => {
  const schema = v.object({
    username: v.string().min(3)
  });

  const result = schema.safeParse({ username: "ab" });
  assert.equal(result.success, false);
  if (result.success) {
    assert.fail("Expected parse to fail");
  }

  const payload = result.error.toResponse({
    message: "Validation failed",
    summaryOptions: {
      labels: {
        username: "Nama Pengguna"
      }
    }
  });
  assert.equal(payload.message, "Validation failed");
  assert.equal(payload.issues.length, 1);
  assert.equal(payload.fieldErrors.username.length, 1);
  assert.equal(payload.summary.length, 1);
  assert.equal(payload.summary[0].field, "username");
  assert.equal(payload.summary[0].label, "Nama Pengguna");
  assert.equal(payload.details[0].label, "Nama Pengguna");
});

test("regex with global flag remains deterministic across parses", () => {
  const schema = v.string().regex(/^[a-z]+$/g);
  assert.equal(schema.parse("hello"), "hello");
  assert.equal(schema.parse("world"), "world");
});

test("object utilities: omit, merge, keyof", () => {
  const base = v.object({
    id: v.number(),
    name: v.string(),
    email: v.string().email()
  });

  const publicSchema = base.omit(["email"]);
  assert.deepEqual(publicSchema.parse({ id: 1, name: "Deni" }), {
    id: 1,
    name: "Deni"
  });

  const merged = base.merge(
    v.object({
      role: v.enum(["admin", "user"])
    })
  );
  assert.equal(merged.parse({
    id: 1,
    name: "Deni",
    email: "deni@example.com",
    role: "admin"
  }).role, "admin");

  assert.equal(base.keyof().parse("name"), "name");
});

test("object utilities: deepPartial and required", () => {
  const schema = v.object({
    profile: v.object({
      name: v.string(),
      socials: v.array(
        v.object({
          url: v.string().url(),
          label: v.string()
        })
      )
    }),
    nickname: v.string().optional()
  });

  const patchSchema = schema.deepPartial();
  assert.equal(patchSchema.safeParse({}).success, true);

  const patched = patchSchema.parse({
    profile: {
      socials: [{ url: "https://example.com" }]
    }
  });
  assert.equal(patched.profile.socials[0].url, "https://example.com");

  const requiredOne = schema.partial().required(["profile"]);
  assert.equal(requiredOne.safeParse({}).success, false);
  const requiredOneResult = requiredOne.safeParse({
    profile: {
      name: "Deni",
      socials: []
    }
  });
  assert.equal(requiredOneResult.success, true);

  const requiredAll = schema.partial().required();
  assert.equal(requiredAll.safeParse({ profile: {} }).success, false);
});

test("strictObject factory enforces strict unknown key policy", () => {
  const schema = v.strictObject({
    id: v.number()
  });

  assert.equal(schema.safeParse({ id: 1, extra: true }).success, false);
  assert.equal(schema.safeParse({ id: 1 }).success, true);
});

test("array unique supports selector for object arrays", () => {
  const schema = v.array(
    v.object({
      id: v.number(),
      name: v.string()
    })
  ).unique((item) => item.id);

  assert.equal(schema.safeParse([
    { id: 1, name: "A" },
    { id: 2, name: "B" }
  ]).success, true);

  const duplicate = schema.safeParse([
    { id: 1, name: "A" },
    { id: 1, name: "B" }
  ]);
  assert.equal(duplicate.success, false);
  if (duplicate.success) {
    assert.fail("Expected parse to fail");
  }

  assert.equal(duplicate.error.issues[0].code, "invalid_array");
  assert.equal(duplicate.error.issues[0].path.join("."), "1");
});

test("string slug and cuid validators work", () => {
  assert.equal(v.string().slug().safeParse("hello-world").success, true);
  assert.equal(v.string().slug().safeParse("Hello World").success, false);

  assert.equal(v.string().cuid().safeParse("ck8x7x9w00000a1b2c3d4e5f").success, true);
  assert.equal(v.string().cuid().safeParse("user-123").success, false);
});

test("discriminated union parses selected branch", () => {
  const schema = v.discriminatedUnion("type", {
    user: v.object({
      type: v.literal("user"),
      username: v.string()
    }),
    system: v.object({
      type: v.literal("system"),
      level: v.number().int()
    })
  });

  const parsed = schema.parse({
    type: "system",
    level: 3
  });

  assert.equal(parsed.level, 3);
});

test("intersection merges object outputs", () => {
  const schema = v.intersection(
    v.object({ id: v.number() }),
    v.object({ name: v.string() })
  );

  assert.deepEqual(schema.parse({ id: 1, name: "Deni" }), {
    id: 1,
    name: "Deni"
  });
});

test("instanceOf validates constructor", () => {
  class Person {
    constructor(name) {
      this.name = name;
    }
  }

  const schema = v.instanceOf(Person);
  const person = new Person("Deni");
  assert.equal(schema.parse(person), person);
  assert.equal(schema.safeParse({ name: "Deni" }).success, false);
});

test("set and map schemas validate collections", () => {
  const tagSet = v.set(v.string().min(2)).min(1);
  assert.equal(tagSet.parse(new Set(["ts"])).size, 1);

  const scoreMap = v.map(v.string(), v.number().int());
  const parsed = scoreMap.parse(new Map([["alice", 10]]));
  assert.equal(parsed.get("alice"), 10);
});
