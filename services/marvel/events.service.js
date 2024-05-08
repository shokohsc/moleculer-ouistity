const MarvelAPI = require('marvel-ts').MarvelAPI

const { marvel: { publicKey, privateKey } } = require('../../application.config')

module.exports = {
	name: "MarvelEvents",

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
		getEvent: {
			rest: "GET /events/:id",
			async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
				try {
					const response = await this.marvel.getEvents({
						id: ctx.params.id
					})

			    return {
						event: await this.getEvent(response.data.results[0])
					}
				} catch (e) {
					this.logger.error(e)

					return Promise.reject(e)
				}
			},
			cache: true
		},
		getComics: {
			rest: "GET /events/:id/comics",
			async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
				try {
					const response = await this.marvel.getComics({
						events: ctx.params.id,
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
		searchEvents: {
			rest: "GET /events",
			async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
				try {
					const response = await this.marvel.getEvents({
						nameStartsWith: ctx.params.query,
						orderBy: '-startDate',
						limit: undefined !== ctx.params.limit ? ctx.params.limit : this.searchLimit,
						offset: undefined !== ctx.params.offset ? ctx.params.offset : this.searchOffset
					})

					return {
						events: await this.listEvents(response.data.results),
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

		async listEvents(results) {
			const events = []
			for (const result of results) {
				events.push({ eventId: result.id, title: result.title, thumbnail: result.thumbnail })
			}
			return events
		},

		async getEvent(result) {
			return {
				eventId: result.id,
				title: result.title,
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
