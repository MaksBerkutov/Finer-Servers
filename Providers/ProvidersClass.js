export default class MusicObject {
	constructor(url, provider, title, сustomer) {
		this.url = url
		this.provider = provider
		this.title = title
		this.сustomer = сustomer
		this.id = Date.now()
	}
}
