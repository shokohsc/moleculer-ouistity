const MarvelMixin = require('../../mixins/marvel.mixin')

module.exports = {
	name: "MarvelSeries",

	mixins: [MarvelMixin],

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
		getComics: {
			rest: "GET /series/:id/comics",
			async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
				try {
					const params = new URLSearchParams({
						variants: 0,
						byId: ctx.params.id,
						byZone: 'marvel_site_zone',
						byType: 'comic_series',
						orderBy: 'release_date desc',
						formatType: 'issue',
						getThumb: 1,
						offset: undefined !== ctx.params.offset ? ctx.params.offset : this.searchOffset,
						limit: undefined !== ctx.params.limit ? ctx.params.limit : this.searchLimit
					})
					const response = await fetch(`${this.settings.marvel.publicUrl}${this.settings.marvel.publicUri}/comics?${params}`)
					const json = await response.json()

					return {
						id: ctx.params.id,
						comics: await this.listComics(json.data.results),
						total: json.data.total
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

	},

	/**
	 * Service created lifecycle serie handler
	 */
	created() {

	},

	/**
	 * Service started lifecycle serie handler
	 */
	async started() {

	},

	/**
	 * Service stopped lifecycle serie handler
	 */
	async stopped() {

	}
};
