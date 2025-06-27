const { makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');

const fs = require("fs");
const { fetch } = require('undici');
const getAgent = require("./proxyAgent");
const torService = require('./torService');
const cheerio = require("cheerio");

const { socksDispatcher } = require("fetch-socks");

let proxy = "socks5h://127.0.0.1:9050"

const gruposTxt = fs.readFileSync("./GRUPOS.txt", { encoding: "utf-8" });
let links;

if (!fs.existsSync("./grupos.json")) {

    links = gruposTxt.match(/https:\/\/chat\.whatsapp\.com\/\S+/g);

    links = links.map(link => ({ link, code: link.split("chat.whatsapp.com/")[1].split("?")[0], verified: false }))

    fs.writeFileSync("./grupos.json", JSON.stringify(links, null, 4))
} else {
    links = JSON.parse(fs.readFileSync("./grupos.json", { encoding: "utf-8" }))
}

let edit = (id, data) => {
    let __ = JSON.parse(fs.readFileSync("./grupos.json", { encoding: "utf-8" }))

    let newList = __.map((lnk) => {
        if (lnk.code === id) {
            return {
                ...lnk,
                ...data
            }

        } else {
            return lnk
        }
    })


    fs.writeFileSync("./grupos.json", JSON.stringify(newList, null, 4))
}



(async () => {
    try {
        const pLimit = (await import("p-limit")).default;

        const limit = pLimit(2);
        const dispatcher = socksDispatcher({
            type: 5,
            host: "127.0.0.1",
            port: 9050,

            //userId: "username",
            //password: "password",
        });

        const getGroup = async ({ link, code }) => {
            try {
                const data = await fetch(link, {
                    dispatcher,
                    method: "GET",
                    headers: {
                        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                        "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                        "cache-control": "no-cache",
                        "cookie": "wa_csrf=tvEfFwF-Ok9W00laF0PG5i; wa_lang_pref=pt_br",
                        "pragma": "no-cache",
                        "priority": "u=0, i",
                        "sec-ch-ua": "\"Google Chrome\";v=\"137\", \"Chromium\";v=\"137\", \"Not/A)Brand\";v=\"24\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": "\"Windows\"",
                        "sec-fetch-dest": "document",
                        "sec-fetch-mode": "navigate",
                        "sec-fetch-site": "none",
                        "sec-fetch-user": "?1",
                        "upgrade-insecure-requests": "1",
                        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
                    }

                }).then(res => res.text()).catch(err => console.error(err))

                if (!data) {
                    console.log(`Grupo ${code} erro na requisição`);

                    return
                }

                const $ = cheerio.load(data)


                if (!$("._9vd5._9scr").html().trim()) {
                    console.log(`Grupo ${code} | Nao Existe`)
                    edit(code, {
                        link,
                        code,
                        "verified": true,
                        "exists": false
                    })
                    return;
                } else {
                    console.log(`Grupo ${code} | Existe`)

                    const name = $("._9vd5._9scr").html().trim()
                    const img = $("#action-icon img").attr("src")
                    edit(code, {
                        link,
                        code,
                        "verified": true,
                        "exists": true,
                        data: {
                            name,
                            img
                        }
                    })

                    return;
                }


            } catch (error) {
                console.error(error)
            }
        }

        let execute = links.filter(link => !link.verified)

        console.log(execute)

        console.log(`${execute.length}/${links.length} links por executar`)

        execute = execute.map((_) => limit(() => getGroup(_)))

            (await Promise.all(execute))

        //fs.writeFileSync("./grupos.json", JSON.stringify(execute, null, 4))
    } catch (error) {
        console.error(error)
    }
})();
