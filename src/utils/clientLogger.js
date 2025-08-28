/**
 * Client-side logger utility
 * Provides a Pino-compatible API for browser console logging
 */

function createLogger() {
    const logger = {
        debug: function (message, ...args) {
            if (typeof console !== "undefined" && console.debug) {
                console.debug(message, ...args);
            } else if (typeof console !== "undefined" && console.log) {
                console.log("[DEBUG]", message, ...args);
            }
        },

        info: function (message, ...args) {
            if (typeof console !== "undefined" && console.info) {
                console.info(message, ...args);
            } else if (typeof console !== "undefined" && console.log) {
                console.log("[INFO]", message, ...args);
            }
        },

        warn: function (message, ...args) {
            if (typeof console !== "undefined" && console.warn) {
                console.warn(message, ...args);
            } else if (typeof console !== "undefined" && console.log) {
                console.log("[WARN]", message, ...args);
            }
        },

        error: function (message, ...args) {
            if (typeof console !== "undefined" && console.error) {
                console.error(message, ...args);
            } else if (typeof console !== "undefined" && console.log) {
                console.log("[ERROR]", message, ...args);
            }
        },

        child: function (_bindings) {
            // No-op for client-side - return same instance
            // This maintains API compatibility with Pino
            return this;
        },
    };

    return logger;
}

export default createLogger();
