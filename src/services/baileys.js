// baileys-connection.js
const _ = require("lodash");
const NodeCache = require('node-cache');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { default: P } = require('pino');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const fs = require("fs");

const logger = require('../logger');
const delay = require('../utils/delay');

const templatesService = require("./templates");
const getRandomInt = require('../utils/random');
const redis = require('../config/redis');

const groupCache = new NodeCache({ stdTTL: 60 * 60, checkperiod: 120 });

class Baileys {
    prefixRedis = "wpp:"
    test = false;
    isOpen = false;
    sock;

    async main() {
        try {
            if (!this.sock) {
                await this.startSock();
            }

            await this.waitSock();

            let groups = await this.getGroupsList();

            if (this.test)
                groups = groups.filter(([jid, group]) => group.subject.toLowerCase() == "grupo de teste")

            await this.sendMessages(groups, templatesService.getTemplates())
        } catch (error) {
            logger.error(error)
        }
    }

    async sendMessages(groups, templates) {
        try {
            let counter = 1;

            for (const [jid, group] of groups) {
                if (!this.test) {
                    if ((await this.getLogs(jid)).length) {
                        logger.warn(`Uma mensagem ja foi enviada para ${group.subject} a pelo menos 30min`)
                        logger.info(`Pulando grupo para evitar banimento`)
                        continue;
                    }
                }

                logger.info(`- Enviando para: ${group.subject} [${jid}] | ${counter}/${groups.length}`)

                const mentions = group.participants.filter(({ admin }) => !admin).map(({ id }) => id)

                try {
                    for (const template of templates) {
                        logger.info(`- Template carregado "${template.metadata.title}"`)

                        if (template.metadata?.images && Array.isArray(template.metadata?.images) && template.metadata?.images?.length) {
                            for (const imagePath of template.metadata?.images) {
                                try {
                                    logger.info(`Enviando mensagem de ${template.metadata.title} para ${group.subject}`)
                                    await this.sendMediaWithCaption(jid, imagePath, template.content, { mentions })
                                    await this.saveSendLog(jid, group, template)
                                } catch (error) {
                                    logger.error(`Erro ao enviar ${imagePath} de ${template.metadata.title} para ${group.subject} ` + error.message)
                                }

                                if (template.metadata?.images.length > 1) {
                                    logger.info(`Esperando delay entre as imagens`)
                                    await delay(2000)
                                }
                            }
                        } else {
                            try {
                                logger.info(`Enviando mensagem de ${template.metadata.title} para ${group.subject}`)

                                await this.sendMessage(jid, template.content, { mentions })
                                await this.saveSendLog(jid, group, template)
                            } catch (error) {
                                logger.error(`Erro ao enviar ${template.metadata.title} para ${group.subject} ` + error.message)
                            }
                        }

                        if (templates.length > 1) {
                            logger.info(`Esperando delay entre os templates`)
                            await delay(2000)
                        }
                    }
                } catch (error) {
                    logger.error(`Ocorreu um erro ao enviar para o grupo ${group.subject}`)
                }

                counter++
                const msRandom = getRandomInt(10000, 20000)
                logger.info(`Aguardando delay de ${msRandom}ms`)

                await delay(msRandom)
            }

        } catch (error) {
            logger.error(error)
        }
    }

    async sendMediaWithCaption(jid, mediaPath, content, options = {}) {
        try {
            const buffer = fs.readFileSync(mediaPath);

            await this.sock.sendMessage(jid, {
                image: buffer,
                caption: content,
                ...options
            });
        } catch (error) {
            logger.error(error)
            throw error
        }
    }

    async sendMessage(jid, content, options = {}) {
        try {
            await this.sock.sendMessage(jid, {
                text: content,
                ...options
            });
        } catch (error) {
            logger.error(error)
            throw error
        }
    }

    async getGroupsList() {
        try {
            let groups = await this.sock.groupFetchAllParticipating();

            groups = Object.entries(groups).filter(([jid, group]) => !group?.announce && !group?.isCommunityAnnounce && !group.isCommunity)

            console.log(`Grupos permitidos para o envio de mensagens (${groups.length}):`);

            for (const [jid, group] of groups) {
                console.log(`- ${group.subject} [${jid}]`);
            }

            return groups
        } catch (error) {
            logger.error(error.message)
        }
    }

    /* async joinMissingGroups() {
        try {
            if (!this.sock) {
                await this.startSock();
            }

            await this.waitSock();

            let groupsList = require("../../data/grupos-validos-wpp-2.json");

            let groupsFiltered = _.uniqBy(groupsList, 'code');

            groupsFiltered = (_.orderBy(groupsFiltered, ['wppData.size'], ['desc']))

            groupsFiltered = groupsFiltered.filter(({ wppData: { size, membershipApprovalMode } }) => size >= 80)


            let groups = await this.sock.groupFetchAllParticipating();
            const joinedGroupJids = Object.keys(groups);

            for (let i = 0; i < groupsFiltered.length; i++) {
                try {
                    const group = groupsFiltered[i]

                    logger.info(`[${i + 1}/${groupsFiltered.length}] | ${group.data.name} - ${group.wppData.id._serialized} (${group.wppData.size})`)
                    const groupJid = group.wppData.id._serialized

                    if (!joinedGroupJids.includes(groupJid)) {
                        logger.info(`Entrando no grupo: ${group.data.name}`);

                        try {
                            await this.sock.groupAcceptInvite(group.code);


                        } catch (error) {
                            logger.error(error)
                        }

                        let ms = getRandomInt(40000, 70000)
                        logger.info(`Aguardando ${ms}ms`)

                        await delay(ms)

                    } else {
                        logger.info(`Já está no grupo: ${group.data.name}`);
                    }
                } catch (err) {
                    logger.error(`Erro com código ${code}:`, err.message);
                }
            }

            console.log(joinedGroupJids)
        } catch (error) {
            logger.error(error.message)
        }
    }
 */
    async startSock() {
        try {
            const { state, saveCreds } = await useMultiFileAuthState('auth'); // persists session in 'auth' folder

            this.sock = makeWASocket({
                logger: P({ level: 'silent' }),
                printQRInTerminal: true, // Alternatively use qrcode-terminal below
                auth: state,
                browser: ['MyApp', 'Chrome', '1.0.0'],
                cachedGroupMetadata: async (jid) => {
                    const fromCache = groupCache.get(jid);
                    if (fromCache) {
                        return fromCache;
                    }
                    try {
                        const metadata = await this.sock.groupMetadata(jid);
                        groupCache.set(jid, metadata);
                        return metadata;
                    } catch (err) {
                        logger.error('❌ Error fetching group metadata:', err);
                        return null;
                    }
                }
            });

            this.sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    qrcode.generate(qr, { small: true });
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
                    console.log('Connection closed. Reconnecting:', shouldReconnect);
                    if (shouldReconnect) {
                        this.startSock();
                    }
                }

                if (connection === 'open') {
                    console.log('✅ Connected to WhatsApp!');
                    this.isOpen = true
                }
            });

            this.sock.ev.on('creds.update', saveCreds);
        } catch (error) {
            logger.error(error)
        }
    };

    async waitSock(timeoutMs = 60000) {
        return new Promise(async (res, rej) => {
            const start = Date.now();
            try {
                while (true) {
                    if (this.isOpen)
                        res(true)

                    if (Date.now() - start > timeoutMs) {
                        return rej(new Error('Timeout waiting for isOpen'));
                    }

                    await delay(2000)
                }
            } catch (error) {
                rej(error)
            }

        })
    }

    saveSendLog(jid, group, template, expiresIn = 60 * 30) {
        const key = this.prefixRedis + jid + ":" + Date.now()

        return redis.set(key, JSON.stringify({
            group,
            template
        }), "EX", expiresIn)
    }

    async getLogs(jid) {
        try {
            let keys = this.prefixRedis + jid + ":*"

            keys = await redis.keys(keys)

            return keys.map(async key => {
                try {
                    return JSON.parse(await redis.get(key))
                } catch (error) {
                    logger.error(error)
                }
            }).filter(val => val)
        } catch (error) {
            logger.error(error)
        }

    }

    async cronJob() {
        try {
            cron.schedule('0 8 * * *', async () => {
                try {
                    logger.info("Scheduler working at 8am")
                    await this.main()
                } catch (error) {
                    logger.error(error)
                }
            });

            cron.schedule('30 11 * * *', async () => {
                try {
                    logger.info("Scheduler working at 11:30")
                    await this.main()
                } catch (error) {
                    logger.error(error)
                }
            });

            cron.schedule('0 14 * * *', async () => {
                try {
                    logger.info("Scheduler working at 14:00")
                    await this.main()
                } catch (error) {
                    logger.error(error)
                }
            });

            cron.schedule('0 17 * * *', async () => {
                try {
                    logger.info("Scheduler working at 17:00")
                    await this.main()
                } catch (error) {
                    logger.error(error)
                }
            });

            cron.schedule('0 19 * * *', async () => {
                try {
                    logger.info("Scheduler working at 19:00")
                    await this.main()
                } catch (error) {
                    logger.error(error)
                }
            });

            cron.schedule('0 21 * * *', async () => {
                try {
                    logger.info("Scheduler working at 21:00")
                    await this.main()
                } catch (error) {
                    logger.error(error)
                }
            });

            cron.schedule('30 23 * * *', async () => {
                try {
                    logger.info("Scheduler working at 23:30")
                    await this.main()
                } catch (error) {
                    logger.error(error)
                }
            });
        } catch (error) {
            logger.error(error)
        }
    }
};

module.exports = new Baileys();
