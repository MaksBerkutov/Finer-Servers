import axios from 'axios'
import fetch from 'node-fetch'

async function getTitleSpotify(url) {
	if (!isUrl(url)) throw new Error('Please input Url')
	if (url.includes('spotify.link')) {
		const originalUrl = await getOriginalUrl(url)
		const track = await axios.get(
			`https://api.spotifydown.com/metadata/track/${
				originalUrl.split('track/')[1].split('?')[0]
			}`,
			options
		)
		const { data } = await axios.get(
			`https://api.spotifydown.com/download/${track.data.id}`,
			options
		)
		return `${data.metadata.artists} ${data.metadata.title}`
	} else if (url.includes('open.spotify.com')) {
		const { data } = await axios.get(
			`https://api.spotifydown.com/download/${
				url.split('track/')[1].split('?')[0]
			}`,
			options
		)

		return `${data.metadata.artists} ${data.metadata.title}`
	} else {
		return undefined
	}
}
const options = {
	headers: {
		Origin: 'https://spotifydown.com',
		Referer: 'https://spotifydown.com/',
	},
}
function isUrl(url) {
	return url.match(
		new RegExp(
			/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi
		)
	)
}
async function getOriginalUrl(url) {
	const data = await fetch(url)
	return data.url
}

async function getStreamSpotify(url) {
	if (!isUrl(url)) throw new Error('Please input Url')
	if (url.includes('spotify.link')) {
		const originalUrl = await getOriginalUrl(url)
		const track = await axios.get(
			`https://api.spotifydown.com/metadata/track/${
				originalUrl.split('track/')[1].split('?')[0]
			}`,
			options
		)
		const { data } = await axios.get(
			`https://api.spotifydown.com/download/${track.data.id}`,
			options
		)
		const audioUrl = await fetch(data.link)
		return audioUrl.body
	} else if (url.includes('open.spotify.com')) {
		const { data } = await axios.get(
			`https://api.spotifydown.com/download/${
				url.split('track/')[1].split('?')[0]
			}`,
			options
		)
		const audioUrl = await fetch(data.link)

		return audioUrl.body
	} else {
		return undefined
	}
}
function isSpotifyPlaylist(url) {
	return /\/playlist\//.test(url)
}
async function GetAllMusicFromSpotify(url, provider) {}
export {
	getStreamSpotify,
	isSpotifyPlaylist,
	GetAllMusicFromSpotify,
	getTitleSpotify,
}

/*import {
	//search,
	downloadTrack,
	//downloadAlbum,
} from '@nechlophomeriaa/spotifydl'
import { Readable } from 'stream'

//import fs from 'fs'
class AudioBufferStream extends Readable {
	constructor(buffer, options) {
		super(options)
		this.buffer = buffer
		this.position = 0
	}

	_read(size) {
		if (this.position >= this.buffer.length) {
			this.push(null) // Данные закончились
		} else {
			const chunk = this.buffer.slice(this.position, this.position + size)
			this.position += chunk.length
			this.push(chunk)
		}
	}
}
async function getTitleSpotify(url) {
	const res = await downloadTrack(url)
	return `${res.artists} ${res.title}`
}
async function getStreamSpotify1(url) {
	const downTrack = await downloadTrack(url)
	const audioStream = new AudioBufferStream(downTrack.audioBuffer)
	return audioStream
	//const fileStream = fs.createWriteStream('output.mp3')

	//// Перенаправление данных из audioStream в файловый поток
	//audioStream.pipe(fileStream)

	//// Обработка события завершения записи
	//fileStream.on('finish', () => {
	//	console.log('Запись в файл завершена.')
	//})

	// Обработка ошибок записи
	//fileStream.on('error', err => {
	//	console.error('Ошибка при записи в файл:', err)
	//})
	//console.log(downTrack)
}
*/
