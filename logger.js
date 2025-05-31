import debug from "debug";
import packageJson from "./package.json" with { type: "json" };

export class Logger {
  constructor(namespace, showLevel = true) {
    this.showLevel = showLevel;
    this.logger = debug(namespace);
    if (process.env.NODE_ENV === "test") {
      this.logger.log = console.log.bind(console);
    }
  }

  enabled() {
    return this.logger.enabled;
  }

  trace(message) {
    this.logger(this.formatMessage(message, "TRACE"));
  }

  debug(message) {
    this.logger(this.formatMessage(message, "DEBUG"));
  }

  info(message) {
    this.logger(this.formatMessage(message, "INFO"));
  }

  warn(message) {
    this.logger(this.formatMessage(message, "WARN"));
  }

  error(message) {
    this.logger(this.formatMessage(message, "ERROR"));
  }

  formatMessage(message, level) {
    return `${this.showLevel ? `[${level}] ` : ""}${message}`;
  }
}

export const log = new Logger(packageJson.name);
export const clientLog = new Logger(packageJson.name + ":client");
export const serverLog = new Logger(packageJson.name + ":server");
