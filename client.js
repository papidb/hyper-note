"use strict";

import RPC from "@hyperswarm/rpc";
import Hyperbee from "hyperbee";
import Hypercore from "hypercore";
import DHT from "hyperdht";
import Hyperswarm from "hyperswarm";
import RAM from "random-access-memory";
import { payloadToBuffer } from "./utils.js";

export async function makeClientNode() {
  const hCore = new Hypercore(
    () => new RAM(),
    Buffer.from(
      "6d29b15134d84b7882ad71a3519be21eaa004d5a55320d23caba5a075f877035",
      "hex"
    )
  );
  const hBee = new Hyperbee(hCore, {
    keyEncoding: "utf-8",
    valueEncoding: "binary",
  });
  await hBee.ready();
  const swarm = new Hyperswarm();
  await hCore.update();

  swarm.join(hCore.discoveryKey);
  swarm.on("connection", (conn) => hCore.replicate(conn));
  await swarm.flush();

  await hCore.update();
  await hCore.replicate(true);
  let dhtSeed = (await hBee.get("dht-seed"))?.value;
  console.log({ dhtSeed: dhtSeed?.toString("hex") });
  const keyPair = DHT.keyPair(dhtSeed);

  const dht = new DHT({
    port: 40001,
    keyPair: keyPair,
    bootstrap: [{ host: "127.0.0.1", port: 30001 }], // note boostrap points to dht that is started via cli
  });
  await dht.ready();

  const rpc = new RPC({ dht, keyPair });

  const client = rpc.connect(keyPair.publicKey);
  const value = await client.request("ping", payloadToBuffer({ nonce: 126 }));
  console.log(value.toString("utf-8"));
}
