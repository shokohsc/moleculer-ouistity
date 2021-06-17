module.exports = `
  type Query {
    books(page: Int, pageSize: Int): BooksResult
    browse(directory: String, page: Int, pageSize: Int): BrowseResult
    read(book: String!): ReadResult
  }
`
