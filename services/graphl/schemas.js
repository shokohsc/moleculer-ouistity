module.exports = `
  """
  This type describes a book entity.
  """
  type Book {
    urn: String!
    url: String!
    pages: [Page]
  }
  """
  This type describes a page entity.
  """
  type Page {
    urn: String!
    book: String!
    url: String!
    image: String!
    archive: String!
  }
`
