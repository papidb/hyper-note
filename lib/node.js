"use strict";

import RPC from "@hyperswarm/rpc";
import crypto from "crypto";
import Hyperbee from "hyperbee";
import Hypercore from "hypercore";
import DHT from "hyperdht";
import Hyperswarm from "hyperswarm";
import RAM from "random-access-memory";
import { serverLog } from "./logger.js";
import { createHyperBeeSub, getConfig, payloadToBuffer, setConfig } from "./utils.js";

export async function makeClientNode() {
  const config = await getConfig();
  if (!config) {
    printAndExit("Run `npm run server` first");
  }

  const hCore = new Hypercore(() => new RAM(), Buffer.from(config, "hex"));
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

export async function makeServerNode() {
  const hCore = new Hypercore("./db/rpc-server");
  const hBee = new Hyperbee(hCore, {
    keyEncoding: "utf-8",
    valueEncoding: "binary",
  });
  await hBee.ready();

  // start distributed hash table, it is used for rpc service discovery
  // resolved distributed hash table seed for key pair
  let dhtSeed = (await hBee.get("dht-seed"))?.value;
  if (!dhtSeed) {
    // not found, generate and store in db
    dhtSeed = crypto.randomBytes(32);
    await hBee.put("dht-seed", dhtSeed);
  }
  await setConfig(hCore.key.toString("hex"));
  const keyPair = DHT.keyPair(dhtSeed);
  const dht = new DHT({
    port: 40001,
    keyPair,
    bootstrap: [{ host: "127.0.0.1", port: 30001 }], // note boostrap points to dht that is started via cli
  });
  await dht.ready();

  const rpc = new RPC({ dht, keyPair });
  const rpcServer = rpc.createServer();
  await rpcServer.listen();

  //   store db in hyperbee
  await hBee.put("rpc-public-key", keyPair.publicKey.toString("hex"));
  console.info("dht seed: ", dhtSeed.toString("hex"));
  console.info("hyper bee public key: ", hCore);
  console.info(
    "dht public key: ",
    dht.defaultKeyPair.publicKey.toString("hex")
  );
  console.info(
    "rpc server started listening on public key:",
    rpcServer.publicKey.toString("hex")
  );

  const hCoreSwarm = new Hyperswarm();
  hCoreSwarm.join(hCore.discoveryKey);
  hCoreSwarm.on("connection", (conn) => {
    console.log("connection established");
    hCore.replicate(conn);
  });

  mountRoutes(rpcServer, createHyperBeeSub(hBee));
  return {
    hCore,
    hBee,
  };
}

function mountRoutes(server, hBee) {
  serverLog.info("mounting routes");
  const router = new Router(server);
  router.handle("ping", (req) => {
    return { nonce: req.nonce + 1 };
  });
  router.handle("add-note", async (req) => {
    const note = {
      id: crypto.randomUUID(),
      content: req.text,
      timestamp: Date.now(),
      name: req.name,
    };
    await hBee.put(note.id, JSON.stringify(note));
    return { note };
  });
  return router;
}

class Router {
  constructor(server) {
    this.server = server;
    this.handle = this.handle.bind(this);
  }

  async handle(path, handler) {
    return this.server.respond(path, async (reqRaw) => {
      const req = JSON.parse(reqRaw.toString("utf-8"));
      const res = await handler(req);
      if (res === undefined) {
        return payloadToBuffer({});
      }
      return payloadToBuffer(res);
    });
  }
}
