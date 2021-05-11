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
  await broker.createService(require('../services/pages.service'))
  await broker.createService(require('../services/archives.service'))
  await broker.start()
})

afterAll(async () => {
  await broker.stop()
})

describe('service archives', () => {
  test('should return an error when no data when generate catalog', async () => {
    const { success, error } = await broker.call('ArchivesDomain.GenerateBooksCatalogCommand', { source: '../../../__tests__/assets/no-data' })
    expect(error).toEqual('ERR_NO_FILES_IN_ASSETS_DATA')
    expect(success).toEqual(false)
  })
  test('should return success when no data when generate catalog : create', async () => {
    const { success } = await broker.call('ArchivesDomain.GenerateBooksCatalogCommand', { source: '../../../__tests__/assets/data' })
    expect(success).toEqual(true)
  })
  test('should return success when no data when generate catalog : update', async () => {
    const { success } = await broker.call('ArchivesDomain.GenerateBooksCatalogCommand', { source: '../../../__tests__/assets/data' })
    expect(success).toEqual(true)
  })
})
