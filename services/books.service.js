const DbService = require('moleculer-db')
const RethinkDBAdapter = require('../modules/moleculer-db-adapter-rethinkdb')

const { rethinkdb } = require('../application.config')

module.exports = {
  name: 'BooksDomain',
  mixins: [DbService],
  adapter: new RethinkDBAdapter({ host: rethinkdb.hostname, port: rethinkdb.port }),
  database: 'ouistity',
  table: 'books'
}
