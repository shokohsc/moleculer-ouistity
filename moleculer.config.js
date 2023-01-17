const { v4: uuidv4 } = require('uuid')
const dayjs = require('dayjs')
const weekOfYear = require('dayjs/plugin/weekOfYear')
const updateLocale = require('dayjs/plugin/updateLocale')
dayjs.extend(weekOfYear)
dayjs.extend(updateLocale)
dayjs.updateLocale('en', { weekStart: 3 })

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
      },
      keygen(name, params, meta, keys) {
        if ('MarvelComics.getComicsWeek' === name) {
          const date = dayjs(params.date)
          const key = `date|${date.year()}-${date.week()}`
          return `${name}:${key}`
        }

        const hash = []
        for (const [k, v] of Object.entries(params)) {
          hash.push(k)
          hash.push(v)
        }
        return `${name}:${hash.join('|')}`
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
    stackTrace: true,
    events: true,
		// Available built-in exporters: "Console", "Datadog", "Event", "EventLegacy", "Jaeger", "Zipkin"
		exporter: {
			type: "Zipkin", // Console exporter is only for development!
			options: {
        // Base URL for Zipkin server.
        baseURL: "http://zipkin.zipkin:9411",
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
