const DbService = require('moleculer-db')
const DbBAdapter = require('moleculer-db-adapter-mongoose')
const mongoose = require('mongoose')

const { mongodb } = require('../application.config')

module.exports = {
  name: 'BooksDomain',
  mixins: [DbService],
  adapter: new DbBAdapter(`mongodb://${mongodb.hostname}/ouistity`, { useUnifiedTopology: true }),
  model: mongoose.model('Books', mongoose.Schema({
    urn: { type: String },
    url: { type: String },
    archive: { type: String },
    type: { type: String }
  }))
}
