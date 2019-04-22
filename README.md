# beautified-cloudwatch-winston-logger

Beautified cloudwatch winston based logger, you can search query params, request body and messages on cloudwatch.
# Usage

    const {logger, customLogFormatter} = require('./logger');
    
    logger.info({message: `[STARTUP] Server is starting on port: ${PORT}`});
    logger.error(customLogFormatter(ctx, exception.stack));