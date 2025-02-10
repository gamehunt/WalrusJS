import { Client, Events, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';
import {evaluate} from './engine.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on(Events.ClientReady, readyClient => {
  console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

client.on(Events.MessageCreate, async event => {
    if(event.author.bot) {
        return;
    }

    try {
        const r = evaluate(event.content);
        if(r) {
            await event.reply(r);
        }
    } catch(e) {
        // console.log(e);
    }
});

client.login(process.env.TOKEN);
