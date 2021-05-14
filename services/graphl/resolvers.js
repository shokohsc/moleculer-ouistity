const r = require('rethinkdb')

module.exports = {
  Query: {
    books: async (_, { page = 1, pageSize = 10 }, { $moleculer, $conn }, ___) => {
      const _page = parseInt(page)
      const _pageSize = parseInt(pageSize)
      const total = await r.db('ouistity').table('books').count().run($conn)
      const totalPages = total / _pageSize
      const cursor = await r.db('ouistity')
        .table('books')
        .skip((_page - 1) * _pageSize)
        .limit(_pageSize)
        .merge(function (book) {
          return { pages: r.db('ouistity').table('pages').filter({ book: book('urn') }).coerceTo('array') }
        })
        .run($conn)
      const rows = await cursor.toArray()
      return {
        rows,
        total,
        page,
        pageSize,
        totalPages: Number.isInteger(totalPages) ? totalPages : Math.floor(totalPages) + 1
      }
    }
  }
}
