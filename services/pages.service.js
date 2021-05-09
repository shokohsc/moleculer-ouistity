const DbService = require('moleculer-db')
const DbBAdapter = require('moleculer-db-adapter-mongoose')
const mongoose = require('mongoose')

const { mongodb } = require('../application.config')

module.exports = {
  name: 'PagesDomain',
  mixins: [DbService],
  adapter: new DbBAdapter(`mongodb://${mongodb.hostname}/ouistity`, { useUnifiedTopology: true }),
  model: mongoose.model('Pages', mongoose.Schema({
    urn: { type: String },
    book: { type: String }
  }))
}
