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
      queries: require('./graphql/queries'),
      schemas: require('./graphql/schemas'),
      resolvers: require('./graphql/resolvers')
    }
  }
}
