/*import axios from 'axios'
import fetch from 'node-fetch'

function isYouTubePlaylist(url) {
	return /\/playlist\?|\/list=/.test(url)
}
async function GetAllMusicFromYouTube(url, provider) {}

async function getYoutubeTitle(url) {
	try {
		const info = await yt(url)
		const { data } = await axios(
			`https://www.y2mate.com/mates/convertV2/index`,
			{
				method: 'post',
				data: {
					vid: info.vid,
					k: info.links.mp3.mp3128.k,
				},
				headers: {
					'content-type': 'application/x-www-form-urlencoded',
					'user-agent': 'WhatsApp/2.5.3',
				},
			}
		)

		return data.title
	} catch {
		const result = {
			status: false,
			message: "Can't get metadata",
		}
		console.log(result)
		return undefined
	}
}
async function getStreamYouTube(url) {
	try {
		const info = await yt(url)
		const { data } = await axios(
			`https://www.y2mate.com/mates/convertV2/index`,
			{
				method: 'post',
				data: {
					vid: info.vid,
					k: info.links.mp3.mp3128.k,
				},
				headers: {
					'content-type': 'application/x-www-form-urlencoded',
					'user-agent': 'WhatsApp/2.5.3',
				},
			}
		)

		return data.dlink
	} catch {
		return undefined
	}
}
export {
	isYouTubePlaylist,
	GetAllMusicFromYouTube,
	getYoutubeTitle,
	getStreamYouTube,
}*/

import ytdl from '../ytcore/index.cjs'
function isYouTubePlaylist(url) {
	return /\/playlist\?|\/list=/.test(url)
}
async function GetAllMusicFromYouTube(url, provider) {}

async function getYoutubeTitle(url) {
	try {
		const info = await ytdl.getInfo(url)
		const title = info.videoDetails.title
		return title
	} catch (error) {
		console.error(error)
		return 'Не удалось найти название песни =)'
	}
}

function getStreamYouTube(url) {
	if (!ytdl.validateURL(url)) {
		return 'Invalid YouTube link.'
	}

	return ytdl(url, {
		filter: 'audioonly',
		quality: 'highestaudio',
	})
}
export {
	isYouTubePlaylist,
	GetAllMusicFromYouTube,
	getYoutubeTitle,
	getStreamYouTube,
}
