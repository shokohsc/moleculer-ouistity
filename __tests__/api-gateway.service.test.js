const axios = require('axios')

const { ServiceBroker } = require('moleculer')

const broker = new ServiceBroker({
  logger: false,
  metrics: {
    enabled: false
  }
})

beforeAll(async () => {
  process.env.APP_MOLECULER_API_GATEWAY_PORT = 4444
  await broker.createService(require('../services/api-gateway.service'))
  await broker.start()
})

afterAll(async () => {
  await broker.stop()
})

describe('service api-gateway', () => {
  test('should return 200 on route /status/liveness', async () => {
    const { status } = await axios({
      method: 'get',
      url: 'http://localhost:4444/status/liveness'
    })
    expect(status).toEqual(200)
  })
  test('should return 200 on route /status/readiness', async () => {
    const { status } = await axios({
      method: 'get',
      url: 'http://localhost:4444/status/readiness'
    })
    expect(status).toEqual(200)
  })
})
