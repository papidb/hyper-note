// const { Command } = require('commander')
import { Command } from "commander";

// import { makeClientNode } from "./client.js";
import { CLI } from "./lib/cli.js";
import { Client } from "./lib/client.js";
import { makeClientNode, makeServerNode } from "./lib/node.js";
import { bufferToPayload, printAndExit } from "./lib/utils.js";
import packageJson from "./package.json" with { type: "json" };

const program = new Command();

program
    .name(packageJson.name)
    .version(packageJson.version)
    .option("-m --mode <mode>", "mode of node", "client")
    .option("-n --name <name>", "name of node")
    .action(cmd)
    .parse(process.argv);

async function cmd({ mode, name }) {
    mode = mode.toLowerCase();
    if (mode != "client" && mode != "server") {
        printAndExit("Invalid mode");
    }
    if (mode == "server") {
        return makeServerNode()
        // } else if (mode == "client") {
        // makeClientNode()
    }
    if (!name) {
        printAndExit("Name is required");
    }
    const { hCore, hBee, rpcClient } = await makeClientNode();
    const cli = new CLI()
    const client = new Client(rpcClient, hBee, cli);
    const rl = cli.rl;

    console.log('📝 Welcome to Terminal Notes (Hyperbee)');

    rl.prompt();

    rl.on('line', async (line) => {
        const [command, ...rest] = line.trim().split(' ');
        const text = rest.join(' ');

        switch (command) {
            case 'add':
                if (!text) {
                    console.log('⚠️ Usage: add <your note>');
                } else {
                    const res = await client.request('add-note', { text, name });
                    console.log(res)
                    console.log('✅ Note saved.');
                }
                break;
            case 'list':
                console.log('📄 Notes:');
                for await (const block of client.bee.createReadStream({})) {
                    if (block?.value) {
                        // console.log(block?.value?.toString("utf-8"))
                        const note = bufferToPayload(block.value);
                        console.log(`${note?.name ?? "---"}: ${note.content} ${new Date(note.timestamp).toLocaleString()}`);
                    }
                }
                break;
            case 'exit':
                rl.close();
                printAndExit("👋 Goodbye!");
                break;
            default:
                console.log("❓ Unknown command. Try 'add', 'list', or 'exit'.");
        }

        rl.prompt();
    });

}

