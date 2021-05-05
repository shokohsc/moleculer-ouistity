const { v4: uuidv4 } = require('uuid')

const { name, version } = require('./package.json')
const { moleculer: { metrics: { enabled, port } } } = require('./application.config')

module.exports = {
  nodeID: `node-${name}-${version}-${uuidv4()}`,
  logger: true,
  cacher: 'Memory',
  metrics: {
    enabled: enabled,
    reporter: [
      {
        type: 'Prometheus',
        options: {
          // HTTP port
          port,
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
  },
  async started (broker) {
  }
}
