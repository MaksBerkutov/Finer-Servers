import dotenv from 'dotenv'

dotenv.config()

const config = {
	databaseString: process.env.DATABASE_STRING,
	nameCollection: process.env.NAME_COLLECTION,
	portExpress: process.env.PORT_EXPRESS || 3003,
	discord_token: process.env.DISCORD_TOKEN,
	discord_secret_id: process.env.DISCORD_SECRET_ID,
	discord_client_id: process.env.DISCORD_CLIENT_ID,
	type: process.env.TYPE || 'developer',
	slowed: process.env.SLOWED === 'true',
}

export default config
