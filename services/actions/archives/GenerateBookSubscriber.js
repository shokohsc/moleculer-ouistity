const sh = require('exec-sh').promise
const path = require('path')
const { snakeCase } = require('lodash')
const parseString = require('xml2js').parseString

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { archive, pages } = ctx.params
    // upsert books
    const checksum = await ctx.broker.call('ArchivesDomain.GenerateChecksum', { file: archive })
    const urn = `urn:ouistity:books:${snakeCase(path.basename(archive, path.extname(archive)))}:${checksum}`
    const [book] = await ctx.broker.call('BooksDomain.filter', {
      query: {
        urn
      }
    })
    const data = {
      urn,
      checksum,
      url: `/api/v1/books/${urn}`,
      archive,
      basename: path.basename(archive)
    }

    const comicInfo = await sh(`7z e -so "${archive}" "ComicInfo.xml" | tee`, true)
    if (!comicInfo.stderr && comicInfo.stdout) {
      const xml = comicInfo.stdout
      parseString(xml, (err, result) => {
        this.logger.info(result.ComicInfo)
        data.info = {
          series: result.ComicInfo.Series ? result.ComicInfo.Series[0]: '',
          number: result.ComicInfo.Number ? result.ComicInfo.Number[0]: '',
          summary: result.ComicInfo.Summary ? result.ComicInfo.Summary[0]: '',
          writer: result.ComicInfo.Writer ? result.ComicInfo.Writer[0]: '',
          coverArtist: result.ComicInfo.CoverArtist ? result.ComicInfo.CoverArtist[0]: '',
          penciller: result.ComicInfo.Penciller ? result.ComicInfo.Penciller[0]: '',
        }
      })
    }

    if (book) {
      await ctx.broker.call('BooksDomain.update', { id: book.id, data: { ...data, updatedAt: Date.now() } })
    } else {
      await ctx.broker.call('BooksDomain.insert', { data: { ...data, createdAt: Date.now() } })
    }
    // upsert pages for this book
    if (pages === true) {
      // remove old entries with this book urn
      await ctx.broker.call('PagesDomain.delete', { query: { book: urn } })
      await ctx.broker.$rabbitmq.publishExchange('amq.topic', 'moleculer.archives-domain-generate-book-pages-catalog.key', { book: data })
    }
    return { success: true }
  } catch (e) {
    /* istanbul ignore next */
    this.logger.error(ctx.action.name, e.message)
    /* istanbul ignore next */
    return Promise.reject(e)
  }
}

module.exports = {
  params: {
    archive: { type: 'string'},
    pages: { type: 'boolean'}
  },
  handler
}
