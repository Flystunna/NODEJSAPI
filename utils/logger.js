const winston = require("winston");
const winstonRotator = require("winston-daily-rotate-file");
const appRoot = require('app-root-path');

const logFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.printf(info => `${info.timestamp} ${info.level} : ${info.message}`),
);


const transport = new winstonRotator({
    filename: `${appRoot}/logs/success/json`,
    //filename: './logs/success/json',
    datePattern: 'yyyy-MM-DD',
    //handleExceptions: true,
    zippedArchive: true,
    maxSize: 5242880, // 5MB
    maxFiles: 5,
    prepend: true,
    level: 'info'
});

const successLogger = winston.createLogger({
    format: logFormat,
    transports: [transport, new winston.transports.Console({
        level: "info"
    })]
});

const errorTransport = new winstonRotator({
    //filename: './logs/error/json',
    filename: `${appRoot}/logs/error/json`,
    datePattern: 'yyyy-MM-DD',
    zippedArchive: true,
    maxSize: 5242880, // 5MB
    maxFiles: 5,
    prepend: true,
    level: 'error'
});

const errorLogger = winston.createLogger({
    format: logFormat,
    transports: [errorTransport, new winston.transports.Console({
        level: "error"
    })]
});

successLogger.stream = {
    write: function(message, encoding) {
      successLogger.info(message);
    },
  };

errorLogger.stream = {
    write: function(message, encoding) {
      errorLogger.error(message);
    },
  };

module.exports = {
    'successLogger': successLogger,
    'errorLogger': errorLogger
};
