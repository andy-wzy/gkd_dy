import fs from "fs";
import JSON5 from "json5";

// 读取 sources.json
const sourceConfig = JSON.parse(
  fs.readFileSync("config/sources.json", "utf8")
);

const files = sourceConfig.sources.map(
  source => `upstream/${source.name}.json5`
);

// 规则名称统一映射
const groupNameMap = {
  "启动广告": "开屏广告",
  "Splash广告": "开屏广告",
  "Splash 广告": "开屏广告",
  "首页弹窗": "弹窗广告",
  "评分弹窗": "弹窗广告",
  "升级提示": "更新提示",
  "版本更新": "更新提示"
};

function normalizeGroupName(name = "") {
  return groupNameMap[name] || name;
}

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
        groupMap.set(makeGroupKey(group), group);
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
      groupMap.set(makeGroupKey(group), group);
    }

    for (const group of app.groups || []) {
      group.name = normalizeGroupName(group.name);
      const key = makeGroupKey(group);
      if (!groupMap.has(key)) groupMap.set(key, group);
    }

    existing.groups = [...groupMap.values()];
  }
}

const apps = [...appMap.values()];

// 统计信息
let finalGroupCount = 0;
for (const app of apps) finalGroupCount += (app.groups || []).length;

const report = {
  generatedAt: new Date().toISOString(),
  sourceApps: sourceAppCount,
  sourceGroups: sourceGroupCount,
  finalApps: apps.length,
  finalGroups: finalGroupCount,
  removedGroups: sourceGroupCount - finalGroupCount,
  dedupRate: ((sourceGroupCount - finalGroupCount) / sourceGroupCount * 100).toFixed(2) + "%"
};

// 输出 JSON5 格式
const output = {
  id: 10001, // 顶层id改成数字
  name: "GKD DY Quality",
  version: 1,
  author: "andy-wzy",
  updateUrl: "https://raw.githubusercontent.com/andy-wzy/gkd_dy/main/dist/my-gkd.json5",
  apps
};

if (!fs.existsSync("dist")) fs.mkdirSync("dist");

// 输出完整订阅 JSON5
fs.writeFileSync(
  "dist/my-gkd.json5",
  JSON5.stringify(output, null, 2)
);

// 输出稳定版订阅（去掉测试/实验规则）
const stableApps = apps.map(app => ({
  ...app,
  groups: (app.groups || []).filter(
    g => !(g.name?.includes("测试") || g.name?.includes("实验"))
  )
}));

fs.writeFileSync(
  "dist/my-gkd-stable.json5",
  JSON5.stringify(
    {
      ...output,
      id: 10002, // 稳定版单独数字id
      name: "GKD DY Stable",
      apps: stableApps
    },
    null,
    2
  )
);

// 输出统计报告
if (!fs.existsSync("reports")) fs.mkdirSync("reports");
fs.writeFileSync("reports/statistics.json", JSON.stringify(report, null, 2));

console.log("========== BUILD REPORT ==========");
console.log(JSON.stringify(report, null, 2));
console.log("==================================");
console.log("Build complete ✅ JSON5 + Quality Analysis");
