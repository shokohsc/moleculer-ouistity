const MarvelAPI = require('marvel-ts').MarvelAPI
const moment = require('moment')

const { marvel: { publicKey, privateKey } } = require('../../application.config')

module.exports = {
	name: "MarvelStories",

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
		getStory: {
			rest: "GET /stories/:id",
			async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
				try {
					const response = await this.marvel.getStories({
						id: ctx.params.id
					})

			    return {
						story: await this.getStory(response.data.results[0])
					}
				} catch (e) {
					this.logger.error(e)

					return Promise.reject(e)
				}
			},
			cache: true
		},
		getComics: {
			rest: "GET /stories/:id/comics",
			async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
				try {
					const response = await this.marvel.getComics({
						stories: ctx.params.id,
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
		searchStories: {
			rest: "GET /stories",
			async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
				try {
					const response = await this.marvel.getStories({
						orderBy: '-id',
						limit: undefined !== ctx.params.limit ? ctx.params.limit : this.searchLimit,
						offset: undefined !== ctx.params.offset ? ctx.params.offset : this.searchOffset
					})

					return {
						stories: await this.listStories(response.data.results),
						total: response.data.total
					}
				} catch (e) {
					this.logger.error(e)

					return Promise.reject(e)
				}
			},
			params: {
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
	 * Stories
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

		async listStories(results) {
			const stories = []
			for (const result of results) {
				stories.push({ storyId: result.id, title: result.title, thumbnail: result.thumbnail })
			}
			return stories
		},

		async getStory(result) {
			return {
				storyId: result.id,
				title: result.title,
				thumbnail: result.thumbnail
			}
		}
	},

	/**
	 * Service created lifecycle storie handler
	 */
	created() {
		this.ttl = 30
		this.searchLimit = 10
		this.searchOffset = 0
	},

	/**
	 * Service started lifecycle storie handler
	 */
	async started() {
    this.marvel = new MarvelAPI(publicKey, privateKey)
	},

	/**
	 * Service stopped lifecycle storie handler
	 */
	async stopped() {
    this.marvel = undefined
	}
};
