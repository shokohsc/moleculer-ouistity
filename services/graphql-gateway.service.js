const GraphQLMixin = require('../mixins/graphql.mixin')

module.exports = {
  name: 'GraphQLGateway',
  mixins: [GraphQLMixin],
  settings: {
    graphql: {
      queries: require('./graphql/queries'),
      schemas: require('./graphql/schemas'),
      resolvers: require('./graphql/resolvers')
    }
  }
}
