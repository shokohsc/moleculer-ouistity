const DbService = require('moleculer-db')
const DbBAdapter = require('moleculer-db-adapter-mongoose')
const mongoose = require('mongoose')

const { mongodb } = require('../application.config')

const removeAll = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const count = await this.broker.call('PagesDomain.count')
    if (count > 0) {
      const items = await this.broker.call('PagesDomain.find')
      const ids = items.map(item => { return item._id })
      do {
        const id = ids.shift()
        await this.broker.call('PagesDomain.remove', { id })
      } while (ids.length > 0)
    }
    return { deleted: true }
  } catch (e) {
    this.logger.error(ctx.action.name, e.message)
    return { success: false, error: e.message }
  }
}

module.exports = {
  name: 'PagesDomain',
  mixins: [DbService],
  adapter: new DbBAdapter(`mongodb://${mongodb.hostname}/ouistity`, { useUnifiedTopology: true }),
  model: mongoose.model('Pages', mongoose.Schema({
    urn: { type: String },
    book: { type: String },
    url: { type: String },
    image: { type: String },
    archive: { type: String }
  })),
  actions: {
    removeAll
  }
}
