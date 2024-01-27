class PlaylistObjectController {
	items
	constructor() {
		this.items = new Map()
	}
	add(id) {
		if (!this.items.has(id)) {
			this.items.set(id, {
				player: undefined,
				connection: undefined,
				isPlay: true,
			})
		}
		return this.items.get(id)
	}
	change(id, newItem) {
		if (id === undefined) return id
		if (this.items.has(id)) {
			this.items.set(id, newItem)
		} else {
			this.add(id)
			this.items.set(id, newItem)
		}
	}
	getById(id) {
		
		if (id === undefined) return id
		if (this.items.has(id)) {
			return this.items.get(id)
		} else return this.add(id)
	}
}

export default PlaylistObjectController
