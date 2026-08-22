import { logger } from "./logger.js";

export function exitOk(message, paths = {}) {
  if (message) logger.info(message);
  for (const [key, value] of Object.entries(paths)) {
    logger.info(`${key}: ${value}`);
  }
  process.exit(0);
}

export function exitFail(error) {
  const msg = error instanceof Error ? error.message : String(error);
  logger.error(msg);
  if (error instanceof Error && error.stack) {
    logger.debug(error.stack);
  }
  process.exit(1);
}
