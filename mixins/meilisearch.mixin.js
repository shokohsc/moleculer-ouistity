const { Rabbit } = require('rabbit-queue')
const { Meilisearch } = require('meilisearch')

module.exports = {
  // Must overwrite it
  name: '',
  settings: {
    meilisearch: {
      hostname: '',
      port: 7700,
      apiKey: '',
      index: ''
    }
  },
  metadata: {
  },
  methods: {
    async getIndex() {
      return this.broker.$meilisearch.index(this.settings.meilisearch.index)
    }
  },
  created () {
    this.broker.$meilisearch = new Meilisearch({
      host: `http://${this.settings.meilisearch.hostname}:${this.settings.meilisearch.port}`,
      apiKey: this.settings.meilisearch.apiKey,
    })
    this.logger.info('meilisearch mixin created')
  },
  async started () {
    this.broker.$meilisearch.index(this.settings.meilisearch.index)
    this.logger.info('meilisearch mixin started')
  },
	async stopped() {
    // this.broker.$meilisearch.deleteIndex(this.settings.meilisearch.index)
    this.logger.info('meilisearch mixin stopped')
	}
}
