const sh = require('exec-sh').promise
const path = require('path')
const { snakeCase, filter } = require('lodash')

const parse = function (data) {
  const entries = { files: [], type: false, count: 0 }
  // split lines
  const content = data.toString().split('\n')
  const lines = filter(content, function (o) { return o !== '' })
  // file or not file
  lines.map(line => {
    const tmp = line.split('  ') // hack
    const words = filter(tmp, function (o) { return o !== '' })
    // // path
    // if (words[0].search(/Path/) !== -1) {
    //   entries.filepath = words[0].split(' = ')[1]
    // }
    // type
    if (words[0].search(/Type/) !== -1) {
      entries.type = words[0].split(' = ')[1].toLowerCase()
    }
    // files content
    if (line.search(/^\d+-\d+-\d+\s+\d+:\d+:\d+\s+[\.AR]+\s+\d+\s+\d+\s+.+\.[JPEGjpegPNpnAVIFavif]+$/) !== -1) {
      const regex = /^(?<datetime>\d+-\d+-\d+\s+\d+:\d+:\d+)\s+[\.AR]+\s+(?<size>\d+)\s+(?<compressed>\d+)\s+(?<file>.+\.[JPEGjpegPNpnAVIFavif]+)$/
      const [, datetime, size, compressed, file] = regex.exec(line) || [];
      if (undefined !== file && undefined !== size && undefined !== compressed && undefined !== datetime) {
        entries.count++
        entries.files.push({
          name: file,
          size: size,
          compressed: compressed,
          datetime: datetime
        })
      }
    }
    return true
  })
  return entries
}

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { book } = ctx.params
    // analyse archive
    const { stdout } = await sh(`7z l "${book.archive}"`, true)
    const entries = parse(stdout)
    const entities = []
    await ctx.broker.call('PagesDomain.delete', { query: { book: book.urn } })
    do {
      const entry = entries.files.shift()
      const urn = `${book.urn}:pages:${snakeCase(path.basename(entry.name, path.extname(entry.name)))}`
      // remove old entries with this book urn
      if (entry.name.match(/\.(jp(e)?g)|(png)|(avif)$/)) { // Let's insert only images for now
        entities.push({
          urn,
          book: book.urn,
          url: `/api/v1/pages/${urn}`,
          image: `/images/${urn}`,
          // filepath: entries.filepath,
          type: entries.type,
          ...entry
        })
      }
    } while (entries.files.length > 0)
    // // batch insert
    await ctx.broker.call('PagesDomain.insert', { data: entities })
    return { success: true }
  } catch (e) {
    /* istanbul ignore next */
    this.logger.error(ctx.action.name, `Archive: ${ctx.params.book.archive} Message: ${e.message}`)
    /* istanbul ignore next */
    return Promise.reject(e)
  }
}

module.exports = {
  handler
}
