const r = require('rethinkdb')
const { ApolloServer, gql } = require('apollo-server')
const responseCachePlugin = require('apollo-server-plugin-response-cache')

const { apollo } = require('../application.config')

module.exports = {
  name: 'graphql',
  settings: {
    rethinkdb: {
      database: 'database',
      hostname: 'localhost',
      port: 28015
    },
    graphql: {
      schemas: `
      `,
      queries: `
      `,
      resolvers: {}
    }
  },
  methods: {
    startApollo($moleculer, $conn) {
      this.controller = new ApolloServer({
        tracing: true,
        typeDefs: gql`${this.settings.graphql.schemas}${this.settings.graphql.queries}`,
        resolvers: this.settings.graphql.resolvers,
        context: async () => ({
          $moleculer,
          $conn
        }),
        plugins: [responseCachePlugin()]
      })
    }
  },
  async created () {
    const $conn = await r.connect({
      host: this.settings.rethinkdb.hostname,
      port: this.settings.rethinkdb.port,
      db: 'ouistity',
      silent: true
    })
    $conn.on('error', (err) => {
      this.logger.error('RethinkDB disconnected', err)
      setTimeout(() => this.conn.reconnect(), 1000)
    })
    this.logger.info('RethinkDB adapter has connected successfully.')
    await r.dbCreate(this.settings.rethinkdb.database).run(this.conn).catch(() => { })
    // create moleculer to pass to the context
    const $moleculer = this.broker
    // start apollo
    this.startApollo($moleculer, $conn)
    return true
  },
  async started () {
    // TODO this.controller is sometimes undefined, why ?
    if (!this.controller) {
      const $conn = await r.connect({
        host: this.settings.rethinkdb.hostname,
        port: this.settings.rethinkdb.port,
        db: 'ouistity',
        silent: true
      })
      $conn.on('error', (err) => {
        this.logger.error('RethinkDB disconnected', err)
        setTimeout(() => this.conn.reconnect(), 100)
      })
      this.logger.info('RethinkDB adapter has connected successfully.')
      const $moleculer = this.broker
      this.startApollo($moleculer, $conn)
    }
    await this.controller.listen(apollo)
    return true
  },
  async stopped () {
    this.controller = false
    return true
  }
}
