import fs from "fs";

const config = JSON.parse(
  fs.readFileSync("config/sources.json", "utf8")
);

for (const source of config.sources) {
  console.log(`Downloading ${source.name}...`);

  const response = await fetch(source.url);

  if (!response.ok) {
    throw new Error(
      `Failed to download ${source.name}: ${response.status}`
    );
  }

  const content = await response.text();

  fs.writeFileSync(
    `upstream/${source.name}.json5`,
    content,
    "utf8"
  );

  console.log(`Saved ${source.name}`);
}

console.log("All subscriptions downloaded.");
