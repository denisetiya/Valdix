import { performance } from "node:perf_hooks";

import { v } from "../dist/index.js";

const userSchema = v.object({
  id: v.number().int().positive(),
  username: v.string().min(3).max(20),
  email: v.string().email(),
  active: v.boolean(),
  roles: v.array(v.enum(["admin", "user", "editor"])).min(1),
  profile: v.object({
    bio: v.string().max(160).optional(),
    website: v.string().url().optional()
  })
});

const sample = {
  id: 17,
  username: "deni_setiya",
  email: "deni@example.com",
  active: true,
  roles: ["admin", "editor"],
  profile: {
    bio: "Frontend engineer",
    website: "https://example.com"
  }
};

const WARMUP = 25_000;
const ITERATIONS = 150_000;

for (let i = 0; i < WARMUP; i += 1) {
  userSchema.safeParse(sample);
}

const start = performance.now();
for (let i = 0; i < ITERATIONS; i += 1) {
  userSchema.safeParse(sample);
}
const end = performance.now();

const durationMs = end - start;
const opsPerSecond = Math.round((ITERATIONS / durationMs) * 1000);

console.log("valdix benchmark");
console.log(`iterations : ${ITERATIONS.toLocaleString("en-US")}`);
console.log(`duration   : ${durationMs.toFixed(2)} ms`);
console.log(`throughput : ${opsPerSecond.toLocaleString("en-US")} ops/sec`);
