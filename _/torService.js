const tr = require('tor-request');
const axios = require("./axios")

tr.TorControlPort.password = '510166';

class TorService {
    changeIP() {
        return new Promise((res, rej) => {
            try {
                tr.renewTorSession((err) => err ? console.log(err) : null);

                setTimeout(async () => {
                    try {
                        const response = await axios.get('https://idomepuxadas.xyz/api/v2/ip/03eea653-a504-4033-9db0-aef171b2bff2')

                        console.log('Seu IP via Tor é:' + response.data.data.ip);

                        res(response.data.data.ip)
                    } catch (error) {
                        res(null)
                        console.log(error)
                    }

                }, 5000)
            } catch (error) {
                console.error(error)
                rej(error)
            }
        })

    }
}

module.exports = new TorService()
