class MusicEventController {
	#socket
	#PlaylistController
	constructor(socket, PlaylistController) {
		this.#socket = socket
		this.#PlaylistController = PlaylistController
	}
	async #updateAllItems() {
		const tmp = await this.#PlaylistController.GetPlalylistObject()
		this.#socket.emit('updatePlaylist', { action: 'allItems', song: tmp })
	}
	async inilize() {
		await this.#updateAllItems()

		this.#socket.on('deltetePlayItem', async ({ id, songId }) => {
			const deleteId = await this.#PlaylistController.removeById(id, songId)
			if (deleteId != undefined) {
				this.#socket.emit('updatePlaylist', {
					action: 'remove',
					song: deleteId,
				})
			}
		})

		this.#socket.on('setPlayItem', async ({ id, songId }) => {
			await this.#PlaylistController.setPlayItemById(id, songId)
		})
		//Edit THIS
		this.#socket.on('getCurrentPlayed', async ({ id, callback }) => {
			//const id = playlistObject.playlist[playlistObject.currentPlayed]
			const Findedid = await this.#PlaylistController.GetCurrentPlayedSongs(id)
			if (Findedid === undefined) callback(-1)
			else callback(Findedid)
		})
		this.#socket.on('getCurrentStatus', ({ id, callback }) => {
			callback(this.#PlaylistController.MusicIsPlayed(id))
		})
		this.#socket.on('goNextSongs', async id => {
			await this.#PlaylistController.MoveNextSong(id)
		})
		this.#socket.on('goPrevSongs', async id => {
			await this.#PlaylistController.MovePrevSong(id)
		})
		this.#socket.on('importedPlaylist', async ({ id, obj }) => {
			if (obj != null) {
				await this.#PlaylistController.setPlaylist(id, obj)
				await this.#updateAllItems()
			}
		})
		this.#socket.on('getAllInfo', async id => {
			console.log('============+>>>>>>>>>>>> getAllInfo')
			await this.#updateAllItems()
		})

		this.#socket.on('changeMusicStatus', async ({ id, newStatus }) => {
			if (newStatus) {
				await this.#PlaylistController.ResumeMusic(id)
			} else {
				await this.#PlaylistController.PauseMusic(id)
			}
			this.#socket.emit('updatePlayed', PlaylistController.MusicIsPlayed())
		})
	}
}

export default MusicEventController
