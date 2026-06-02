import fs from "fs";
import JSON5 from "json5";

const sourceConfig = JSON.parse(
  fs.readFileSync(
    "config/sources.json",
    "utf8"
  )
);

const files =
  sourceConfig.sources.map(
    source =>
      `upstream/${source.name}.json5`
  );

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
  "dist/my-gkd.json5",
  JSON.stringify(
    output,
    null,
    2
  )
);
const report = {
  generatedAt: new Date().toISOString(),

  sourceApps: sourceAppCount,

  sourceGroups: sourceGroupCount,

  finalApps: apps.length,

  finalGroups: finalGroupCount,

  removedGroups:
    sourceGroupCount - finalGroupCount,

  dedupRate:
    (
      (
        sourceGroupCount -
        finalGroupCount
      ) /
      sourceGroupCount *
      100
    ).toFixed(2) + "%"
};

if (!fs.existsSync("reports")) {
  fs.mkdirSync("reports");
}

fs.writeFileSync(
  "reports/statistics.json",
  JSON.stringify(
    report,
    null,
    2
  )
);
const stableApps = apps.map(app => {
  return {
    ...app,

    groups: (app.groups || []).filter(
      group =>
        !(
          group.name?.includes("测试") ||
          group.name?.includes("实验")
        )
    )
  };
});

fs.writeFileSync(
  "dist/my-gkd-stable.json5",
  JSON.stringify(
    {
      ...output,

      id: "gkd-dy-stable",

      name: "GKD DY Stable",

      apps: stableApps
    },
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
