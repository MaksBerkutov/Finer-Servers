import { REST, Routes } from 'discord.js'
import config from './config/config.js'

const commands = [
	{
		name: config.type === 'developer' ? 'devplay' : 'play',
		description: 'Play a YouTube video in a voice channel',
		options: [
			{
				name: 'query',
				description: 'YouTube video link',
				type: 3,
				required: true,
			},
		],
	},
	{
		name: config.type === 'developer' ? 'devskip' : 'skip',
		description: 'Skip music',
	},
	{
		name: config.type === 'developer' ? 'devleave' : 'leave',
		description: 'leave channel',
	},
	{
		name: config.type === 'developer' ? 'devclearquen' : 'clearquen',
		description: 'clear currency quen channel',
	},
	{
		name:
			config.type === 'developer' ? 'devclearhistorychat' : 'clearhistorychat',

		description: 'clear all history chat',
	},
	{
		name: config.type === 'developer' ? 'devpause' : 'pause',

		description: 'pause track',
	},
	{
		name: config.type === 'developer' ? 'devunpause' : 'unpause',
		description: 'un pause track',
	},
]

const rest = new REST({ version: '10' }).setToken(config.discord_token)

try {
	console.log('started refreshing application (/) commnads.')
	await rest.put(Routes.applicationCommands(config.discord_client_id), {
		body: commands,
	})
	console.log('Successfully reloaded application (/) commands.')
} catch (error) {
	console.error(error)
}
