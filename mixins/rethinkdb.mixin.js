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
        if (parseInt(page) > 0) {
          const total = await await r.db(this.settings.rethinkdb.database).table(this.settings.rethinkdb.table).filter(query).count().run(this.conn)
          const totalPages = (Math.floor((parseInt(total) + parseInt(pageSize) - 1) / parseInt(pageSize))) - 1
          const cursor = await r.db(this.settings.rethinkdb.database)
            .table(this.settings.rethinkdb.table)
            .filter(query)
            .skip(parseInt(parseInt(page) * parseInt(pageSize)))
            .limit(parseInt(pageSize))
            .run(this.conn)
          const rows = await cursor.toArray()
          return {
            rows,
            total: parseInt(total),
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalPages
          }
        } else {
          const cursor = await r.db(this.settings.rethinkdb.database)
            .table(this.settings.rethinkdb.table)
            .filter(query)
            .run(this.conn)
          const rows = await cursor.toArray()
          return rows
        }
      }
    },
    delete: {
      async handler (ctx) {
        const { query = {} } = ctx.params
        console.log(query)
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
