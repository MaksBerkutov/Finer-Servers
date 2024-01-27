import { Client, ConnectionVisibility, GatewayIntentBits } from 'discord.js'
import { createProviderList, getStream } from './provider.js'
import {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
} from '@discordjs/voice'
import { Server } from 'socket.io'


const playlistObject = {
	playlist: [],
	currentPlayed: -1,
	player: undefined,
	connection: undefined,
	chatMusicBot: undefined,
	lastVoiceChannel: undefined,
	isPlay: true,
}

const chanellObject = {
	ServerGUID: undefined,
	AllChats: undefined,
}

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
})

client.on('ready', () => {
	console.log(`Подключён к боту ${client.user.tag}!`)
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return
	if (chanellObject.ServerGUID === undefined)
		chanellObject.ServerGUID = interaction.guild.id
	const commandName = interaction.commandName
	switch (commandName) {
		case 'play':
			await playCommand(interaction, interaction.options)
			break
		case 'skip':
			await skipFunction(interaction, interaction.options)
			break
		case 'leave':
			await leaveFunction(interaction, interaction.options)
			break
		case 'pause':
			await pauseFunction(interaction, interaction.options)
			break
		case 'unpause':
			await unpauseFunction(interaction, interaction.options)
			break
		case 'clearhistorychat':
			await clearAllHistoryChat(interaction, interaction.options)
			break
		default:
			console.log(`Не найден обработчик для комманды  [${commandName}]`)
	}
})

function SendToChat(message) {
	if (playlistObject.chatMusicBot != undefined)
		playlistObject.chatMusicBot.send(message)
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
function pauseMusic() {
	if (playlistObject.player === undefined) return false
	playlistObject.player.pause()
	playlistObject.isPlay = false
	return true
}

function resumeMusic() {
	if (playlistObject.player === undefined) return undefined
	if (playlistObject.isPlay) return false
	else {
		playlistObject.isPlay = true
		playlistObject.player.unpause()

		return true
	}
}

async function pauseFunction(interaction, options) {
	if (pauseMusic()) {
		await interaction.reply('Music paused!')
	} else {
		await interaction.reply('The music is already paused!')
	}
}

async function unpauseFunction(interaction, options) {
	if (resumeMusic()) {
		await interaction.reply('Music resume!')
	} else {
		await interaction.reply('The music is already runing!')
	}
}
async function leaveFunction(interaction, options) {
	if (playlistObject.connection != undefined) {
		playlistObject.connection.disconnect()
		playlistObject.connection = undefined
		interaction.reply('Бай бай )')
	} else {
		interaction.reply('Музыка не включенна')
	}
}
async function skipFunction(interaction, options) {
	await moveNext()
	interaction.reply('Пропущенно')
}

//stopmusic
async function stopMusic() {
	if (playlistObject.connection === undefined) return
	playlistObject.connection.disconnect()
	playlistObject.connection = undefined
	playlistObject.player = undefined
	SendToChat('Музыка закончилась ) ')
	onChangeIndex(-1)
}

function onChangeIndex(id) {
	io.emit('updatePlaylist', {
		action: 'newCurrentPlayed',
		song: id,
	})
}

//music
async function moveNext() {
	playlistObject.currentPlayed++
	if (playlistObject.playlist.length <= playlistObject.currentPlayed) {
		playlistObject.currentPlayed = -1
		stopMusic()
		return false
	}

	playMusic()
	SendToChat(
		`Сейчас играет: ${
			playlistObject.playlist[playlistObject.currentPlayed].url
		}`
	)
	return true
}
async function movePrev() {
	playlistObject.currentPlayed--
	if (playlistObject.currentPlayed < 0) {
		playlistObject.currentPlayed = playlistObject.playlist.length - 1
	}

	playMusic()
	SendToChat(
		`Сейчас играет: ${
			playlistObject.playlist[playlistObject.currentPlayed].url
		}`
	)
	return true
}

async function connectToVoiceChat(arg) {
	try {
		let voiceChannel = null
		if (arg !== undefined) {
			voiceChannel = arg.member.voice.channel
			playlistObject.lastVoiceChannel = voiceChannel
			playlistObject.chatMusicBot = arg.channel
		} else if (playlistObject.lastVoiceChannel !== undefined) {
			voiceChannel = playlistObject.lastVoiceChannel
		} else return

		playlistObject.connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
		})
	} catch (error) {
		throw error
	}
}

function createPlayer() {
	playlistObject.player = createAudioPlayer()

	playlistObject.player.on('idle', () => {
		moveNext()
	})
	playlistObject.player.on('error', error => {
		console.error('Player error:', error)
		playlistObject.connection.disconnect()
	})
}

async function playMusic(interaction) {
	if (playlistObject.connection == undefined) connectToVoiceChat(interaction)
	let stream = getStream(playlistObject.playlist[playlistObject.currentPlayed])

	if (playlistObject.player == null) {
		createPlayer()
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
	onChangeIndex(playlistObject.playlist[playlistObject.currentPlayed].id)
}

function OnAdd(song) {
	io.emit('updatePlaylist', { action: 'add', song })
}

async function playCommand(interaction, options) {
	const link = options.getString('query')

	const voiceChannel = interaction.member.voice.channel

	if (!voiceChannel) {
		await interaction.reply(
			'Вы должны быть в голосовм канале для использование данной комманды.'
		)
		return
	}
	try {
		if (playlistObject.playlist.length == 0) {
			playlistObject.playlist.push(
				...(await createProviderList(link, interaction.user.username))
			)
			playlistObject.currentPlayed = 0
			playMusic(interaction)

			await interaction.reply('Сейчас играет: ' + link)
		} else if (playlistObject.currentPlayed === -1) {
			playlistObject.currentPlayed = 0
			playlistObject.playlist.push(
				...(await createProviderList(link, interaction.user.username))
			)

			playMusic(interaction)
			await interaction.reply(
				'Сейчас играет: ' +
					playlistObject.playlist[playlistObject.currentPlayed].url
			)
		} else {
			playlistObject.playlist.push(
				...(await createProviderList(link, interaction.user.username))
			)
			await interaction.reply(
				`Добавленна новая песня; ${
					playlistObject.playlist[playlistObject.playlist.length - 1].url
				} [${
					playlistObject.playlist[playlistObject.playlist.length - 1].provider
				}]`
			)
		}
		OnAdd(playlistObject.playlist[playlistObject.playlist.length - 1])
	} catch (error) {
		console.error(error)
		await interaction.reply(error.message)
	}
}

client.login(
	'MTE3NDY5OTgzNjI5NDA1Mzk2OA.G3hC1z.k1YXODerS5zC8Q6wQ3tT7F7U-fD36gUKam6-wY'
)

//api Function

const PlaylistController = {
	GetPlalylistObject: () => playlistObject.playlist,
	GetCurrentPlayedSongs: () => playlistObject.currentPlayed,
	GetCountInPlaylist: () => playlistObject.playlist.length,
	PauseMusic: () => pauseMusic(),
	ResumeMusic: () => resumeMusic(),
	MusicIsPlayed: () => playlistObject.isPlay,
	MoveNextSong: () => moveNext(),
	MovePrevSong: () => movePrev(),
	getCurrentStream: () => playlistObject.stream,
	removeById: ({ item }) => {
		const finded = playlistObject.playlist.findIndex(x => x.id === item)
		console.log('finded', finded)

		if (finded !== undefined) {
			if (finded === playlistObject.currentPlayed) {
				playlistObject.playlist.splice(finded, 1)
				moveNext()
			} else {
				playlistObject.playlist.splice(finded, 1)
				playlistObject.currentPlayed--
			}

			return finded
		}
	},
	setPlayItemById: ({ item }) => {
		const finded = playlistObject.playlist.findIndex(x => x.id == item)
		if (finded !== undefined) {
			playlistObject.currentPlayed = finded
			playMusic()
		}
	},
	setPlaylist: playlist => {
		stopMusic()
		playlistObject.playlist = playlist

		if (playlistObject.connection !== undefined) {
			playlistObject.currentPlayed = 0
			playMusic()
		}
	},
}
const BotController = {
	SendToChatById: (id, text) => {
		const channel = client.channels.cache.get(id)
		channel.send(text)
	},

	GetAllChat: () => {
		if (chanellObject.AllChats) return chanellObject.AllChats
		if (chanellObject.ServerGUID === undefined) return null
		console.log(chanellObject.ServerGUID)
		let guild = client.guilds.cache.get(chanellObject.ServerGUID)
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
				/*channelsArray.push({
					name: channel.name,
					type: 'category',
					channels: [],
				})*/
				channelsArray.categorys.set(channel.id, {
					name: channel.name,
					type: 'category',
					channels: [],
				})
				//console.log(channel)

				/*channel.children.forEach(childChannel => {
					channelsArray[channelsArray.length - 1].channels.push({
						name: childChannel.name,
						type:
							childChannel.type === 0
								? 'text'
								: childChannel.type === 1
								? 'voice'
								: 'undefined',
						id: childChannel.id,
					})
				})*/
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

		chanellObject.AllChats = channelsArray
		return channelsArray
	},
}

const port = 3001 // или любой другой порт, который вы используете
const io = new Server(port, {
	cors: {
		origin: '*',
	},
	transports: ['websocket', 'polling'],
})
function updateAllItems() {
	const tmp = PlaylistController.GetPlalylistObject()
	io.emit('updatePlaylist', { action: 'allItems', song: tmp })
}
io.on('connection', socket => {
	//Admin Callback
	socket.on('GetAllChannelFromServer', result => {
		result(BotController.GetAllChat())
	})
	socket.on('sendToChat', ({ id, text }) => {
		BotController.SendToChatById(id, text)
	})

	//Music Page Callback
	updateAllItems()

	socket.on('deltetePlayItem', songId => {
		const deleteId = PlaylistController.removeById(songId)
		if (deleteId != undefined) {
			io.emit('updatePlaylist', { action: 'remove', song: deleteId })
		}
	})

	socket.on('setPlayItem', songId => {
		PlaylistController.setPlayItemById(songId)
	})
	socket.on('getCurrentPlayed', callback => {
		const id = playlistObject.playlist[playlistObject.currentPlayed]
		if (id === undefined) callback(-1)
		else callback(id.id)
	})
	socket.on('getCurrentStatus', callback => {
		callback(PlaylistController.MusicIsPlayed())
	})
	socket.on('goNextSongs', () => {
		PlaylistController.MoveNextSong()
	})
	socket.on('goPrevSongs', () => {
		PlaylistController.MovePrevSong()
	})
	socket.on('importedPlaylist', obj => {
		if (obj != null) {
			PlaylistController.setPlaylist(obj)
			updateAllItems()
		}
	})
	socket.on('getAllInfo', () => {
		updateAllItems()
	})

	socket.on('changeMusicStatus', newStatus => {
		if (newStatus) {
			PlaylistController.ResumeMusic()
		} else {
			PlaylistController.PauseMusic()
		}
		io.emit('updatePlayed', PlaylistController.MusicIsPlayed())
	})

	socket.on('disconnect', () => {})
})
