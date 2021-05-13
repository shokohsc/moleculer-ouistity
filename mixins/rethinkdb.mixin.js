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
    get: {
      async handler (ctx) {
        const { id } = ctx.params
        const result = await r.db(this.settings.rethinkdb.database).table(this.settings.rethinkdb.table).get(id).run(this.conn)
        return result
      }
    },
    filter: {
      async handler (ctx) {
        const { query = {} } = ctx.params
        const result = await r.db(this.settings.rethinkdb.database).table(this.settings.rethinkdb.table).filter(query).run(this.conn)
        return result
      }
    },
    delete: {
      async handler (ctx) {
        const { query = {} } = ctx.params
        await r.db(this.settings.rethinkdb.database).table(this.settings.rethinkdb.table).filter(query).delete().run(this.conn)
      }
    },
    insert: {
      async handler (ctx) {
        const { data } = ctx.params
        await r.db(this.settings.rethinkdb.database).table(this.settings.rethinkdb.table).insert(data).run(this.conn)
      }
    }
  },
  async created () {
    try {
      this.conn = await r.connect({
        host: this.settings.rethinkdb.hostname,
        port: this.settings.rethinkdb.port,
        db: 'ouistity'
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
