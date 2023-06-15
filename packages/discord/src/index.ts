import { ScriptServer } from '@scriptserver/core';
import { useEvent } from '@scriptserver/event';
import { useUtil } from '@scriptserver/util';
import defaultsDeep from 'lodash.defaultsdeep';
import { ChannelType, Client, Events, GatewayIntentBits, TextChannel } from 'discord.js';

export interface DiscordConfig {
  initialized: boolean;
  connected: boolean;

  token: string;
  channelId: string;

  chatToDiscord: boolean;
  chatFromDiscord: boolean;
}

declare module '@scriptserver/core/dist/Config' {
  interface Config {
    discord: DiscordConfig;
  }
}

export const DEFAULT_DISCORD_CONFIG: DiscordConfig = {
  initialized: false,
  connected: false,

  token: '',
  channelId: '',

  chatFromDiscord: true,
  chatToDiscord: true,
};

export function useDiscord(scriptServer: ScriptServer) {
  if (scriptServer.config?.discord?.initialized) {
    return;
  }

  defaultsDeep(scriptServer.config, { discord: DEFAULT_DISCORD_CONFIG });
  scriptServer.config.discord.initialized = true;

  useEvent(scriptServer.javaServer);
  useUtil(scriptServer.rconConnection);

  const config: DiscordConfig = scriptServer.config.discord;

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  });

  client.on(Events.ClientReady, async () => {
    try {
      const c = await client.channels.fetch(config.channelId);
      if (!c || c.type !== ChannelType.GuildText) throw new Error('Invalid channel ID provided');

      config.connected = true;
    } catch (e) {
      console.error(e);
    }
  });

  client.on(Events.MessageCreate, async c => {
    if (c.channelId !== config.channelId || c.author.id === client?.user?.id) return;

    try {
      await scriptServer.rconConnection.util.tellRaw(`<${c.author.username}> ${c.content}`, '@a');
    } catch (e) {
      console.error(e);
    }
  });

  scriptServer.javaServer.on('login', async event => {
    try {
      if (config.connected) {
        (client.channels.cache.get(config.channelId) as TextChannel).send(`${event.player} joined the game`);

        const { online } = await scriptServer.rconConnection.util.getOnline();
        client.user?.setActivity(`: ${online} Online`);
      }
    } catch (e) {
      console.error(e);
    }
  });

  scriptServer.javaServer.on('logout', async event => {
    try {
      if (config.connected) {
        (client.channels.cache.get(config.channelId) as TextChannel).send(`${event.player} left the game`);

        const { online } = await scriptServer.rconConnection.util.getOnline();
        client.user?.setActivity(`: ${online} Online`);
      }
    } catch (e) {
      console.error(e);
    }
  });

  scriptServer.javaServer.on('chat', async event => {
    try {
      if (config.connected && event.message.charAt(0) !== '~') {
        (client.channels.cache.get(config.channelId) as TextChannel).send(`<${event.player}> ${event.message}`);
      }
    } catch (e) {
      console.error(e);
    }
  });

  client.login(config.token);
}
