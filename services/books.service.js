const RethinkDBMixin = require('../mixins/rethinkdb.mixin')

const { rethinkdb } = require('../application.config')

module.exports = {
  name: 'BooksDomain',
  mixins: [RethinkDBMixin],
  settings: {
    rethinkdb: {
      database: 'ouistity',
      table: 'books',
      ...rethinkdb
    }
  },
  events: {
    'ArchivesDomain.GenerateCatalogInitialized': {
      async handler (ctx) {
        await ctx.broker.call('ArchivesDomain.GenerateCatalogCommand')
      }
    }
  }
}
