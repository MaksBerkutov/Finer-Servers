import { MongoClient } from 'mongodb'

// URL подключения к MongoDB
//const url = 'mongodb://localhost:27017'

// Имя базы данных//
//const dbName = 'DiscordBot'
class DatabaseController {
	#dbName
	#url
	constructor(dbName, url) {
		this.#dbName = dbName
		this.#url = url

		this.#inilize()
		console.log(`Успешно подключился к серверу ${url} к БД ${dbName}`)
	}
	async #handler(func) {
		const client = new MongoClient(this.#url, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
		try {
			await client.connect()

			const db = client.db(this.#dbName)
			return await func(db)
		} catch (error) {
			console.error(error)
		} finally {
			await client.close()
		}
	}
	async #getServersColletction(db) {
		return db.collection('servers')
	}
	async #getServersInfoColletction(db) {
		return db.collection('serverInfo')
	}
	async #inilize() {
		await this.#handler(async db => {
			const serversCollections = await db
				.listCollections({ name: 'servers' })
				.toArray()
			if (serversCollections.length === 0) {
				await db.createCollection('servers')
				console.log('Коллекция "servers" создана успешно')
			} else {
				console.log('Коллекция "servers" уже существует')
			}

			const serverInfoCollections = await db
				.listCollections({ name: 'serverInfo' })
				.toArray()
			if (serverInfoCollections.length === 0) {
				await db.createCollection('serverInfo')
				console.log('Коллекция "serverInfo" создана успешно')
			} else {
				console.log('Коллекция "serverInfo" уже существует')
			}
		})
	}

	async #FindElement(Collection, id) {
		const existingServer = await Collection.findOne({ _id: id })
		return existingServer
	}

	async #CreateServer(id, name, db) {
		const serversCollection = await this.#getServersColletction(db)

		const server = await this.#FindElement(serversCollection, id)

		if (server) {
			console.error('Сервер с таким _id уже существует:', id, ' ', name)
		} else {
			// Элемент с указанным _id не существует, вставляем новый документ
			console.log('Сервер успешно добавлен сервер:', {
				_id: id,
				serverName: name,
			})
			return await serversCollection.insertOne({
				_id: id,
				serverName: name,
			})
		}
		return null
	}

	async #CreateInfo(id, db) {
		const serversInfoCollection = await this.#getServersInfoColletction(db)
		const info = await this.#FindElement(serversInfoCollection, id)
		if (info) {
			console.error('Информация с таким _id уже существует:', id)
		} else {
			// Элемент с указанным _id не существует, вставляем новый документ
			console.log('Сервер успешно добавлена информация к:', { _id: id })
			return await serversInfoCollection.insertOne({
				_id: id,
				playlist: [],
				currentPlayed: -1,
				chatMusicBot: -1,
				lastVoiceChannel: -1,
			})
		}
		return null
	}
	async СreateServers(id, name) {
		return await this.#handler(async db => {
			const createdServer = await this.#CreateServer(id, name, db)
			const createdinfo = await this.#CreateInfo(id, db)
			return { createdServer: createdServer, createdinfo: createdinfo }
		})
	}
	//get info
	async GetServerNameById(id) {
		return await this.#handler(async db => {
			const serversCollection = await this.#getServersColletction(db)
			return serversCollection.name
		})
	}

	async GetServerInfoObjectById(id) {
		return await this.#handler(async db => {
			const serversInfoCollection = await this.#getServersInfoColletction(db)
			const findedItem = await this.#FindElement(serversInfoCollection, id)
			if (findedItem) {
				return findedItem
			}
		})
	}

	//update/get info function
	async getChatMusicBot(id) {
		return await this.#handler(async db => {
			const serversInfoCollection = await this.#getServersInfoColletction(db)
			const findedItem = await this.#FindElement(serversInfoCollection, id)
			if (findedItem) {
				return findedItem.chatMusicBot
			}
		})
	}
	async setChatMusicBot(newChatMusicBot, id) {
		return await this.#handler(async db => {
			const serversInfoCollection = await this.#getServersInfoColletction(db)
			const filter = { _id: id }

			// Оператор обновления, указывающий новое значение поля
			const update = { $set: { chatMusicBot: newChatMusicBot } }
			const result = await serversInfoCollection.updateOne(filter, update)
			console.log(
				'[newChatMusicBot]Обновлено документов:',
				result.modifiedCount
			)
		})
	}

	async getlastVoiceChannel(id) {
		return await this.#handler(async db => {
			const serversInfoCollection = await this.#getServersInfoColletction(db)
			const findedItem = await this.#FindElement(serversInfoCollection, id)
			if (findedItem) {
				return findedItem.lastVoiceChannel
			}
		})
	}
	async setlastVoiceChannel(newlastVoiceChannel, id) {
		return await this.#handler(async db => {
			const serversInfoCollection = await this.#getServersInfoColletction(db)
			const filter = { _id: id }

			// Оператор обновления, указывающий новое значение поля
			const update = { $set: { lastVoiceChannel: newlastVoiceChannel } }
			const result = await serversInfoCollection.updateOne(filter, update)
			console.log(
				'[newlastVoiceChannel]Обновлено документов:',
				result.modifiedCount
			)
		})
	}

	async getCurrentPlayed(id) {
		return await this.#handler(async db => {
			const serversInfoCollection = await this.#getServersInfoColletction(db)
			const findedItem = await this.#FindElement(serversInfoCollection, id)

			if (findedItem) {
				return findedItem.currentPlayed
			}
		})
	}
	async setCurrentPlayed(newcurrentPlayed, id) {
		return await this.#handler(async db => {
			const serversInfoCollection = await this.#getServersInfoColletction(db)
			const filter = { _id: id }

			// Оператор обновления, указывающий новое значение поля
			const update = { $set: { currentPlayed: newcurrentPlayed } }
			const result = await serversInfoCollection.updateOne(filter, update)
			console.log(
				'[newChatMusicBot]Обновлено документов:',
				result.modifiedCount
			)
			return newcurrentPlayed
		})
	}

	async getCurrentPlayedElemet(id) {
		return await this.#handler(async db => {
			const serversInfoCollection = await this.#getServersInfoColletction(db)
			const findedItem = await this.#FindElement(serversInfoCollection, id)

			if (!findedItem) return

			if (
				findedItem.playlist.length > findedItem.currentPlayed &&
				findedItem.currentPlayed != -1
			) {
				return findedItem.playlist[findedItem.currentPlayed]
			}
		})
	}
	async pushMusciToPlaylist(newElement, id) {
		return await this.#handler(async db => {
			const serversInfoCollection = await this.#getServersInfoColletction(db)
			const result = await serversInfoCollection.updateOne(
				{ _id: id },
				{ $push: { playlist: newElement } }
			)

			console.log('Результат обновления:', result.modifiedCount)
			return newElement
		})
	}
	async removeByIdPlaylist(idMusic, id) {
		return await this.#handler(async db => {
			const serversInfoCollection = await this.#getServersInfoColletction(db)
			const result = await serversInfoCollection.updateOne(
				{ _id: id },
				{ $pull: { playlist: { id: idMusic } } }
			)
			console.log('Результат обновления:', result)
		})
	}
	async getPlalyst(id) {
		return await this.#handler(async db => {
			const serversInfoCollection = await this.#getServersInfoColletction(db)
			const findedItem = await this.#FindElement(serversInfoCollection, id)
			if (findedItem) {
				return findedItem.playlist
			}
		})
	}
	async clearAll() {
		await this.#handler(async db => {
			const collection = db.collection('servers')
			const collection2 = db.collection('serverInfo')

			// Удаление всех документов из коллекции
			const result1 = await collection.deleteMany({})
			console.log(
				`Удалено ${result1.deletedCount} документов из коллекции 'servers'`
			)

			const result2 = await collection2.deleteMany({})
			console.log(
				`Удалено ${result2.deletedCount} документов из коллекции 'serverInfo'`
			)
		})
	}
}

export default DatabaseController
