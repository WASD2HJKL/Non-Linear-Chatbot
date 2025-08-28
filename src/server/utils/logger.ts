import pino from "pino";

function getLogLevel(): string {
    const env = process.env.NODE_ENV;
    if (env === "development") {
        return "debug";
    }
    return "info";
}

function createLogger() {
    const level = getLogLevel();
    const env = process.env.NODE_ENV || "development";

    if (env === "development") {
        // Development: Pretty printed console output
        return pino({
            level,
            transport: {
                target: "pino-pretty",
                options: {
                    colorize: true,
                    translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
                    ignore: "pid,hostname",
                },
            },
        });
    } else if (env === "production") {
        // Production: JSON format to file
        return pino({
            level,
            formatters: {
                level: (label) => {
                    return { level: label };
                },
            },
        });
    } else {
        // Container: JSON format to stdout
        return pino({
            level,
            formatters: {
                level: (label) => {
                    return { level: label };
                },
            },
        });
    }
}

const logger = createLogger();
export default logger;
