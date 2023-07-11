const r = require('rethinkdb')
const RethinkDBMixin = require('../mixins/rethinkdb.mixin')

const { rethinkdb } = require('../application.config')

module.exports = {
  name: 'BooksDomain',
  mixins: [RethinkDBMixin],
  settings: {
    rethinkdb: {
      database: 'ouistity',
      table: 'books',
      secondaryIndexes: ['archive', 'checksum'],
      ...rethinkdb
    }
  },
  actions: {
    browseBooksAndCovers: {
      async handler (ctx) {
        this.logger.info(ctx.action.name, ctx.params)
        // const { filesChecksums, directory } = ctx.params
        const { filesChecksums } = ctx.params

        const cursor = await r.db('ouistity')
          .table(this.settings.rethinkdb.table)
          .getAll(...filesChecksums, {index: "checksum"})
          // .filter(
          //   r.row("archive").match(`${directory.replace(/\ /g, '\\ ').replace(/\+/g, '\\+').replace(/\(/g, '\\(').replace(/\)/g, '\\)')}`)
          // )
          .pluck('urn', 'basename', 'info', 'archive')
          .orderBy('archive')
          .merge(function(book){
            return {
              cover: r.db('ouistity')
              .table('pages')
              .getAll(book('urn'), {index: "book"})
              .orderBy('name')
              .pluck('image')
              .limit(1)
            }
          })
          .run(this.conn)
        const result = await cursor.toArray()

        return result
      }
    },
    getBooksArchiveUrn: {
      async handler (ctx) {
        this.logger.info(ctx.action.name, ctx.params)
        const { directory } = ctx.params

        const cursor = await r.db('ouistity')
          .table(this.settings.rethinkdb.table)
          .filter(
            r.row("archive").match(`^${directory.replace(/\ /g, '\\ ').replace(/\+/g, '\\+').replace(/\(/g, '\\(').replace(/\)/g, '\\)')}`)
          )
          .pluck("id", "urn", "archive")
          .orderBy("archive")
          .run(this.conn)
        const result = await cursor.toArray()

        return result
      }
    },
    searchBooksAndCovers: {
      async handler (ctx) {
        this.logger.info(ctx.action.name, ctx.params)
        const { filesChecksums } = ctx.params

        const cursor = await r.db('ouistity')
          .table(this.settings.rethinkdb.table)
          .getAll(...filesChecksums, {index: "checksum"})
          .pluck('id', 'urn', 'basename', 'info', 'archive')
          .orderBy('archive')
          .merge(function(book){
            return {
              cover: r.db('ouistity')
              .table('pages')
              .getAll(book('urn'), {index: "book"})
              .orderBy('name')
              .pluck('image')
              .limit(1)
            }
          })
          .run(this.conn)
        const result = await cursor.toArray()

        return result
      }
    }
  }
}
