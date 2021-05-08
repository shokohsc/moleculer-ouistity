module.exports = {
  name: 'ArchivesDomain',
  actions: {
    GetDataFromFilepathQuery: require('./actions/archives/GetDataFromFilepathQuery'),
    GenerateCatalogCommand: require('./actions/archives/GenerateCatalogCommand')
  }
}
