const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const books = await this.broker.call('BooksDomain.find')
    const result = []
    if (books.length > 0) {
      do {
        const book = books.shift()
        book.pages = await this.broker.call('PagesDomain.find', { query: { book: book.id } })
        result.push(book)
      } while (books.length > 0)
    }
    return result
  } catch (e) {
    /* istanbul ignore next */
    this.logger.error(ctx.action.name, e.message)
    /* istanbul ignore next */
    return Promise.reject(e)
  }
}

module.exports = {
  handler
}
