const { graphqlCache } = require('../../application.config')

module.exports = `
  """
  This type describes a result of paginate books listing. Cached for a minute
  """
  type BooksResult @cacheControl(maxAge: ${graphqlCache.default}) {
    rows: [Book]
    total: Int!
    page: Int!
    pageSize: Int!
    totalPages: Int!
  }
  """
  This type describes a book entity. Cached for a minute
  """
  type Book @cacheControl(maxAge: ${graphqlCache.default}) {
    id: String!
    url: String!
    pages: [Page]
  }
  """
  This type describes a page entity. Cached for a minute
  """
  type Page @cacheControl(maxAge: ${graphqlCache.default}) {
    id: String!
    book: String!
    url: String!
    image: String!
    archive: String!
  }
  """
  This type describes files as a result of browsing a directory or a query search. Cached for a day
  """
  type FilesResult @cacheControl(maxAge: ${graphqlCache.folder}) {
    rows: [File]
    total: Int
    page: Int
    pageSize: Int
    totalPages: Int
  }
  """
  This type describes a File, either folder or file. Cached for a day
  """
  type File @cacheControl(maxAge: ${graphqlCache.folder}) {
    name: String!
    type: String!
    cover: String
    urn: String
  }
  """
  This type describes pages as a result of querying a book. Cached for a year
  """
  type ReadResult @cacheControl(maxAge: ${graphqlCache.books}) {
    rows: [BookPage]
    total: Int!
  }
  """
  This type describes a File, either folder or file. Cached for a year
  """
  type BookPage @cacheControl(maxAge: ${graphqlCache.books}) {
    image: String!
  }
`
