module.exports = `
  type Query {
    books(page: Int, pageSize: Int): BooksResult
    browse(directory: String, page: Int, pageSize: Int): FilesResult
    read(book: String!): ReadResult
    search(query: String, page: Int, pageSize: Int): FilesResult
  }
`
