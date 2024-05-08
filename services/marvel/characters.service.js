const MarvelAPI = require('marvel-ts').MarvelAPI

const { marvel: { publicKey, privateKey } } = require('../../application.config')

module.exports = {
	name: "MarvelCharacters",

	/**
	 * Settings
	 */
	settings: {

	},

	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		getCharacter: {
			rest: "GET /characters/:id",
			async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
				try {
					const response = await this.marvel.getCharacters({
						id: ctx.params.id
					})

			    return {
						character: await this.getCharacter(response.data.results[0])
					}
				} catch (e) {
					this.logger.error(e)

					return Promise.reject(e)
				}
			},
			cache: true
		},
		getComics: {
			rest: "GET /characters/:id/comics",
			async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
				try {
					const response = await this.marvel.getComics({
						characters: ctx.params.id,
						noVariants: true,
						format: 'comic',
						formatType: 'comic',
						orderBy: '-onsaleDate',
						limit: undefined !== ctx.params.limit ? ctx.params.limit : this.searchLimit,
						offset: undefined !== ctx.params.offset ? ctx.params.offset : this.searchOffset
					})

					return {
						id: ctx.params.id,
						comics: await this.listComics(response.data.results),
						total: response.data.total
					}
				} catch (e) {
					this.logger.error(e)

					return Promise.reject(e)
				}
			},
			params: {
				id: { type: 'string', optional: true, default: "" },
				limit: { type: 'number', integer: true, positive: true, optional: true, convert: true },
				offset: { type: 'number', integer: true, optional: true, convert: true }
			},
			cache: {
				enabled: ctx => 'no-cache' !== ctx.meta.cacheControl,
				ttl: this.ttl
			}
		},
		searchCharacters: {
			rest: "GET /characters",
			async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
				try {
					const response = await this.marvel.getCharacters({
						nameStartsWith: ctx.params.query,
						orderBy: 'name',
						limit: undefined !== ctx.params.limit ? ctx.params.limit : this.searchLimit,
						offset: undefined !== ctx.params.offset ? ctx.params.offset : this.searchOffset
					})

					return {
						characters: await this.listCharacters(response.data.results),
						total: response.data.total
					}
				} catch (e) {
					this.logger.error(e)

					return Promise.reject(e)
				}
			},
			params: {
				query: { type: 'string' },
				limit: { type: 'number', integer: true, positive: true, optional: true, convert: true },
				offset: { type: 'number', integer: true, optional: true, convert: true }
			},
			cache: {
				enabled: ctx => 'no-cache' !== ctx.meta.cacheControl,
				ttl: this.ttl
			}

		}
	},

	/**
	 * Events
	 */
	events: {

	},

	/**
	 * Methods
	 */
	methods: {
		async listComics(results) {
			const comics = []
			for (const result of results) {
				comics.push({ comicId: result.id, title: result.title, thumbnail: result.thumbnail })
			}
			return comics
		},

		async listCharacters(results) {
			const characters = []
			for (const result of results) {
				characters.push({ characterId: result.id, name: result.name, thumbnail: result.thumbnail })
			}
			return characters
		},

		async getCharacter(result) {
			return {
				characterId: result.id,
				name: result.name,
				thumbnail: result.thumbnail
			}
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		this.ttl = 30
		this.searchLimit = 10
		this.searchOffset = 0
	},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {
    this.marvel = new MarvelAPI(publicKey, privateKey)
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {
    this.marvel = undefined
	}
};
