import { rm } from "node:fs/promises";

const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const target = new URL("../dist", import.meta.url);
const maxRetries = 5;

for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
  try {
    await rm(target, { recursive: true, force: true });
    break;
  } catch (error) {
    const message = String(error);
    const isBusy = message.includes("EBUSY");
    if (!isBusy || attempt === maxRetries) {
      throw error;
    }
    await wait(80 * attempt);
  }
}
