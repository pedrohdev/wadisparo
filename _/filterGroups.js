const fs = require("fs");
let grupos = require("./grupos.json");

let validos = grupos.filter(({ exists }) => exists)

console.log(`${validos.length}/${grupos.length} grupos válidos`)

fs.writeFileSync("./grupos-validos.json", JSON.stringify(validos, null, 4))