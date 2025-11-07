const sh = require('exec-sh').promise
const path = require('path')
const { snakeCase } = require('lodash')
const parseString = require('xml2js').parseString

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { archive } = ctx.params
    const urn = (`${snakeCase(path.basename(archive, path.extname(archive)))}`).replaceAll('_', '-')

    const data = {
      urn,
      archive,
      basename: path.basename(archive)
    }

    const comicInfo = await sh(`7z e -so "${archive}" "ComicInfo.xml" | tee`, true)
    if (!comicInfo.stderr && comicInfo.stdout) {
      const xml = comicInfo.stdout
      parseString(xml, (err, result) => {
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

    await ctx.broker.$index.addDocuments([{id: urn, ...data}])

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
    archive: { type: 'string'}
  },
  handler
}
