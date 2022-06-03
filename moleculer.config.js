const { v4: uuidv4 } = require('uuid')

const { name, version } = require('./package.json')
const { moleculer: { metrics }, nats, redis } = require('./application.config')

module.exports = {
  nodeID: `node-${name}-${version}-${uuidv4()}`,
  logger: true,
  cacher: {
    type: "Redis",
    options: {
      prefix: "MOL",
      ttl: redis.cacheTTL,
      monitor: false,
      redis: {
        host: redis.hostname,
        port: redis.port,
        family: 4,
        db: 0
      }
    }
  },
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
  },
  tracing: {
		enabled: true,
		// Available built-in exporters: "Console", "Datadog", "Event", "EventLegacy", "Jaeger", "Zipkin"
		exporter: {
			type: "Zipkin", // Console exporter is only for development!
			options: {
        // Base URL for Zipkin server.
        baseURL: "http://zipkin.zipkin",
        // Sending time interval in seconds.
        interval: 5,
        // Additional payload options.
        payloadOptions: {
            // Set `debug` property in payload.
            debug: false,
            // Set `shared` property in payload.
            shared: false
        },
        // Default tags. They will be added into all span tags.
        defaultTags: null
			}
		}
	}
}
