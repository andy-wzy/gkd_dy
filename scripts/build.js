import fs from "fs";
import JSON5 from "json5";

const files = [
  "upstream/ganlin.json5",
  "upstream/mrlc.json5"
];

// App容器
const appMap = new Map();

function makeGroupKey(group) {
  return JSON.stringify(
    {
      activityIds: group.activityIds || [],
      matches: group.matches || [],
      rules: group.rules || []
    },
    null,
    0
  );
}

for (const file of files) {
  console.log(`Loading ${file}`);

  const content = fs.readFileSync(file, "utf8");

  const json = JSON5.parse(content);

  if (!json.apps) continue;

  for (const app of json.apps) {
    const appId = app.id;

    // 首次出现
    if (!appMap.has(appId)) {
      const groupMap = new Map();

      for (const group of app.groups || []) {
        groupMap.set(
          makeGroupKey(group),
          group
        );
      }

      appMap.set(appId, {
        ...app,
        groups: [...groupMap.values()]
      });

      continue;
    }

    // 已存在App
    const existing = appMap.get(appId);

    const groupMap = new Map();

    // 先放已有规则
    for (const group of existing.groups || []) {
      groupMap.set(
        makeGroupKey(group),
        group
      );
    }

    // 再放新规则
    for (const group of app.groups || []) {
      const key = makeGroupKey(group);

      if (!groupMap.has(key)) {
        groupMap.set(key, group);
      }
    }

    existing.groups = [...groupMap.values()];
  }
}

// 输出
const apps = [...appMap.values()];

// 统计
let groupCount = 0;

for (const app of apps) {
  groupCount += (app.groups || []).length;
}

const output = {
  id: "gkd-dy",
  name: "GKD DY",
  version: 1,
  author: "andy-wzy",
  generatedAt: new Date().toISOString(),
  apps
};

if (!fs.existsSync("dist")) {
  fs.mkdirSync("dist");
}

fs.writeFileSync(
  "dist/my-gkd.json",
  JSON.stringify(
    output,
    null,
    2
  )
);

console.log("==========");
console.log(`Apps   : ${apps.length}`);
console.log(`Groups : ${groupCount}`);
console.log("==========");
console.log("Build complete");
