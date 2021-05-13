module.exports = {
  Query: {
    books: (_, { page = -1, pageSize = 10 }, { $moleculer }, ___) => {
      return $moleculer.call('BooksDomain.filter', { page, pageSize })
    }
  }
}
