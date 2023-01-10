const MarvelAPI = require('marvel-ts').MarvelAPI
const moment = require('moment')

const { marvel: { publicKey, privateKey } } = require('../../application.config')

module.exports = {
	name: "MarvelComics",

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
		getComic: {
			rest: "GET /comics/:id",
			async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
				try {
					const response = await this.marvel.getComics({
						id: ctx.params.id
					})

			    return {
						comic: await this.getComic(response.data.results[0])
					}
				} catch (e) {
					this.logger.error(e)

					return Promise.reject(e)
				}
			},
			cache: true
		},
		getComicsWeek: {
			rest: "GET /comics/week",
			async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
				try {
					const endDate = moment(undefined !== ctx.params.date ? ctx.params.date : Date.now().toString())
					const startDate = moment(ctx.params.date).subtract(6, 'days')

					const response = await this.marvel.getComics({
						dateRange: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')],
						noVariants: true,
						format: 'comic',
						formatType: 'comic',
						orderBy: 'title',
						limit: 100
					})

					return {
						date: ctx.params.date,
						comics: await this.listComics(response.data.results),
						total: response.data.total
					}
				} catch (e) {
					this.logger.error(e)

					return Promise.reject(e)
				}
			},
			params: {
				date: { type: 'string', optional: true, default: Date.now().toString() }
			},
			cache: {
				enabled: ctx => 'no-cache' !== ctx.meta.cacheControl,
				ttl: this.ttl
			}
		},
		searchComics: {
			rest: "GET /comics",
			async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
				try {
					const response = await this.marvel.getComics({
						titleStartsWith: ctx.params.query,
						noVariants: true,
						format: 'comic',
						formatType: 'comic',
						orderBy: '-onsaleDate',
						limit: undefined !== ctx.params.limit ? ctx.params.limit : this.searchLimit,
						offset: undefined !== ctx.params.offset ? ctx.params.offset : this.searchOffset
					})

					return {
						comics: await this.listComics(response.data.results),
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

		async getComic(result) {
			return {
				comicId: result.id,
				title: result.title,
				thumbnail: result.thumbnail,
				urls: result.urls,
				dates: result.dates,
				series: result.series,
				events: result.events,
				creators: result.creators,
				characters: result.characters,
				stories: result.stories,
				description: result.description,
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
