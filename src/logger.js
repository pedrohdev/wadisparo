const pino = require('pino');
const fs = require('fs');
const FileStreamRotator = require('file-stream-rotator');

// Cria pasta de logs se não existir
const logDir = './logs';
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// Cria o stream rotativo (um arquivo por dia)
const rotatingStream = FileStreamRotator.getStream({
    filename: `${logDir}/app-%DATE%.log`,
    frequency: 'daily',
    date_format: 'YYYY-MM-DD',
    verbose: false,
    size: '10M',         // opcional
    max_logs: '14d',     // opcional
    audit_file: `${logDir}/.audit.json`
});

// Cria logger para arquivo
const fileLogger = pino({}, rotatingStream);

// Cria logger para terminal (bonito)
const prettyLogger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true
        }
    }
});

// Wrapper para logar em ambos
const logger = {
    info: (...args) => {
        fileLogger.info(...args);
        prettyLogger.info(...args);
    },
    error: (...args) => {
        fileLogger.error(...args);
        prettyLogger.error(...args);
    },
    warn: (...args) => {
        fileLogger.warn(...args);
        prettyLogger.warn(...args);
    },
    debug: (...args) => {
        fileLogger.debug(...args);
        prettyLogger.debug(...args);
    }
};

module.exports = logger;
