const { graphqlCache } = require('../../application.config')

module.exports = `
  """
  This type describes files as a result of browsing a directory or a query search. Cached for a minute
  """
  type FilesResult @cacheControl(maxAge: ${graphqlCache.oneMinute}) {
    rows: [File]
    total: Int
    page: Int
    pageSize: Int
    totalPages: Int
  }
  """
  This type describes a File, either folder or file. Cached for a minute
  """
  type File @cacheControl(maxAge: ${graphqlCache.oneMinute}) {
    name: String!
    type: String!
    cover: String
    info: ComicInfo
    path: String
  }
  """
  This type describes a ComicInfo, optional metadata fields. Cached for a year
  """
  type ComicInfo @cacheControl(maxAge: ${graphqlCache.oneYear}) {
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
  This type describes a page. Cached for a year
  """
  type BookPage @cacheControl(maxAge: ${graphqlCache.oneYear}) {
    image: String!
    name: String!
  }
`
