const { ApolloServer, gql } = require('apollo-server')
const responseCachePlugin = require('apollo-server-plugin-response-cache')
const { BaseRedisCache } = require('apollo-server-cache-redis');
const Redis = require('ioredis');

const { apollo, redis, graphqlCache } = require('../application.config')

module.exports = {
  name: 'graphql',
  settings: {
    graphql: {
      schemas: `
      `,
      queries: `
      `,
      resolvers: {}
    }
  },
  methods: {
    async startApollo($moleculer) {
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
          $moleculer
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
        await this.controller.stop()
      return true
    }
  },
  async created () {

  },
  async started () {
    const $moleculer = this.broker
    await this.startApollo($moleculer)
    return true
  },
  async stopped () {
    await this.stopApollo()
    return true
  }
}
