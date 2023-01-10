const MarvelAPI = require('marvel-ts').MarvelAPI
const moment = require('moment')

const { marvel: { publicKey, privateKey } } = require('../../application.config')

module.exports = {
	name: "MarvelSeries",

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
		getSerie: {
			rest: "GET /series/:id",
			async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
				try {
					const response = await this.marvel.getSeries({
						id: ctx.params.id
					})

			    return {
						serie: await this.getSerie(response.data.results[0])
					}
				} catch (e) {
					this.logger.error(e)

					return Promise.reject(e)
				}
			},
			cache: true
		},
		getComics: {
			rest: "GET /series/:id/comics",
			async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
				try {
					const response = await this.marvel.getComics({
						series: ctx.params.id,
						noVariants: true,
						format: 'comic',
						formatType: 'comic',
						orderBy: '-issueNumber',
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
		searchSeries: {
			rest: "GET /series",
			async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
				try {
					const response = await this.marvel.getSeries({
						titleStartsWith: ctx.params.query,
						orderBy: '-startYear',
						contains: 'comic',
						limit: undefined !== ctx.params.limit ? ctx.params.limit : this.searchLimit,
						offset: undefined !== ctx.params.offset ? ctx.params.offset : this.searchOffset
					})

					return {
						series: await this.listSeries(response.data.results),
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
	 * Series
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

		async listSeries(results) {
			const series = []
			for (const result of results) {
				series.push({ serieId: result.id, title: result.title, thumbnail: result.thumbnail })
			}
			return series
		},

		async getSerie(result) {
			return {
				serieId: result.id,
				title: result.title,
				thumbnail: result.thumbnail
			}
		}
	},

	/**
	 * Service created lifecycle serie handler
	 */
	created() {
		this.ttl = 30
		this.searchLimit = 10
		this.searchOffset = 0
	},

	/**
	 * Service started lifecycle serie handler
	 */
	async started() {
    this.marvel = new MarvelAPI(publicKey, privateKey)
	},

	/**
	 * Service stopped lifecycle serie handler
	 */
	async stopped() {
    this.marvel = undefined
	}
};
