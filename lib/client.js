import {
  bufferToPayload,
  createHyperBeeSub,
  payloadToBuffer,
} from "./utils.js";
import { CLI } from "./cli.js";

export class Client {
  constructor(rpcClient, bee, cli = new CLI()) {
    this.bee = createHyperBeeSub(bee);
    this.rpcClient = rpcClient;
    this.cli = cli;

    this.request = this.request.bind(this);
  }

  async request(route, payload) {
    const res = await this.rpcClient.request(route, payloadToBuffer(payload));
    return bufferToPayload(res);
  }
}
