const r = require('rethinkdb')

module.exports = {
  name: 'rethinkdb',
  settings: {
    rethinkdb: {
      database: 'database',
      table: 'table',
      hostname: 'localhost',
      port: 28015
    }
  },
  actions: {
    count: {
      async handler (ctx) {
        const { query = {} } = ctx.params
        const cursor = await r.db(this.settings.rethinkdb.database)
          .table(this.settings.rethinkdb.table)
          .filter(query)
          .run(this.conn)
        return cursor
      }
    },
    getByUrn: {
      async handler (ctx) {
        const { urn } = ctx.params
        const cursor = await r.db(this.settings.rethinkdb.database)
          .table(this.settings.rethinkdb.table)
          .filter({ urn })
          .run(this.conn)
        const [entity] = await cursor.toArray()
        if (!entity) { throw new Error('Entity not found') }
        switch (this.settings.rethinkdb.table) {
          case 'pages':
            entity.books = await ctx.broker.call('BooksDomain.filter', { query: { urn: entity.book } })
            delete entity.book
            break
          case 'books':
            entity.pages = await ctx.broker.call('PagesDomain.filter', { query: { book: entity.urn } })
            break
          default:
        }
        return entity
      }
    },
    get: {
      async handler (ctx) {
        const { id } = ctx.params
        const cursor = await r.db(this.settings.rethinkdb.database)
          .table(this.settings.rethinkdb.table)
          .get(id)
          .run(this.conn)
        return cursor
      }
    },
    filter: {
      async handler (ctx) {
        this.logger.info(ctx.action.name, ctx.params)
        const { query = {}, page = -1, pageSize = 10 } = ctx.params
        const _page = parseInt(page)
        const _pageSize = parseInt(pageSize)
        if (parseInt(page) > 0) {
          const total = await await r.db(this.settings.rethinkdb.database).table(this.settings.rethinkdb.table).filter(query).count().run(this.conn)
          const totalPages = total / _pageSize
          const cursor = await r.db(this.settings.rethinkdb.database)
            .table(this.settings.rethinkdb.table)
            .filter(query)
            .skip((_page - 1) * _pageSize)
            .limit(_pageSize)
            .run(this.conn)
          const rows = await cursor.toArray()
          return {
            rows,
            total,
            page: _page,
            pageSize: _pageSize,
            totalPages: Number.isInteger(totalPages) ? totalPages : Math.floor(totalPages) + 1
          }
        } else {
          const cursor = await r.db(this.settings.rethinkdb.database)
            .table(this.settings.rethinkdb.table)
            .filter(query)
            .run(this.conn)
          const result = await cursor.toArray()
          return result
        }
      }
    },
    delete: {
      async handler (ctx) {
        const { query = {} } = ctx.params
        await r.db(this.settings.rethinkdb.database)
          .table(this.settings.rethinkdb.table)
          .filter(query)
          .delete()
          .run(this.conn)
        return true
      }
    },
    insert: {
      async handler (ctx) {
        const { data } = ctx.params
        await r.db(this.settings.rethinkdb.database)
          .table(this.settings.rethinkdb.table)
          .insert(data)
          .run(this.conn)
        return true
      }
    },
    update: {
      async handler (ctx) {
        const { id, data } = ctx.params
        await r.db(this.settings.rethinkdb.database)
          .table(this.settings.rethinkdb.table)
          .get(id)
          .update(data)
          .run(this.conn)
        return true
      }
    }
  },
  async created () {
    try {
      this.conn = await r.connect({
        host: this.settings.rethinkdb.hostname,
        port: this.settings.rethinkdb.port,
        db: 'ouistity',
        silent: true
      })
      this.logger.info('RethinkDB adapter has connected successfully.')
      await r.dbCreate(this.settings.rethinkdb.database).run(this.conn).catch(() => { })
      const tables = await r.db(this.settings.rethinkdb.database).tableList().run(this.conn)
      if (!tables.includes(this.settings.rethinkdb.table)) {
        await r.db(this.settings.rethinkdb.database).tableCreate(this.settings.rethinkdb.table).run(this.conn)
      }
      return true
    } catch (e) {
      this.logger.error('RethinkDB error.', e)
      throw e
    }
  },
  async started () {
    return true
  },
  async stopped () {
    await this.conn.close()
    return true
  }
}