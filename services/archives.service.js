const PGPubSubMixin = require('../mixins/pgpubsub.mixin')
const MeiliSearchMixin = require('../mixins/meilisearch.mixin')
const { meilisearch, postgres } = require('../application.config')

module.exports = {
  name: 'ArchivesDomain',
  mixins: [PGPubSubMixin, MeiliSearchMixin],
  settings: {
    meilisearch: {
      ...meilisearch,
      index: 'comics'
    },
    postgres: {
      ...postgres,
    },
    channel: 'comics'
  },
  events: {
    'ArchivesDomain.GenerateCatalogInitialized': {
      async handler (ctx) {
        await ctx.broker.call('ArchivesDomain.GenerateCatalog', ctx.params)
      }
    // },
    // 'ArchivesDomain.CleanCatalogInitialized': {
    //   async handler (ctx) {
    //     await ctx.broker.call('ArchivesDomain.CleanCatalog', ctx.params)
    //   }
    }
  },
  actions: {
    GenerateCatalog: require('./actions/archives/GenerateCatalog'),
    GenerateBookSubscriber: require('./actions/archives/GenerateBookSubscriber'),
    // CleanCatalog: require('./actions/archives/CleanCatalog'),
    // CleanBookSubscriber: require('./actions/archives/CleanBookSubscriber'),
    GetComicHits: require('./actions/archives/GetComicHits')
  },
  methods: {
    async processComics(payload) {
      await this.broker.call('ArchivesDomain.GenerateBookSubscriber', { archive: payload.archive })
    }
  },
  async started () {
    this.broker.$index = await this.broker.$meilisearch.index(this.settings.meilisearch.index)
    await this.broker.$pgPubSub.addChannel(this.settings.channel, this.processComics)
  },
  async stopped () {
    // await this.broker.$meilisearch.deleteIndex(this.settings.meilisearch.index)
    // await this.broker.$pgPubSub.removeChannel(this.settings.channel)
    // await this.broker.$pgPubSub.close()
  }
}
