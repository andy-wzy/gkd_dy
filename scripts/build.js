import fs from "fs";
import JSON5 from "json5";

const files = [
  "upstream/ganlin.json5",
  "upstream/mrlc.json5"
];

const appMap = new Map();

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");

  const json = JSON5.parse(content);

  if (!json.apps) continue;

  for (const app of json.apps) {
    const appId = app.id;

    if (!appMap.has(appId)) {
      appMap.set(appId, {
        ...app,
        groups: [...(app.groups || [])]
      });

      continue;
    }

    const existing = appMap.get(appId);

    const groupMap = new Map();

    for (const group of existing.groups) {
      groupMap.set(group.name, group);
    }

    for (const group of app.groups || []) {
      if (!groupMap.has(group.name)) {
        groupMap.set(group.name, group);
      }
    }

    existing.groups = [...groupMap.values()];
  }
}

const apps = [...appMap.values()];

fs.writeFileSync(
  "dist/my-gkd.json",
  JSON.stringify(
    {
      id: "gkd-dy-merged",
      name: "GKD DY",
      version: 1,
      generatedAt: new Date().toISOString(),
      apps
    },
    null,
    2
  )
);

console.log(`Apps: ${apps.length}`);
console.log("Build complete");
