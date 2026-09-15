import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadClient(slug) {
  const file = path.join(__dirname, "clients", `${slug}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(
      `No client config found for "${slug}". Add src/clients/${slug}.json (copy an existing one as a template).`
    );
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}
