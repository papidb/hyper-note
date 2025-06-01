import fs from "fs/promises";
import path from "path";
import configs from "tiny-configs";

export function payloadToBuffer(payload) {
  return Buffer.from(JSON.stringify(payload), "utf-8");
}

export function bufferToPayload(buffer) {
  return JSON.parse(buffer.toString("utf-8"));
}

export function printAndExit(message) {
  console.log(message);
  process.exit(0);
}

export function createHyperBeeSub(bee) {
  return bee.sub("notes");
}

export async function getConfig(fileName = "config.txt") {
  const file = await fs.readFile(path.join(process.cwd(), fileName));
  const [config] = configs.parse(file);
  return config;
}

export function setConfig(config, fileName = "config.txt") {
  return fs.writeFile(fileName, config, { flag: "w" });
}
