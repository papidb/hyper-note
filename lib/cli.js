import readline from "readline";

export class CLI {
  constructor(
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "> ",
    })
  ) {
    this.rl = rl;
  }
  async askTerminal(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }
}
