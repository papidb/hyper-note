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
