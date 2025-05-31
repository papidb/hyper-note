"use strict";

import RPC from "@hyperswarm/rpc";
import Hyperbee from "hyperbee";
import Hypercore from "hypercore";
import DHT from "hyperdht";
import Hyperswarm from "hyperswarm";

export const client = async () => {
  // const hcore = new Hypercore(RAM, Buffer.from(STORAGE_KEY, "hex"));
  const hCore = new Hypercore(
    "./db/rpc-client-" + Date.now(),
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
  for await (const block of hCore.createReadStream()) {
    if (block) {
      console.log(block.toString("utf-8"));
    }

    // console.log(block.key.toString("hex"));
    // console.log(block.value.toString("utf-8"));
  }
  // let dhtSeed = (await hbee.get("dht-seed"))?.value;
  //   let dhtSeed = Buffer.from(
  //     "1f77e4f7133587b1d2d23dd64c7b51f2b37bb5469553adb1bb9c4f47081e7f2d",
  //     "hex"
  //   );
  // console.log({ dhtSeed: dhtSeed?.toString("hex") });
  // const keyPair = DHT.keyPair(dhtSeed);
  let dhtSeed = Buffer.from(
    "cd2e3b7d87b0f060ae69763987c2b4a23f8d02d3f963e5f69117cd8c7df2659b",
    "hex"
  );
  const keyPair = DHT.keyPair(dhtSeed);
  console.log({
    discoveryKey: hCore.discoveryKey.toString("hex"),
    keyPairPublicKey: keyPair.publicKey.toString("hex"),
  });

  const dht = new DHT({
    port: 40001,
    keyPair: keyPair,
    bootstrap: [{ host: "127.0.0.1", port: 30001 }], // note boostrap points to dht that is started via cli
  });
  await dht.ready();

  const rpc = new RPC({ dht, keyPair });

  //   const rpcServer = await rpc.createServer();
  //   await rpcServer.listen();
  //   rpcServer.respond("pong", async (reqRaw) => {
  //     // reqRaw is Buffer, we need to parse it
  //     const req = JSON.parse(reqRaw.toString("utf-8"));

  //     const resp = { nonce: req.nonce - 1 };

  //     // we also need to return buffer response
  //     const respRaw = Buffer.from(JSON.stringify(resp), "utf-8");
  //     return respRaw;
  //   });

  //   console.log({publicKey: keyPair.publicKey})
  const client = rpc.connect(keyPair.publicKey);
  const value = await client.request("ping", payloadToBuffer({ nonce: 126 }));
  console.log(value.toString("utf-8"));
};

function payloadToBuffer(payload) {
  return Buffer.from(JSON.stringify(payload), "utf-8");
}
