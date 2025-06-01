"use strict";

import RPC from "@hyperswarm/rpc";
import Hyperbee from "hyperbee";
import Hypercore from "hypercore";
import DHT from "hyperdht";
import Hyperswarm from "hyperswarm";
import RAM from "random-access-memory";

export async function makeClientNode() {
  const hCore = new Hypercore(
    // TODO: rename to use ram
    // "./db/rpc-client-alpha",
    () => new RAM(),
    Buffer.from(
      "327e0f372495294e06e78d5546557990f8eb3d3bf12630f69aec43517745bdf9",
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

  const rpcClient = rpc.connect(keyPair.publicKey);

  return {
    hCore,
    hBee,
    rpcClient,
  };
}
