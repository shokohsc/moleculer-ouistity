module.exports = `
  """
  This type describes a result of paginate books listing.
  """
  type BooksResult {
    rows: [Book]
    total: Int!
    page: Int!
    pageSize: Int!
    totalPages: Int!
  }
  """
  This type describes a book entity.
  """
  type Book {
    id: String!
    url: String!
    pages: [Page]
  }
  """
  This type describes a page entity.
  """
  type Page {
    id: String!
    book: String!
    url: String!
    image: String!
    archive: String!
  }
`
