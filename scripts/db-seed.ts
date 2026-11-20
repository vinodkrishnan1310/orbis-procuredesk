import { truncateAndSeed } from "../lib/seed";

async function main() {
  await truncateAndSeed();
  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});