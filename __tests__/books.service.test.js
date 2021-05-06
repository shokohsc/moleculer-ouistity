const { ServiceBroker } = require('moleculer')

const broker = new ServiceBroker({
  logger: false,
  metrics: {
    enabled: false
  }
})

beforeAll(async () => {
  process.env.APP_MOLECULER_API_GATEWAY_PORT = 4444
  await broker.createService(require('../services/books.service'))
  await broker.start()
})

afterAll(async () => {
  await broker.stop()
})

describe('service books', () => {
  test('should generate catalog from archives', async () => {
    const { success } = await broker.call('BooksDomain.GenerateCatalogFromArchivesCommand')
    expect(success).toEqual(true)
  })
})
