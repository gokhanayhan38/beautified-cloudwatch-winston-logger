
const {logger, customLogFormatter} = require('./logger');

const PORT = process.env.PORT || 3000;
logger.info({message: `[STARTUP] Server is starting on port: ${PORT}`});

// ctx is a koa context object
// logger.error(customLogFormatter(ctx, exception.stack));