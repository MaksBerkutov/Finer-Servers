import axios from 'axios'

class AuntificationController {
	static async getToken(code, clientId, clientSecret, redirectUri) {
		try {
			const API_ENDPOINT = 'https://discord.com/api/v10'
			const response = await axios.post(
				`${API_ENDPOINT}/oauth2/token`,
				`grant_type=authorization_code&code=${code}&redirect_uri=${redirectUri}`,
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					auth: {
						username: clientId,
						password: clientSecret,
					},
				}
			)

			console.log('Успешный ответ getToken:', response.data)
			return response.data.access_token
		} catch (error) {
			console.error('Ошибка при запросе getToken:', error.message)
		}
	}
	static async getUserID(accessToken) {
		try {
			const discordApiUrl = 'https://discord.com/api/v10/users/@me'

			// Опции запроса, включая заголовок авторизации
			const requestOptions = {
				method: 'GET',
				url: discordApiUrl,
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}

			// Отправляем запрос к Discord API
			const response = await axios(requestOptions)
			console.log('Успешный ответ getUserID')
			return response.data
		} catch (error) {
			console.error('Ошибка при запросе getUserID :', error.message)
		}
	}
	static async getUserGuilds(accessToken) {
		try {
			const response = await axios.get(
				'https://discord.com/api/v10/users/@me/guilds',
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				}
			)
			console.log('Успешный ответ getUserGuilds')
			return response.data
		} catch (error) {
			console.error('Ошибка при запросе getUserGuilds :', error.message)
		}
	}
	static async getMoreinfoAboutServer(serverId, accessToken) {
		try {
			const response = await axios.get(
				`https://discord.com/api/v10/users/@me/guilds/${serverId}/member`,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				}
			)
			console.log('Успешный ответ getMoreinfoAboutServer')
			return response.data
		} catch (error) {
			console.error('Ошибка при запросе getMoreinfoAboutServer:', error.message)
		}
	}
}

export default AuntificationController
