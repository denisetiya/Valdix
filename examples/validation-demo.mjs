import { ValdixError, v } from "../dist/index.js";

const UserSchema = v.strictObject({
  name: v.string().min(3),
  email: v.string().email(),
  tags: v.array(v.string().min(2)).unique(),
  profile: v.object({
    socials: v.array(
      v.object({
        platform: v.enum(["github", "x", "linkedin"]),
        url: v.string().url()
      })
    )
  })
});

const invalidPayload = {
  name: "Di",
  email: "not-email",
  tags: ["go", "go"],
  profile: {
    socials: [
      {
        platform: "github",
        url: "invalid-url"
      }
    ]
  },
  extra: true
};

const result = UserSchema.safeParse(invalidPayload);

if (!result.success) {
  const error = result.error;
  console.log("=== SAFE PARSE FAILED ===");
  console.log(JSON.stringify(error.toResponse({
    message: "Validation failed",
    summaryOptions: {
      labels: {
        name: "Nama",
        email: "Email",
        "tags.1": "Tag kedua",
        "profile.socials.0.url": "URL sosial pertama"
      }
    }
  }), null, 2));

  const firstEmailIssue = error.find("email");
  console.log("\nfirst email issue:", firstEmailIssue?.message ?? "none");
  console.log("has duplicate tag issue:", error.contains("tags.1"));
  console.log(
    "issues at profile.socials.0.url:",
    error.findAll("profile.socials.0.url").length
  );
  console.log(
    "summary:",
    JSON.stringify(error.summary({ dedupe: true }), null, 2)
  );
  console.log(
    "summary (custom labels):",
    JSON.stringify(error.summary({
      dedupe: true,
      labels: {
        name: "Nama",
        email: "Email",
        "tags.1": "Tag kedua",
        "profile.socials.0.url": "URL sosial pertama"
      }
    }), null, 2)
  );
  console.log(
    "summary (dot path):",
    JSON.stringify(error.summary({ dedupe: true, pathStyle: "dot" }), null, 2)
  );
  console.log(
    "problem+json:",
    JSON.stringify(error.toProblemDetails({ instance: "/demo/users" }), null, 2)
  );
}

const PatchSchema = UserSchema.deepPartial();
const patchResult = PatchSchema.safeParse({
  profile: {
    socials: [
      {
        url: "https://example.com"
      }
    ]
  }
});

console.log("\n=== DEEP PARTIAL TEST ===");
console.log("patch success:", patchResult.success);

try {
  UserSchema.parse(invalidPayload);
} catch (error) {
  if (error instanceof ValdixError) {
    console.log("\n=== PARSE THROW TEST ===");
    console.log("thrown message:", error.message);
  }
}
