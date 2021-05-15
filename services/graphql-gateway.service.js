const GraphQLMixin = require('../mixins/graphql.mixin')

const { rethinkdb } = require('../application.config')

module.exports = {
  name: 'GraphQLGateway',
  mixins: [GraphQLMixin],
  settings: {
    rethinkdb: {
      database: 'ouistity',
      table: 'books',
      ...rethinkdb
    },
    graphql: {
      queries: require('./graphl/queries'),
      schemas: require('./graphl/schemas'),
      resolvers: require('./graphl/resolvers')
    }
  }
}
