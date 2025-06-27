const baileys = require("./services/baileys");
const logger = require("./logger");

(async () => {
    try {
        logger.info("Iniciando Schedulers");

        baileys.cronJob();
    } catch (error) {
        logger.error(error)
    }
})();

