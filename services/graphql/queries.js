module.exports = `
  type Query {
    browse(directory: String, page: Int, pageSize: Int): FilesResult
    read(book: String!): ReadResult
    search(query: String, page: Int, pageSize: Int): FilesResult
  }
`
