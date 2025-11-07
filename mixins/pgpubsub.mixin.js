const PGPubsub = require('pg-pubsub')

module.exports = {
  // Must overwrite it
  name: 'pgpubsub',
  settings: {
    postgres: {
      hostname: '',
      port: 5432,
      database: '',
      username: '',
      password: ''
    },
    channel: ''
  },
  metadata: {
  },
  created () {
    this.broker.$pgPubSub = new PGPubsub(`postgres://${this.settings.postgres.username}:${this.settings.postgres.password}@${this.settings.postgres.hostname}:${this.settings.postgres.port}/${this.settings.postgres.database}`)
    this.logger.info('pgpubsub mixin created')
  },
  async started () {
    this.logger.info('pgpubsub mixin started')
  },
    async stopped() {
    this.logger.info('pgpubsub mixin stopped')
  }
}
