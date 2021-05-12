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
  process.env.APP_MOLECULER_APOLLO_PORT = 7777
  await broker.createService(require('../services/books.service'))
  await broker.createService(require('../services/pages.service'))
  await broker.createService(require('../services/archives.service'))
  await broker.createService(require('../services/graphql-gateway.service'))
  await broker.start()
})

afterAll(async () => {
  await broker.stop()
})

describe('service graphql-gateway', () => {
  test('should delete all books', async () => {
    const { success } = await broker.call('BooksDomain.removeAll')
    expect(success).toEqual(true)
  })
  test('should delete all pages', async () => {
    const { success } = await broker.call('PagesDomain.removeAll')
    expect(success).toEqual(true)
  })
  test('should return data for query books', async () => {
    const { data: json } = await axios.post('http://localhost:7777/graphql', {
      query: `
        query books {
          books {
            urn
            pages {
              urn
            }
          }
        }
      `
    })
    expect(json.data.books).toBeDefined()
  })
  test('should return success when no data when generate catalog : create', async () => {
    const { success } = await broker.call('ArchivesDomain.GenerateBooksCatalogCommand', { source: '../../../__tests__/assets/data' })
    expect(success).toEqual(true)
  })
  test('should return data for query books', async () => {
    const { data: json } = await axios.post('http://localhost:7777/graphql', {
      query: `
        query books {
          books {
            urn
            pages {
              urn
            }
          }
        }
      `
    })
    expect(json.data.books).toBeDefined()
  })
  test('should delete all pages', async () => {
    const { success } = await broker.call('PagesDomain.removeAll')
    expect(success).toEqual(true)
  })
  test('should delete all books', async () => {
    const { success } = await broker.call('BooksDomain.removeAll')
    expect(success).toEqual(true)
  })
})
