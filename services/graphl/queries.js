module.exports = `
  type Query {
    books(page: Int, pageSize: Int): BooksResult
  }
`
