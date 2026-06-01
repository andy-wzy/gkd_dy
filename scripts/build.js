import fs from "fs";
import JSON5 from "json5";

const files = [
  "upstream/ganlin.json5",
  "upstream/mrlc.json5"
];

// 规则名称统一
const groupNameMap = {
  "启动广告": "开屏广告",
  "Splash广告": "开屏广告",
  "Splash 广告": "开屏广告",

  "首页弹窗": "弹窗广告",
  "评分弹窗": "弹窗广告",

  "升级提示": "更新提示",
  "版本更新": "更新提示"
};

// 名称标准化
function normalizeGroupName(name = "") {
  return groupNameMap[name] || name;
}

// 生成规则唯一键
function makeGroupKey(group) {
  return JSON.stringify({
    name: normalizeGroupName(group.name),

    activityIds: group.activityIds || [],

    matches: group.matches || [],

    rules: group.rules || []
  });
}

const appMap = new Map();

let sourceAppCount = 0;
let sourceGroupCount = 0;

for (const file of files) {
  console.log(`Loading ${file}`);

  const content = fs.readFileSync(file, "utf8");

  const json = JSON5.parse(content);

  if (!json.apps) continue;

  sourceAppCount += json.apps.length;

  for (const app of json.apps) {
    sourceGroupCount += (app.groups || []).length;

    const appId = app.id;

    if (!appMap.has(appId)) {
      const groupMap = new Map();

      for (const group of app.groups || []) {
        group.name = normalizeGroupName(group.name);

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

    const existing = appMap.get(appId);

    const groupMap = new Map();

    for (const group of existing.groups || []) {
      groupMap.set(
        makeGroupKey(group),
        group
      );
    }

    for (const group of app.groups || []) {
      group.name = normalizeGroupName(group.name);

      const key = makeGroupKey(group);

      if (!groupMap.has(key)) {
        groupMap.set(key, group);
      }
    }

    existing.groups = [...groupMap.values()];
  }
}

const apps = [...appMap.values()];

// 统计
let finalGroupCount = 0;

for (const app of apps) {
  finalGroupCount += (app.groups || []).length;
}

const output = {
  id: "gkd-dy",

  name: "GKD DY",

  version: 1,

  author: "andy-wzy",

  generatedAt: new Date().toISOString(),

  updateUrl:
    "https://raw.githubusercontent.com/andy-wzy/gkd_dy/main/dist/my-gkd.json",

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

console.log("========== BUILD REPORT ==========");
console.log(`Source Apps   : ${sourceAppCount}`);
console.log(`Source Groups : ${sourceGroupCount}`);
console.log(`Final Apps    : ${apps.length}`);
console.log(`Final Groups  : ${finalGroupCount}`);
console.log(
  `Removed       : ${sourceGroupCount - finalGroupCount}`
);
console.log("==================================");
