import fs from "fs";
import JSON5 from "json5";

const files = [
  "upstream/ganlin.json5",
  "upstream/mrlc.json5"
];

const merged = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");

  const json = JSON5.parse(content);

  if (json.apps) {
    merged.push(...json.apps);
  }
}

fs.writeFileSync(
  "dist/my-gkd.json",
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      apps: merged
    },
    null,
    2
  )
);

console.log("Build complete");