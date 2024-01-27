import {
	isYouTubePlaylist,
	GetAllMusicFromYouTube,
	getYoutubeTitle,
	getStreamYouTube,
} from './YouTube.js'
import {
	GetStreamSoundCloud,
	isSoundCloudPlaylist,
	GetAllMusicFromSoundCloud,
	getSoundCloudTitile,
} from './SoundCloud.js'
import {
	getStreamSpotify,
	isSpotifyPlaylist,
	GetAllMusicFromSpotify,
	getTitleSpotify,
} from './Spotify.js'
import MusicObject from './ProvidersClass.js'

function createProviderList(url, customer) {
	if (/youtube\.com\/watch\?v=/.test(url) || /youtu\.be\//.test(url)) {
		return CreateCustomProvider(
			url,
			'YouTube',
			isYouTubePlaylist,
			GetAllMusicFromYouTube,
			getYoutubeTitle,
			customer
		)
		//return undefined
	} else if (/spotify\.com\/track\//.test(url)) {
		return CreateCustomProvider(
			url,
			'Spotify',
			isSpotifyPlaylist,
			GetAllMusicFromSpotify,
			getTitleSpotify,
			customer
		)
	} else if (/soundcloud\.com\//.test(url)) {
		return CreateCustomProvider(
			url,
			'SoundCloud',
			isSoundCloudPlaylist,
			GetAllMusicFromSoundCloud,
			getSoundCloudTitile,
			customer
		)
	}
}

async function CreateCustomProvider(
	url,
	nameProvider,
	checkFunction,
	playlistFunction,
	getTitileFunction,
	customer
) {
	if (checkFunction(url)) {
		return playlistFunction(url, nameProvider)
	}
	return new MusicObject(
		url,
		nameProvider,
		await getTitileFunction(url),
		customer
	)
}

async function getStream(providerObject) {
	if (providerObject === undefined) return
	const map = {}
	map['YouTube'] = getStreamYouTube
	map['SoundCloud'] = GetStreamSoundCloud
	map['Spotify'] = getStreamSpotify
	return await map[providerObject.provider](providerObject.url)
}

export { createProviderList, getStream }
