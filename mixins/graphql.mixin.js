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
  actions: {
  },
  async created () {
    const $conn = await r.connect({
      host: this.settings.rethinkdb.hostname,
      port: this.settings.rethinkdb.port,
      db: 'ouistity',
      silent: true
    })
    this.logger.info('RethinkDB adapter has connected successfully.')
    await r.dbCreate(this.settings.rethinkdb.database).run(this.conn).catch(() => { })
    // create moleculer to ass to the context
    const $moleculer = this.broker
    // start apollo
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
    return true
  },
  async started () {
    await this.controller.listen(apollo)
    return true
  },
  async stopped () {
    await this.controller.stop()
    this.controller = false
    return true
  }
}
