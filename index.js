// const { Command } = require('commander')
import { Command } from "commander";

import packageJson from "./package.json" with { type: "json" };
import { makeServerNode } from "./server.js";
import { makeClientNode } from "./client.js";

const program = new Command();

program
  .name(packageJson.name)
  .version(packageJson.version)
  .option("-m --mode <mode>", "mode of node", "client")
  .action(cmd)
  .parse(process.argv);

function cmd({mode}) {
    mode = mode.toLowerCase();
    if (mode != "client" && mode != "server") {
       printAndExit("Invalid mode");
    }
    if (mode == "server") {
        makeServerNode()
    } else if (mode == "client") {
        makeClientNode()
    }
}


function printAndExit(message) {
  console.log(message);
  process.exit(0);
}
