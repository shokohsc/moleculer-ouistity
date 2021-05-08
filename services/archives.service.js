module.exports = {
  name: 'ArchivesDomain',
  actions: {
    GenerateBooksCatalogCommand: require('./actions/archives/GenerateBooksCatalogCommand'),
    GeneratePagesCatalogCommand: require('./actions/archives/GeneratePagesCatalogCommand')
  }
}
