const { Rabbit } = require('rabbit-queue')

module.exports = {
  // Must overwrite it
  name: '',
  settings: {
    rabbitmq: {
      hostname: '',
      port: 0,
      username: '',
      password: '',
      vhost: '',
      prefetchCount: 0,
      aliases: {}
    }
  },
  // Service's metadata
  metadata: {
    $bindings: []
  },
  methods: {
    async setQueues() {
      // Step 2: From bindings to rabbitmq queue
      const aliases = this.settings.rabbitmq.aliases
      this.metadata.$bindings.map(binding => {
        const base = { durable: true, autoDelete: false }
        const options = { ...base }
        this.broker.$rabbitmq.createQueue(binding.target, options, async (msg, ack) => {
          const routingKey = msg.fields.routingKey
          const refName = routingKey.split('.')[1]
          const item = aliases[refName]
          try {
            await this.broker.call(item.subscriber, JSON.parse(msg.content.toString()))
            ack()
            return true
          } catch (e) {
            ack(e.message)
            this.logger.error(e.message)
            return false
          }
        })
        this.broker.$rabbitmq.bindToExchange(binding.target, binding.exchange, binding.key)
        return true
      })
    }
  },
  created () {
    this.logger.info('rabbitmq mixin created')
    const options = `amqp://${this.settings.rabbitmq.username}:${this.settings.rabbitmq.password}@${this.settings.rabbitmq.hostname}:${this.settings.rabbitmq.port}`
    this.broker.$rabbitmq = new Rabbit(options, {
      prefetch: this.settings.rabbitmq.prefetchCount,
      replyPattern: false,
      scheduledPublish: false
    })
    const r = this.broker.$rabbitmq
    this.broker.$rabbitmq.on('connected', async () => {
      this.logger.info('rabbitmq connected')
      await this.setQueues()
    })
    this.broker.$rabbitmq.on('disconnected', (err) => {
      this.logger.error('Rabbitmq disconnected', err)
      setTimeout(() => r.reconnect(), 1000)
    })
    this.broker.$rabbitmq.on('log', (component, level, ...args) => {
      this.logger.info(...args)
    })
  },
  async started () {
    this.logger.info('rabbitmq mixin started')
    // Step 1: From aliases to bindings
    const aliases = this.settings.rabbitmq.aliases
    const keys = Object.keys(aliases)
    keys.map(name => {
      const { type } = aliases[name]
      this.metadata.$bindings.push({ exchange: `amq.${type}`, target: `moleculer.${name}.queue`, key: `moleculer.${name}.key` })
      return true
    })
    await this.setQueues()
  }
}
