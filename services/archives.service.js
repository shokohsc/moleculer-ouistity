const RabbitMQMixin = require('../mixins/rabbitmq.mixin')

const { rabbitmq } = require('../application.config')

module.exports = {
  name: 'ArchivesDomain',
  mixins: [RabbitMQMixin],
  settings: {
    rabbitmq: {
      ...rabbitmq,
      aliases: {
        'archives-domain-generate-book': {
          type: 'topic',
          subscriber: 'ArchivesDomain.GenerateBookSubscriber'
        },
        'archives-domain-generate-book-pages-catalog': {
          type: 'topic',
          subscriber: 'ArchivesDomain.GenerateBookPagesSubscriber'
        }
      }
    }
  },
  actions: {
    GenerateCatalogCommand: require('./actions/archives/GenerateCatalogCommand'),
    GenerateBookSubscriber: require('./actions/archives/GenerateBookSubscriber'),
    GenerateBookPagesSubscriber: require('./actions/archives/GenerateBookPagesSubscriber')
  }
}
