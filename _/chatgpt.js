/// esse script irá validar a autorização de divulgação dos grupos

const { OpenAI } = require('openai');
const fs = require("fs");

const logger = require('../src/logger');
const delay = require('../src/utils/delay');
const openai = new OpenAI({ apiKey: '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' });

async function classificarDescricao(descricao) {
    const prompt = `Classifique a descrição abaixo com base nas regras:
0 - Divulgação proibida
1 - Divulgação permitida
2 - Divulgação com permissão do admin
3 - Nada claro

Descrição: "${descricao}"

Apenas retorne um número: 0, 1, 2 ou 3.`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: 'Você é um classificador de regras de grupos de WhatsApp.' },
            { role: 'user', content: prompt }
        ],
        temperature: 1
    });

    return response.choices[0].message.content.trim();
}


(async () => {
    try {
        let gruposParsed = []

        if (fs.existsSync("../data/grupos-validos-wpp-1.json")) {
            gruposParsed = JSON.parse(fs.readFileSync("./data/grupos-validos-wpp-1.json", { encoding: "utf-8" }))
        }

        let gruposValidos = JSON.parse(fs.readFileSync("../data/grupos-validos-wpp.json", { encoding: "utf-8" }))


        gruposValidos = gruposValidos.filter(({ code }) => !gruposParsed.find(({ code: _code }) => _code == code))

        for (let i = 0; i < gruposValidos.length; i++) {
            logger.info(`${i}/${gruposValidos.length}`)

            const grupo = gruposValidos[i];

            const divulgar = (await classificarDescricao(grupo.wppData.desc)).trim()

            grupo.divulgar = divulgar

            gruposParsed.push(grupo)

            fs.writeFileSync("../data/grupos-validos-wpp-1.json", JSON.stringify(gruposParsed, null, 4));

            await delay(500)
        }
    } catch (error) {
        logger.error(error)
    }
})();