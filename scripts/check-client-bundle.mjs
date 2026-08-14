import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const assetsDirectory = join(process.cwd(), "dist", "assets");
const assetNames = await readdir(assetsDirectory);
const forbiddenPatterns = [
  /(?:SUPABASE_SERVICE_ROLE|DATABASE_URL|AWS_SECRET_ACCESS_KEY|STRIPE_SECRET_KEY)/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
];

for (const assetName of assetNames) {
  const contents = await readFile(join(assetsDirectory, assetName), "utf8");
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(contents)) {
      throw new Error(`Potential server secret found in dist/assets/${assetName}`);
    }
  }
}

console.log(`Checked ${assetNames.length} client assets for server-only secrets.`);