const checksum = require('checksum')

const checksumFilePromise = (file) => {
  return new Promise((resolve, reject) => {
    checksum.file(file, (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { file } = ctx.params
    return await checksumFilePromise(file)
  } catch (e) {
    /* istanbul ignore next */
    this.logger.error(ctx.action.name, e.message)
    /* istanbul ignore next */
    return Promise.reject(e)
  }
}

module.exports = {
  params: {
    file: { type: 'string' }
  },
  cache: true,
  handler
}
