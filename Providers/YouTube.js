import ytdl from '@distube/ytdl-core';

function isYouTubePlaylist(url) {
    return /\/playlist\?|\/list=/.test(url);
}

async function GetAllMusicFromYouTube(url, provider) {
    // Implementation goes here if needed
}

async function getYoutubeTitle(url) {
    try {
        const info = await ytdl.getInfo(url);
        return info.videoDetails.title || 'No title available';
    } catch (error) {
        console.error(error);
        return 'Unable to retrieve song title.';
    }
}

async function getStreamYouTube(url) {
    if (!ytdl.validateURL(url)) {
        throw new Error('Invalid YouTube link.');
    }
    
    return ytdl(url, {
        filter: 'audioonly',
        quality: 'highestaudio',
		requestOptions: {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36'
            }
        }
    });
}

export {
    isYouTubePlaylist,
    GetAllMusicFromYouTube,
    getYoutubeTitle,
    getStreamYouTube,
};
