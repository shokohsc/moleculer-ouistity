const GraphQLMixin = require('../mixins/graphql.mixin')

module.exports = {
  name: 'GraphQLGateway',
  mixins: [GraphQLMixin],
  settings: {
    graphql: {
      queries: require('./graphl/queries'),
      schemas: require('./graphl/schemas'),
      resolvers: require('./graphl/resolvers')
    }
  }
}
