import ytdl from './ytcore/index.cjs'

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

console.log(
	await getYoutubeTitle(
		'https://www.youtube.com/watch?v=oso__gk3YoE&list=RDWoPeREBePJo&index=4'
	)
)
