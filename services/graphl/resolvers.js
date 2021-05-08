module.exports = {
  Query: {
    books: (_, __, { $moleculer }, ___) => {
      return $moleculer.call('GraphQLGateway.FindAllBooksQuery')
    }
  }
}
