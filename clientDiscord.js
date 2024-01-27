import {
	Client,
	ConnectionVisibility,
	GatewayIntentBits,
	VoiceChannel,
} from 'discord.js'

import { createProviderList, getStream } from './Providers/provider.js'
import {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
} from '@discordjs/voice'
import { Server } from 'socket.io'
import DatabaseController from './controller/database/DataBaseController.js'
import PlaylistObjectController from './controller/PlaylistObject/PlaylistObjectController.js'
import AuntificationController from './controller/AuntifictionUserController.js'
import MusicEventController from './controller//SocketEventController/MusicEvenetController.js'
import express from 'express'
import cors from 'cors'

import http from 'http'
//import config from './config/config.dev.js'
import config from './config/config.prod.js'

const clientID = config.discord_client_id
const clientSecert = config.discord_secret_id
const mainDatabaseController = new DatabaseController(
	config.nameCollection,
	config.databaseString
)
const mainPlaylistObjectController = new PlaylistObjectController()

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
})
client.on('guildCreate', guild => {
	console.log(`Бот добавлен на сервер: ${guild.name} (ID: ${guild.id})`)
	mainDatabaseController.СreateServers(guild.id, guild.name)
})
client.on('ready', () => {
	console.log(`Подключён к боту ${client.user.tag}!`)
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return
	mainDatabaseController.СreateServers(
		interaction.guild.id,
		interaction.guild.name
	)
	const id = interaction.guild.id
	mainPlaylistObjectController.add(id)
	const commandName = interaction.commandName
	if (config.type === 'developer')
		switch (commandName) {
			case 'devplay':
				await playCommand(interaction, interaction.options, id)
				break
			case 'devskip':
				await skipFunction(interaction, interaction.options, id)
				break
			case 'devleave':
				await leaveFunction(interaction, interaction.options, id)
				break
			case 'devpause':
				await pauseFunction(interaction, interaction.options, id)
				break
			case 'devunpause':
				await unpauseFunction(interaction, interaction.options, id)
				break
			case 'devclearhistorychat':
				await clearAllHistoryChat(interaction, interaction.options)
				break
			default:
				console.log(`Не найден обработчик для комманды  [${commandName}]`)
		}
	else
		switch (commandName) {
			case 'play':
				await playCommand(interaction, interaction.options, id)
				break
			case 'skip':
				await skipFunction(interaction, interaction.options, id)
				break
			case 'leave':
				await leaveFunction(interaction, interaction.options, id)
				break
			case 'pause':
				await pauseFunction(interaction, interaction.options, id)
				break
			case 'unpause':
				await unpauseFunction(interaction, interaction.options, id)
				break
			case 'clearhistorychat':
				await clearAllHistoryChat(interaction, interaction.options)
				break
			default:
				console.log(`Не найден обработчик для комманды  [${commandName}]`)
		}
})
async function SendToChatByChatId(message, chatid) {
	const chat = client.channels.cache.get(chatid)
	if (chat != undefined) chat.send(message)
}
async function SendToChat(message, id) {
	const chatId = await mainDatabaseController.getChatMusicBot(id)

	const chatMusicBot = client.channels.cache.get(chatId)
	if (chatMusicBot != undefined) chatMusicBot.send(message)
}

async function clearAllHistoryChat(interaction, options) {
	if (
		interaction.member.roles.cache.some(role => role.name === 'Администратор')
	) {
		try {
			let allcount = 0
			console.log('Удаленине начато')
			let messages
			do {
				messages = await interaction.channel.messages.fetch({
					limit: 100,
				})
				if (messages.size > 0) {
					allcount += messages.size
					await interaction.channel.bulkDelete(messages)
					console.log(`Успешно удалено ${messages.size} сообщений.`)
				}
			} while (messages.size > 0)
			console.log('All delete ended')
			console.log(`Успешно удалено ${allcount} сообщений.`)
		} catch (error) {
			console.error('Произошла ошибка при удалении сообщений:', error)
		}

		interaction.reply('Команда выполнена!')
	} else {
		interaction.reply('У вас нет прав для выполнения этой команды.')
	}
}
function pauseMusic(id) {
	const playlistObject = mainPlaylistObjectController.getById(id)

	if (playlistObject.player === undefined) return false
	playlistObject.player.pause()
	playlistObject.isPlay = false
	mainPlaylistObjectController.change(id, playlistObject)
	return true
}

function resumeMusic(id) {
	const playlistObject = mainPlaylistObjectController.getById(id)

	if (playlistObject.player === undefined) return undefined
	if (playlistObject.isPlay) return false
	else {
		playlistObject.isPlay = true
		playlistObject.player.unpause()
		mainPlaylistObjectController.change(id, playlistObject)

		return true
	}
}

async function pauseFunction(interaction, options, id) {
	if (pauseMusic(id)) {
		await interaction.reply('Music paused!')
	} else {
		await interaction.reply('The music is already paused!')
	}
}

async function unpauseFunction(interaction, options, id) {
	if (resumeMusic(id)) {
		await interaction.reply('Music resume!')
	} else {
		await interaction.reply('The music is already runing!')
	}
}
async function leaveFunction(interaction, options, id) {
	const playlistObject = mainPlaylistObjectController.getById(id)

	if (playlistObject.connection != undefined) {
		playlistObject.connection.disconnect()
		playlistObject.connection = undefined
		mainPlaylistObjectController.change(id, playlistObject)

		interaction.reply('Бай бай )')
	} else {
		interaction.reply('Музыка не включенна')
	}
}
async function skipFunction(interaction, options, id) {
	interaction.reply('Пропущенно')
	await moveNext(id)
}

//stopmusic
async function stopMusic(id) {
	const playlistObject = mainPlaylistObjectController.getById(id)

	if (playlistObject.connection === undefined) return
	playlistObject.connection.disconnect()
	playlistObject.connection = undefined
	playlistObject.player = undefined
	mainPlaylistObjectController.change(id, playlistObject)

	SendToChat('Музыка закончилась ) ', id)

	onChangeIndex(-1)
}

function onChangeIndex(serverId, id) {
	SendToAllClientByIdServer(serverId, 'newCurrentPlayed', { newId: id })
}

//music
async function moveNext(id) {
	let currentPlayed = await mainDatabaseController.getCurrentPlayed(id)
	const playlist = await mainDatabaseController.getPlalyst(id)
	currentPlayed++
	if (playlist.length <= currentPlayed) {
		currentPlayed = -1
		stopMusic(id)
		mainDatabaseController.setCurrentPlayed(currentPlayed, id)
		return false
	}
	await mainDatabaseController.setCurrentPlayed(currentPlayed, id)
	playMusic(undefined, id)
	SendToChat(`Сейчас играет: ${playlist[currentPlayed].url}`, id)
	return true
}
async function movePrev(id) {
	let currentPlayed = await mainDatabaseController.getCurrentPlayed(id)
	let playlist = await mainDatabaseController.getPlalyst(id)
	currentPlayed--
	if (currentPlayed < 0) {
		currentPlayed = playlist.length - 1
	}
	await mainDatabaseController.setCurrentPlayed(currentPlayed, id)
	playMusic(undefined, id)
	SendToChat(`Сейчас играет: ${playlist[currentPlayed].url}`, id)
	return true
}

async function connectToVoiceChat(voiceChannel, id) {
	try {
		if (voiceChannel === undefined) {
			const latVoiseChatId =
				await mainDatabaseController.getlastVoiceChannel(id)
			if (latVoiseChatId == -1) return
			voiceChannel = client.channels.cache.get(latVoiseChatId)
		}
		const playlistObject = mainPlaylistObjectController.getById(id)

		playlistObject.connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
		})
		mainPlaylistObjectController.change(id, playlistObject)
	} catch (error) {
		console.error(error)
	}
}

function createPlayer(id) {
	const playlistObject = mainPlaylistObjectController.getById(id)

	playlistObject.player = createAudioPlayer()

	playlistObject.player.on('idle', () => {
		moveNext(id)
	})
	playlistObject.player.on('error', error => {
		console.error('Player error:', error)
		playlistObject.connection.disconnect()
	})
	mainPlaylistObjectController.change(id, playlistObject)
}

async function playMusic(VoiceChannel, id, TextChannel) {
	console.log('I HERE')
	const playlistObject = mainPlaylistObjectController.getById(id)
	if (TextChannel !== undefined)
		await mainDatabaseController.setChatMusicBot(TextChannel, id)
	const currentSongs = await mainDatabaseController.getCurrentPlayedElemet(id)
	if (playlistObject.connection == undefined)
		connectToVoiceChat(VoiceChannel, id)

	let stream = await getStream(currentSongs)

	if (playlistObject.player == null) {
		createPlayer(id)
	}

	const resource = createAudioResource(stream, {
		inputType: stream.type,
		metadata: {
			title: 'Now Playing',
			///url: 'https://www.youtube.com/watch?v=your_video_id',
		},
	})

	await playlistObject.player.play(resource, { seek: 1 / 1000 })
	if (playlistObject.connection == undefined) return

	playlistObject.connection.subscribe(playlistObject.player)
	mainPlaylistObjectController.change(id, playlistObject)

	onChangeIndex(id, currentSongs.id)
}

function OnAdd(song, serverId) {
	SendToAllClientByIdServer(serverId, 'add', { song: song })
}

async function playCommand(interaction, options, id) {
	const link = options.getString('query')

	const voiceChannel = interaction.member.voice.channel
	const textChannel = interaction.channel.id
	if (!voiceChannel) {
		await interaction.reply(
			'Вы должны быть в голосовм канале для использование данной комманды.'
		)
		return
	}
	try {
		if (config.slowed) await interaction.reply('Приянто (^_^)/')
	} catch (error) {
		console.log('SLOWED HOST')
	}

	const callback = config.slowed
		? async text => {
				await SendToChatByChatId(text, textChannel)
		  }
		: async text => {
				await interaction.reply(text)
		  }

	mainDatabaseController.setlastVoiceChannel(voiceChannel.id, id)
	try {
		let currentPlayed = await mainDatabaseController.getCurrentPlayed(id)
		const objectPlaylist = mainPlaylistObjectController.getById(id)
		const playlist = await mainDatabaseController.getPlalyst(id)

		let added = {}
		if (
			playlist.length == 0 ||
			currentPlayed === -1 ||
			objectPlaylist.connection === undefined
		) {
			added = await mainDatabaseController.pushMusciToPlaylist(
				await createProviderList(link, interaction.user.username),
				id
			)
			if (objectPlaylist.connection !== undefined || currentPlayed == -1)
				currentPlayed = await mainDatabaseController.setCurrentPlayed(0, id)
			await playMusic(voiceChannel, id, textChannel)

			await callback('Сейчас играет: ' + playlist[currentPlayed].url)
		} else {
			added = await mainDatabaseController.pushMusciToPlaylist(
				await createProviderList(link, interaction.user.username),
				id
			)
			await callback(`Добавленна новая песня; ${added.url} [${added.provider}]`)
		}
		OnAdd(added, id)
	} catch (error) {
		console.error(error)
		await callback(error.message)
	}
}

client.login(config.discord_token)

//api Function

const PlaylistController = {
	GetPlalylistObject: async id => await mainDatabaseController.getPlalyst(id),
	GetCurrentPlayedSongs: async id =>
		await mainDatabaseController.getCurrentPlayed(id),
	GetCountInPlaylist: async () =>
		await mainDatabaseController.getPlalyst(id).length,
	PauseMusic: async id => await pauseMusic(id),
	ResumeMusic: async id => await resumeMusic(id),
	MusicIsPlayed: id => mainPlaylistObjectController.getById(id).isPlay,
	MoveNextSong: async id => await moveNext(id),
	MovePrevSong: async id => await movePrev(id),
	//getCurrentStream: () => playlistObject.stream,
	removeById: async (id, item) => {
		const playlist = await mainDatabaseController.getPlalyst(id)
		const finded = playlist.findIndex(x => x.id === item)
		let currentPlayed = await mainDatabaseController.getCurrentPlayed(id)

		if (finded !== -1) {
			if (finded === currentPlayed) {
				//playlistObject.playlist.splice(finded, 1)
				await mainDatabaseController.removeByIdPlaylist(playlist[finded].id, id)
				currentPlayed--
				await mainDatabaseController.setCurrentPlayed(currentPlayed, id)
				moveNext(id)
			} else {
				//playlistObject.playlist.splice(finded, 1)
				await mainDatabaseController.removeByIdPlaylist(playlist[finded].id, id)
			}

			return finded
		}
	},
	setPlayItemById: async (id, item) => {
		const playlist = await mainDatabaseController.getPlalyst(id)
		const finded = playlist.findIndex(x => x.id == item)

		if (finded !== undefined) {
			await mainDatabaseController.setCurrentPlayed(finded, id)

			playMusic(undefined, id, undefined)
		}
	},
	setPlaylist: ({ id, playlist }) => {
		return
		stopMusic()
		playlistObject.playlist = playlist

		if (playlistObject.connection !== undefined) {
			playlistObject.currentPlayed = 0
			playMusic()
		}
	},
}

const BotController = {
	isBotMember: async serverId => {
		try {
			const guild = await client.guilds.fetch(serverId)
			return guild
		} catch (error) {
			//console.error(error)
			return false
		}
	},

	SendToChatById: (id, text) => {
		const channel = client.channels.cache.get(id)
		channel.send(text)
	},

	GetAllChat: id => {
		//if (chanellObject.AllChats) return chanellObject.AllChats
		//if (chanellObject.ServerGUID === undefined) return null
		let guild = client.guilds.cache.get(id)
		if (!guild) {
			console.error('Guild not found!')
			return
		}
		const channelsArray = {
			categorys: new Map(),
			otherChats: [],
		}
		const tmpObjects = []
		guild.channels.cache.forEach(channel => {
			if (channel.type === 4) {
				channelsArray.categorys.set(channel.id, {
					name: channel.name,
					type: 'category',
					channels: [],
				})
				//console.log(channel)
			} else {
				tmpObjects.push({
					name: channel.name,
					parentId: channel.parentId,
					type:
						channel.type === 0
							? 'text'
							: channel.type === 2
							  ? 'voice'
							  : channel.type === 11
							    ? 'vetka'
							    : 'undefined',
					id: channel.id,
				})
				//if (channelsArray[channelsArray.length - 1].type === 'vetka')console.log(channel)
			}
		})
		tmpObjects.forEach(element => {
			if (element.parentId != null) {
				let object = channelsArray.categorys.get(element.parentId)
				if (object != undefined) {
					object.channels.push({
						name: element.name,
						id: element.id,
						type: element.type,
					})

					channelsArray.categorys.set(element.parentId, object)
				}
			} else channelsArray.otherChats.push(element)
		})
		channelsArray.categorys = JSON.stringify(
			Array.from(channelsArray.categorys)
		)

		//chanellObject.AllChats = channelsArray
		return channelsArray
	},
}

const port = process.env.PORT || config.portExpress
const portSocket = process.env.SOCKET_PORT || config.portSocket
const app = express()

app.use(cors())

//const router = express.Router()
//app.use('/', router)

const server = http.createServer(app)
/*const io = new Server(portSocket, {
	cors: {
		origin: '*',
	},
	transports: ['websocket', 'polling'],
})*/
const io = new Server(server, {
	cors: {
		origin: '*',
	},
	transports: ['websocket', 'polling'],
})
server.listen(port, '0.0.0.0', () => {
	console.log(`server start listening on port ${port}`)
})

app.get('/tst', async (req, res) => {
	res.status(200).send({ text: 'ahahhahahahhahah' })
})

app.get('/api/data', async (req, res) => {
	const authorizationCode = req.query.authorizationCode
	const redirectUrl = req.query.redirectUrl
	const token = await AuntificationController.getToken(
		authorizationCode,
		clientID,
		clientSecert,
		redirectUrl
	)
	let list = await AuntificationController.getUserGuilds(token)

	const user = await AuntificationController.getUserID(token)
	for (let i in list) {
		const element = list[i]
		list[i] = {
			...element,
			botMember: await BotController.isBotMember(element.id),
			admin: element.permissions & 0x0000000000000008 ? true : false,
		}
	}

	res.json({ Servers: list, User: user })
})
const allSocked = new Map()
async function SendToAllClientByIdServer(id, event, args) {
	if (!allSocked.has(id)) {
		io.emit(event, args)
	}
}
io.on('connection', socket => {
	socket.on('connectMe', ({ idServer, idUser }, callback) => {
		const userId = idUser
		const uniqClose = idServer + Date.now()
		if (userId === undefined) {
			socket.disconnect()
			return
		}
		const socketMusicEventController = new MusicEventController(
			socket,
			PlaylistController
		)
		socket.on('disconnect', () => {
			const userSockets = allSocked.get(userId)
			if (userSockets) {
				const isUniqCloseExist = userSockets.some(
					([existingUniqClose]) => existingUniqClose === uniqClose
				)

				if (isUniqCloseExist) {
					const filteredSockets = userSockets.filter(
						([existingUniqClose]) => existingUniqClose !== uniqClose
					)
					allSocked.set(userId, filteredSockets)
				}
			}
		})
		const userSockets = allSocked.get(userId) || []
		const newSocketEntry = [uniqClose, socketMusicEventController]
		allSocked.set(userId, [...userSockets, new Map([newSocketEntry])])

		socket.on('deltetePlayItem', async ({ id, item }) => {
			const deleteId = await PlaylistController.removeById(id, item)
			socket.emit('remove', {
				deleteId: deleteId,
			})
		})

		async function updateAllItems(id) {
			const tmp = await PlaylistController.GetPlalylistObject(id)
			socket.emit('updatePlaylist', { song: tmp })
		}
		socket.on('setPlayItem', async ({ id, item }) => {
			await PlaylistController.setPlayItemById(id, item)
		})
		socket.on('getCurrentPlayed', async ({ id }, callback) => {
			const Findedid = await mainDatabaseController.getCurrentPlayedElemet(id)
			if (
				Findedid === undefined ||
				mainPlaylistObjectController.getById(id).connection === undefined
			)
				callback(-1)
			else callback(Findedid.id)
		})
		socket.on('getCurrentStatus', ({ id }, callback) => {
			callback(PlaylistController.MusicIsPlayed(id))
		})
		socket.on('goNextSongs', async id => {
			await PlaylistController.MoveNextSong(id)
		})
		socket.on('goPrevSongs', async id => {
			await PlaylistController.MovePrevSong(id)
		})
		socket.on('importedPlaylist', async ({ id, obj }) => {
			if (obj != null) {
				await PlaylistController.setPlaylist(id, obj)
				await updateAllItems(id)
			}
		})

		socket.on('getAllInfo', async ({ id }) => {
			await updateAllItems(id)
		})

		socket.on('changeMusicStatus', async ({ id, newStatus }) => {
			if (newStatus) {
				await PlaylistController.ResumeMusic(id)
			} else {
				await PlaylistController.PauseMusic(id)
			}
			socket.emit('updatePlayed', PlaylistController.MusicIsPlayed(id))
		})
		//admin
		socket.on('GetAllChannelFromServer', ({ id }, result) => {
			result(BotController.GetAllChat(id))
		})
		socket.on('sendToChat', ({ id, text }) => {
			BotController.SendToChatById(id, text)
		})

		callback(true)
	})
})
