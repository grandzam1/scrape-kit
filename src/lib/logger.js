const levels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const current = levels[process.env.LOG_LEVEL?.toLowerCase()] ?? levels.info;

function log(level, message, extra) {
  if (levels[level] < current) return;
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}`;
  if (extra !== undefined) {
    console[level === "error" ? "error" : "log"](line, extra);
  } else {
    console[level === "error" ? "error" : "log"](line);
  }
}

export const logger = {
  debug: (m, e) => log("debug", m, e),
  info: (m, e) => log("info", m, e),
  warn: (m, e) => log("warn", m, e),
  error: (m, e) => log("error", m, e),
};
