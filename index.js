// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const dotenv = require('dotenv');
const path = require('path');
const restify = require('restify');

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter } = require('botbuilder');

// This bot's main dialog.
const { MyBot } = require('./bot');

// Import required bot configuration. (Включает использование переменных окружения)
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });
// Create HTTP server (что рестифи, что экспресс)
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nTo talk to your bot, open the emulator select "Open Bot"`);
});

// Create adapter. (типа логина ???)
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Catch-all for errors. (кэчер он и есть кэчер. Ловит ошибки главного хендлера)
adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError]: ${ error }`);
    await context.sendActivity(`Ой, что-то пошло не так!\n\nПопробойту повторить запрос :/`);
};

// Create the main dialog.
const myBot = new MyBot();

// Listen for incoming requests.
//Не очень понятно, что такое context (теперь понятно - это контекст TurnHandlerа - рулевого хендлера. Тип общение с пользователем)
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
        await myBot.run(context);
    });
});
