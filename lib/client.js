import {
  bufferToPayload,
  createHyperBeeSub,
  payloadToBuffer,
} from "./utils.js";
import { CLI } from "./cli.js";

export class Client {
  constructor(rpcClient, bee, cli = new CLI()) {
    this.name = "";
    this.bee = createHyperBeeSub(bee);
    this.rpcClient = rpcClient;
    this.cli = cli;

    this.printHistory = this.printHistory.bind(this);
    this.request = this.request.bind(this);
  }

  async printHistory() {
    // const stream = this.bee.createHistoryStream();
    // stream.on("data", async (nonLiveData) => {
    //   console.log({ nonLiveData: nonLiveData?.value });
    // });
    for await (const block of this.bee.createReadStream()) {
      console.log(block.toString("utf-8"));
    }
  }
  async request(route, payload) {
    const res = await this.rpcClient.request(route, payloadToBuffer(payload));
    return bufferToPayload(res);
  }
}
