const fs = require("fs");

const torService = require('./torService');

setInterval(async () => {
    try {
        await torService.changeIP()
    } catch (error) {
        console.log(error)
    }

    try{
    const newFileLinks = (JSON.parse(fs.readFileSync("./grupos.json", { encoding: "utf-8" })))

    console.log(`Progresso: ${newFileLinks.filter(({ verified }) => verified).length}/${newFileLinks.length}`)
    }catch(err){
    
    }

}, 10000)

