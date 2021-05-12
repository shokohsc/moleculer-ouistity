const DbService = require('moleculer-db')
const DbBAdapter = require('moleculer-db-adapter-mongoose')
const mongoose = require('mongoose')

const { mongodb } = require('../application.config')

const removeAll = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const count = await this.broker.call('BooksDomain.count')
    if (count > 0) {
      const items = await this.broker.call('BooksDomain.find')
      const ids = items.map(item => { return item._id })
      do {
        const id = ids.shift()
        await this.broker.call('BooksDomain.remove', { id })
      } while (ids.length > 0)
    }
    return { deleted: true }
  } catch (e) {
    this.logger.error(ctx.action.name, e.message)
    return { success: false, error: e.message }
  }
}

module.exports = {
  name: 'BooksDomain',
  mixins: [DbService],
  adapter: new DbBAdapter(`mongodb://${mongodb.hostname}/ouistity`, { useUnifiedTopology: true }),
  model: mongoose.model('Books', mongoose.Schema({
    urn: { type: String },
    url: { type: String },
    archive: { type: String },
    type: { type: String }
  })),
  actions: {
    removeAll
  }
}
