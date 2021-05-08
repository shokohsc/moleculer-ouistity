const { ApolloServer, gql } = require('apollo-server')
const responseCachePlugin = require('apollo-server-plugin-response-cache')

const { apollo } = require('../application.config')

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
  actions: {
  },
  async created () {
    const $moleculer = this.broker
    this.controler = new ApolloServer({
      tracing: true,
      typeDefs: gql`${this.settings.graphql.schemas}${this.settings.graphql.queries}`,
      resolvers: this.settings.graphql.resolvers,
      context: async () => ({
        $moleculer
      }),
      plugins: [responseCachePlugin()]
    })
    return true
  },
  async started () {
    await this.controler.listen(apollo)
    return true
  },
  async stopped () {
    await this.controler.stop()
    this.controler = false
    return true
  }
}
