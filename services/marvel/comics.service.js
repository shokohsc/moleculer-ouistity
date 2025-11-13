const dayjs = require('dayjs')

const MarvelMixin = require('../../mixins/marvel.mixin')

module.exports = {
	name: "MarvelComics",

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
		getComicsWeek: {
			rest: "GET /comics/week",
			async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
				try {
					const endDate = dayjs('' !== ctx.params.date ? ctx.params.date : dayjs().format('YYYY-MM-DD'))
					const startDate = dayjs('' !== ctx.params.date ? ctx.params.date : dayjs().format('YYYY-MM-DD')).subtract(6, 'days')

					const params = new URLSearchParams({
						dateStart: startDate.format('YYYY-MM-DD'), 
						dateEnd: endDate.format('YYYY-MM-DD'),
						variants: 0,
						byType: 'date',
						orderBy: 'release_date desc',
						offset: 0,
						limit: 100
					})
					const response = await fetch(`${this.settings.marvel.publicUrl}${this.settings.marvel.publicUri}/comics/calendar?${params}`)
					const json = await response.json()
					
					return {
						date: ctx.params.date,
						comics: await this.listComics(json.data.results),
						total: json.data.total
					}
				} catch (e) {
					this.logger.error(e)

					return Promise.reject(e)
				}
			},
			params: {
				date: { type: 'string', optional: true, default: dayjs().format('YYYY-MM-DD') }
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

	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {

	},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {

	}
};
