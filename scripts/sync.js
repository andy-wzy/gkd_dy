import fs from "fs";
import axios from "axios";

const config = JSON.parse(
  fs.readFileSync("config/sources.json", "utf8")
);

for (const source of config.sources) {
  console.log(`Downloading ${source.name}...`);

  const res = await axios.get(source.url);

  fs.writeFileSync(
    `upstream/${source.name}.json5`,
    res.data
  );

  console.log(`Saved ${source.name}`);
}