# beautified-cloudwatch-winston-index

Beautified cloudwatch winston based index, you can search query params, request body and messages on cloudwatch.
# Usage

    const {index, customLogFormatter} = require('./index');
    
    index.info({message: `[STARTUP] Server is starting on port: ${PORT}`});
    index.error(customLogFormatter(ctx, exception.stack));