"use strict";
import RPC from "@hyperswarm/rpc";
import crypto from "crypto";
import Hyperbee from "hyperbee";
import Hypercore from "hypercore";
import DHT from "hyperdht";
import Hyperswarm from "hyperswarm";
import { payloadToBuffer } from "./utils.js";

export async function server() {
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
  console.log("dht seed: ", dhtSeed.toString("hex"));
  console.log("hyper bee public key: ", hCore);
  console.log("dht public key: ", dht.defaultKeyPair.publicKey.toString("hex"));
  console.log(
    "rpc server started listening on public key:",
    rpcServer.publicKey.toString("hex")
  );

  const hCoreSwarm = new Hyperswarm();
  hCoreSwarm.join(hCore.discoveryKey);
  hCoreSwarm.on("connection", (conn) => {
    console.log("connection established");
    hCore.replicate(conn);
  });

  mountRoutes(rpcServer);
}

function mountRoutes(server) {
  const router = new Router(server);
  router.handle("ping", (req) => {
    return { nonce: req.nonce + 1 };
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
      return payloadToBuffer(res);
    });
  }
}
