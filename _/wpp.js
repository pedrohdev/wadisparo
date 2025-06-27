const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

(async () => {
    try {


        const client = new Client({
            authStrategy: new LocalAuth(),
        })

        client.on("qr", qr => qrcode.generate(qr, {
            small: true
        }))

        client.on("ready", () => {
            console.log("Whatsapp Cliente Pronto!");

            this.cronJob()
        });

        client.on("message", (...args) => this.handleMsg(...args));

        await client.initialize();

        //await client.getInviteInfo("LUnOAclCkyPHuNgJkeL2J9")
    } catch (error) {
        console.error(error)
    }
})();