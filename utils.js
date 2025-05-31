export function payloadToBuffer(payload) {
  return Buffer.from(JSON.stringify(payload), "utf-8");
}
