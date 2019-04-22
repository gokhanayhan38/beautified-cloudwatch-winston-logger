const dotenv = require('dotenv');
const winston = require('winston');
const { format } = winston;
const { combine, timestamp, colorize, align, printf } = format;
const WinstonCloudWatch = require('winston-cloudwatch');
const safeStringify = require('fast-safe-stringify')

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';

const alignedWithColorsAndTime = combine(
    colorize(),
    timestamp(),
    align(),
    printf((info) => {
        let {
            timestamp, level, message, ...args
        } = info;

        let keys = Object.keys(args);
        message = keys.reduce((a, k) => a.replace('{' + k + '}', args[k]), message);

        const ts = timestamp.slice(0, 19).replace('T', ' ');
        return `${ts} [${level}]: ${message}`;
    }),
);

const logger = new winston.createLogger({
    level: process.env.LOG_LEVEL,
    exitOnError: false,
    type: 'aws',
    jsonMessage: true,
    defaultMeta: {service: process.env.SERVICE_NAME},
    transports: []
});

if (process.env.NODE_ENV === 'development') {
    logger.add(new winston.transports.Console({
        format: alignedWithColorsAndTime
    }));
}

const configForAwsCloudWatch = {
    name: process.env.SERVICE_NAME,
    logGroupName: process.env.LOG_GROUP_NAME,
    logStreamName: NODE_ENV,
    awsAccessKeyId: process.env.CLOUD_WATCH_AWS_ACCESS_KEY_ID,
    awsSecretKey: process.env.CLOUD_WATCH_AWS_SECRET_KEY,
    awsRegion: process.env.AWS_REGION,
    retentionInDays: process.env.RETENTION_DAYS,
    jsonMessage: true
};

if (NODE_ENV != 'development') {
    logger.add(new WinstonCloudWatch(configForAwsCloudWatch));
}

logger.stream = {
    write: function(message, encoding) {
        logger.info(message);
    }
};

function customLogFormatter(ctx, exception) {
    if (NODE_ENV === 'production' || NODE_ENV === 'staging'){

        const message = {
            logType: "EXCEPTION",
            requestDetails: {
                url: ctx.originalUrl,
                userIp: ctx.headers['x-real-ip'] || ctx.headers['true-client-ip'] || ctx.headers['cf-connecting-ip'] || ctx.headers['X-Forwarded-For'] || ctx.request.ip,
                tenant: {
                    tenantName: ctx.tenant,
                    tenantId: ctx.tenantId
                },
                request: {
                    body: ctx.request.body || null
                },
                headers: {
                    acceptEncoding: ctx.headers['accept-encoding'],
                    authorization: ctx.headers.authorization,
                    cacheControl: ctx.headers['cache-control'],
                    userAgent: ctx.headers['user-agent']
                }
            },
            exception: {
                stack: exception.stack
            }
        };

        return message;
    } else {
        return {
            message: `[EXCEPTION] 
                                            requestDetails: 
                                                url: ${ctx.originalUrl} 
                                                userIp: ${ctx.headers['x-real-ip'] || ctx.headers['true-client-ip'] || ctx.headers['cf-connecting-ip'] || ctx.headers['X-Forwarded-For'] || ctx.request.ip}
                                                tenant:
                                                    tenantName: ${ctx.tenant}
                                                    tenantId: ${ctx.tenantId}
                                                request: 
                                                    body: ${safeStringify(ctx.request.body) || null}
                                                headers:
                                                    accept-encoding: ${ctx.headers['accept-encoding']}
                                                    authorization: ${ctx.headers.authorization}
                                                    cache-control: ${ctx.headers['cache-control']}
                                                    user-agent: ${ctx.headers['user-agent']}
                                            exception: 
                                                ${exception.message} ${exception.stack || ''}`
        }
    }
}
logger.info({message: "[STARTUP] Logging configured"});

module.exports = {
    logger,
    customLogFormatter
};
