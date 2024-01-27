import request from 'request'
//import filesystem from 'fs'
import ffmpeg from 'fluent-ffmpeg'
import { Readable } from 'stream'
import got from 'got'
import util from 'util'
const user_agent = 'Mozilla/5.0'
const client_id = '3lrgRJqrM65nUmQzObbOjJTczVQZcnsk'
const headers = { 'User-Agent': user_agent }
const requestPromise = util.promisify(request)

async function downloadAndMerge(urls) {
	const downloadPromises = urls.map(async url => {
		const response = await got.stream(url)
		return new Promise(resolve => {
			const chunks = []
			response.on('data', chunk => chunks.push(chunk))
			response.on('end', () => resolve(Buffer.concat(chunks)))
		})
	})

	const buffers = await Promise.all(downloadPromises)

	const mergedBuffer = Buffer.concat(buffers)

	const mergedStream = new Readable({
		read(size) {},
	})

	mergedStream.push(mergedBuffer)
	mergedStream.push(null)

	return mergedStream
}
async function track_url(body) {
	try {
		let json = JSON.parse(body)
		let playlist_url = json.url
		const response = await requestPromise({
			url: playlist_url,
			headers: headers,
		})
		return response.body
	} catch (error) {
		console.error(error)
		throw error
	}
}
async function getUrl(body) {
	try {
		let pattern =
			/"https:\/\/api\-v2\.soundcloud\.com\/media\/soundcloud:tracks:(\d+)\/([0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12})\/stream\/hls"/
		let matches = body.match(pattern)

		let track_id = Number(matches[1])
		let uuid = matches[2]

		//
		let track_url =
			'https://api-v2.soundcloud.com/media/soundcloud:tracks:' +
			track_id +
			'/' +
			uuid +
			'/stream/hls?client_id=' +
			client_id
		const response = await requestPromise({ url: track_url, headers: headers })
		return response.body
	} catch (error) {
		console.error(error)
		throw error
	}
}
async function main(url, headers) {
	try {
		const response = await requestPromise({ url, headers })
		return response.body
	} catch (error) {
		console.error(error)
		throw error
	}
}
async function GetAllMusicFromSoundCloud(url, provider) {}
async function getSoundCloudTitile(url) {
	const arr = url.split('/')
	return arr[arr.length - 1].replaceAll('-', ' ')
}

function isSoundCloudPlaylist(url) {
	return /\/sets\//.test(url)
}
async function GetStreamSoundCloud(url) {
	const resultMain = await main(url, headers)
	const resultUrl = await getUrl(resultMain)
	const resultTarsckUrl = await track_url(resultUrl)
	/*downloadAndMerge(
		resultTarsckUrl.split('\n').filter(x => x.startsWith('https'))
	)
		.then(mergedStream => {
			mergedStream.pipe(filesystem.createWriteStream('test.mp3'))
		})
		.catch(err => {
			console.error('Error:', err)
		})*/
	return await downloadAndMerge(
		resultTarsckUrl.split('\n').filter(x => x.startsWith('https'))
	)
}
export {
	GetStreamSoundCloud,
	isSoundCloudPlaylist,
	GetAllMusicFromSoundCloud,
	getSoundCloudTitile,
}
