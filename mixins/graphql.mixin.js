const r = require('rethinkdb')
const { ApolloServer, gql } = require('apollo-server')
const responseCachePlugin = require('apollo-server-plugin-response-cache')
const { BaseRedisCache } = require('apollo-server-cache-redis');
const Redis = require('ioredis');

const { apollo, redis, graphqlCache } = require('../application.config')

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
    async connectToRethinkDB() {
      const $conn = await r.connect({
        host: this.settings.rethinkdb.hostname,
        port: this.settings.rethinkdb.port,
        db: 'ouistity',
        silent: true
      })
      $conn.on('error', (err) => {
        this.logger.error('RethinkDB disconnected', err)
        setTimeout(() => $conn.reconnect(), 1000)
      })
      this.logger.info('RethinkDB adapter has connected successfully.')
      return $conn
    },
    async startApollo($moleculer, $conn) {
      this.controller = new ApolloServer({
        tracing: true,
        csrfPrevention: true,
        cache: new BaseRedisCache({
          client: new Redis({
            host: redis.hostname,
          }),
        }),
        cacheControl: {
          defaultMaxAge: graphqlCache.oneMinute
        },
        typeDefs: gql`${this.settings.graphql.schemas}${this.settings.graphql.queries}`,
        resolvers: this.settings.graphql.resolvers,
        context: async () => ({
          $moleculer,
          $conn
        }),
        plugins: [responseCachePlugin({
          shouldReadFromCache: (requestContext) => (requestContext.request.http.headers.get('cache-control') !== 'no-cache'),
          shouldWriteToCache: (requestContext) => (requestContext.request.http.headers.get('cache-control') !== 'no-cache')
        })]
      })
      await this.controller.listen(apollo)
      return true
    },
    async stopApollo() {
      if (undefined !== this.controller)
        this.controller.stop()
      return true
    }
  },
  async created () {

  },
  async started () {
    const $conn = await this.connectToRethinkDB()
    const $moleculer = this.broker
    await this.startApollo($moleculer, $conn)
    return true
  },
  async stopped () {
    this.stopApollo()
    return true
  }
}
