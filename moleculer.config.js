const { v4: uuidv4 } = require('uuid')

const { name, version } = require('./package.json')
const { moleculer: { metrics }, nats } = require('./application.config')

module.exports = {
  nodeID: `node-${name}-${version}-${uuidv4()}`,
  logger: true,
  cacher: 'Memory',
  transporter: {
    type: 'NATS',
    options: {
      url: `nats://${nats.hostname}:${nats.port}`
    }
  },
  metrics: {
    enabled: metrics.enabled,
    reporter: [
      {
        type: 'Prometheus',
        options: {
          // HTTP port
          port: metrics.port,
          // HTTP URL path
          path: '/metrics',
          // Default labels which are appended to all metrics labels
          defaultLabels: registry => ({
            namespace: registry.broker.namespace,
            nodeID: registry.broker.nodeID
          })
        }
      }
    ]
  }
}
