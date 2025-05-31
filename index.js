// const { Command } = require('commander')
import { Command } from "commander";

import packageJson from "./package.json" with { type: "json" };
import { server } from "./server.js";
import { client } from "./client.js";

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
        server()
    } else if (mode == "client") {
        client()
    }
}


function printAndExit(message) {
  console.log(message);
  process.exit(0);
}
