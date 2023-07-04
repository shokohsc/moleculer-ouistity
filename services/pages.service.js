const r = require('rethinkdb')
const RethinkDBMixin = require('../mixins/rethinkdb.mixin')

const { rethinkdb } = require('../application.config')

module.exports = {
  name: 'PagesDomain',
  mixins: [RethinkDBMixin],
  settings: {
    rethinkdb: {
      database: 'ouistity',
      table: 'pages',
      secondaryIndexes: ['book'],
      ...rethinkdb
    }
  },
  actions: {
    getPageAndArchive: {
      async handler (ctx) {
        this.logger.info(ctx.action.name, ctx.params)
        const { urn } = ctx.params
        const cursor = await r.db(this.settings.rethinkdb.database)
          .table(this.settings.rethinkdb.table)
          .filter(
            { urn }
          )
          .pluck("name", "type", "book")
          .orderBy("name")
          .innerJoin(
            r.db(this.settings.rethinkdb.database).table("books").pluck("urn", "archive"),
            function (page, book) {
              return page("book").eq(book("urn"))
            }
          ).zip()
          .run(this.conn)
        const result = await cursor.toArray()

        return result
      }
    }
  }
}
