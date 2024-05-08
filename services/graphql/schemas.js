const { graphqlCache } = require('../../application.config')

module.exports = `
  """
  This type describes a result of paginate books listing. Cached for a minute
  """
  type BooksResult @cacheControl(maxAge: ${graphqlCache.oneMinute}) {
    rows: [Book]
    total: Int!
    page: Int!
    pageSize: Int!
    totalPages: Int!
  }
  """
  This type describes a book entity. Cached for a minute
  """
  type Book @cacheControl(maxAge: ${graphqlCache.oneMinute}) {
    id: String!
    url: String!
    pages: [Page]
  }
  """
  This type describes a page entity. Cached for a minute
  """
  type Page @cacheControl(maxAge: ${graphqlCache.oneMinute}) {
    id: String!
    book: String!
    url: String!
    image: String!
    archive: String!
  }
  """
  This type describes files as a result of browsing a directory or a query search. Cached for a day
  """
  type FilesResult @cacheControl(maxAge: ${graphqlCache.oneDay}) {
    rows: [File]
    total: Int
    page: Int
    pageSize: Int
    totalPages: Int
  }
  """
  This type describes a File, either folder or file. Cached for a day
  """
  type File @cacheControl(maxAge: ${graphqlCache.oneDay}) {
    name: String!
    type: String!
    cover: String
    urn: String
    info: ComicInfo
  }
  """
  This type describes a ComicInfo, optional metadata fields. Cached for a year
  """
  type ComicInfo @cacheControl(maxAge: ${graphqlCache.books}) {
    series: String
    number: String
    summary: String
    writer: String
    coverArtist: String
    penciller: String
  }
  """
  This type describes pages as a result of querying a book. Cached for a year
  """
  type ReadResult @cacheControl(maxAge: ${graphqlCache.oneYear}) {
    rows: [BookPage]
    total: Int!
  }
  """
  This type describes a File, either folder or file. Cached for a year
  """
  type BookPage @cacheControl(maxAge: ${graphqlCache.oneYear}) {
    image: String!
  }
`
