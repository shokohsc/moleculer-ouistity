const RethinkDBMixin = require('../mixins/rethinkdb.mixin')

const { rethinkdb } = require('../application.config')

module.exports = {
  name: 'PagesDomain',
  mixins: [RethinkDBMixin],
  settings: {
    rethinkdb: {
      database: 'ouistity',
      table: 'pages',
      ...rethinkdb
    }
  }
}
