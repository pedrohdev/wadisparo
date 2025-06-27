const _ = require("lodash");
const fs = require("fs");

let grupos = require("../data/grupos-validos-wpp-2.json");

let gruposFiltered = (_.orderBy(grupos, ['wppData.size'], ['desc'])).filter(grupo => grupo?.divulgar != "0");

gruposFiltered = gruposFiltered.filter(({ wppData: { size, membershipApprovalMode } }) => size >= 80)

console.log(gruposFiltered.length)