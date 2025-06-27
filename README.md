# 🤖 Robô de Mensagens Automáticas para Grupos do WhatsApp

Este projeto é um bot desenvolvido com **Node.js** e a biblioteca **Baileys** para enviar mensagens automáticas em **grupos do WhatsApp** de forma **agendada**. Ideal para marketing, lembretes, notificações ou interações programadas.

---

## 🚀 Funcionalidades

- Envio de mensagens automáticas para grupos
- Agendamento com cron jobs (diário, semanal, específico)
- Delay entre envios para evitar bloqueios
- Suporte a mencionar todos do grupo
- Templates em Markdown
---

## 🧠 Tecnologias Utilizadas

- [Node.js](https://nodejs.org/)
- [Baileys](https://github.com/WhiskeySockets/Baileys)
- [node-cron](https://www.npmjs.com/package/node-cron)
...

---

## 📦 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/pedrohdev/wadisparo.git
cd wadisparo
````

### 2. Instale as dependências

```bash
npm install
```

### 3. Crie o arquivo `.env`

```env
REDIS_URL=urldoredis
```

---

## ⚙️ Como Usar

### 1. Inicie o bot

```bash
npm start
```

O terminal mostrará um **QR Code**. Escaneie com o WhatsApp do número que deseja conectar.

### 2. Configure os templates

Os templates estão numa pasta /templates/, configurados em arquivos .md, arquivos referenciados deverão estar dentro da pasta templates/images

```
/templates/example.md
```

Exemplo:

```md
---
title: Servico
images: ["servicos.jpg"]
active: true
---
*✅ Desenvolvedor on*

*Esse é um exemplo*
```

---

## 🧠 Cron Syntax (Agendamentos)

Utiliza [cron pattern](https://crontab.guru/) para agendamentos dentro do arquivo em services/baileys.js. Exemplos:

| Cron           | Descrição             |
| -------------- | --------------------- |
| `0 9 * * *`    | Todos os dias às 9h   |
| `0 12 * * 1-5` | Seg a Sex ao meio-dia |
| `30 18 * * 6`  | Sábados às 18h30      |

---

## ⚠️ Avisos

* Este projeto é apenas para **fins educacionais**.
* O uso de bots automatizados pode **violar os termos do WhatsApp**. Use por sua conta e risco.
* Evite spam ou uso indevido para evitar banimentos.

---

## 📄 Licença

Este projeto está sob a [MIT License](LICENSE).

---

## 👨‍💻 Me

Desenvolvido por [pedrohdev](https://github.com/pedrohdev)