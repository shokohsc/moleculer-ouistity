module.exports = `
  """
  This type describes a pagination entity.
  """
  type Pagination {
    total: Int!
    page(page: Int): Int!
    pageSize(pageSize: Int): Int!
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
  """
  This type describes a result of paginate books listing.
  """
  type BooksResult {
    pagination: Pagination
    nodes: [Book]
  }
`
