const r = require('rethinkdb')
const sh = require('exec-sh').promise
const path = require('path')
const { initial } = require('lodash')

const { global: { archivesMountPath } } = require('../../application.config')

module.exports = {
  Query: {
    books: async (_, { page = 1, pageSize = 10 }, { $moleculer, $conn }, ___) => {
      const _page = parseInt(page)
      const _pageSize = parseInt(pageSize)
      const total = await r.db('ouistity').table('books').count().run($conn)
      const totalPages = total / _pageSize
      const cursor = await r.db('ouistity')
        .table('books')
        .skip((_page - 1) * _pageSize)
        .limit(_pageSize)
        .merge(function (book) {
          return { pages: r.db('ouistity').table('pages').filter({ book: book('urn') }).coerceTo('array') }
        })
        .run($conn)
      const rows = await cursor.toArray()
      return {
        rows,
        total,
        page,
        pageSize,
        totalPages: Number.isInteger(totalPages) ? totalPages : Math.floor(totalPages) + 1
      }
    },
    read: async (_, { book }, { $moleculer, $conn }, ___) => {
      const cursor = await r.db('ouistity')
        .table('pages')
        .filter({ book: book })
        .orderBy('name')
        .pluck('image')
        .coerceTo('array')
        .run($conn)
      const rows = await cursor.toArray()
      return {
        rows,
        total: rows.length
      }
    },
    browse: async (_, { directory = '', page = 1, pageSize = 10 }, { $moleculer, $conn }, ___) => {
      try {
        const targetDirectory = directory.replace(/\ /g, '\\ ')
        const folders = await sh(`ls -p ${archivesMountPath + '/' + targetDirectory} | egrep '/$' | sort -n`, true)
        const files = await sh(`ls -p ${archivesMountPath + '/' + targetDirectory} | egrep -v '/$' | sort -n`, true)

        let rows = initial(folders.stdout.split('\n'))
          .map(function (item) { return {name: item, type: `folder`}; })
          .concat(initial(files.stdout.split('\n'))
            .map(function (item) { return {name: item, type: `file`}; }))

        const _page = (parseInt(page) - 1) >= 0 ? parseInt(page) - 1 : 0
        const _pageSize = (parseInt(pageSize)) >= 0 ? parseInt(pageSize) : 1
        const total = rows.length
        const totalPages = total / _pageSize
        rows = rows.slice(_page * _pageSize, _page * _pageSize + _pageSize);
        const foldersToKeep = rows.filter(row => 'folder' === row.type)
        const filesToSearch = rows.filter(row => 'file' === row.type).map(row => archivesMountPath + '/' + directory + row.name)

        const cursor = await r.db('ouistity')
          .table('books')
          .filter(function(book){
            return r
              .expr(filesToSearch)
              .contains(book('archive'))
            }
          )
          .pluck('urn', 'basename', 'info')
          .orderBy('archive')
          .merge(function(book){
            return {
              cover: r.db('ouistity')
              .table('pages')
              .filter({ book: book('urn') })
              .orderBy('name')
              .pluck('image')
              .limit(1)
              .coerceTo('array')
            }
          })
          .run($conn)
        rows = await cursor.toArray()

        rows = foldersToKeep.concat(rows.map(row => {
        return {
          name: row.basename,
          type: 'file',
          cover: (row.cover.length > 0 && row.cover[0].image) ? row.cover[0].image : '',
          urn: row.urn,
          info: row.info
        }
        }))

        return {
          rows,
          total,
          page,
          pageSize,
          totalPages: Number.isInteger(totalPages) ? totalPages : Math.floor(totalPages) + 1
        }
      } catch (e) {
        console.log(e);
        return {}
      }
    },
    search: async (_, { query = '', page = 1, pageSize = 10 }, { $moleculer, $conn }, ___) => {
      try {
        const folders = await sh(`find ${archivesMountPath} -iname "*${query}*" -type d |sort -n`, true)
        const files = await sh(`find ${archivesMountPath} -iname "*${query}*" -type f |sort -n`, true)

        let rows = initial(folders.stdout.split('\n'))
          .map(function (item) { return {name: item.replace(archivesMountPath, ''), type: `folder`}; })
          .concat(initial(files.stdout.split('\n'))
            .map(function (item) { return {name: item, type: `file`}; }))

        const _page = (parseInt(page) - 1) >= 0 ? parseInt(page) - 1 : 0
        const _pageSize = (parseInt(pageSize)) >= 0 ? parseInt(pageSize) : 1
        const total = rows.length
        const totalPages = total / _pageSize
        rows = rows.slice(_page * _pageSize, _page * _pageSize + _pageSize);
        const foldersToKeep = rows.filter(row => 'folder' === row.type)
        const filesToSearch = rows.filter(row => 'file' === row.type).map(row => row.name)

        const cursor = await r.db('ouistity')
          .table('books')
          .filter(function(book){
            return r
              .expr(filesToSearch)
              .contains(book('archive'));
            }
          )
          .pluck('urn', 'basename', 'info')
          .orderBy('archive')
          .merge(function(book){
            return {
              cover: r.db('ouistity')
              .table('pages')
              .filter({ book: book('urn') })
              .orderBy('name')
              .pluck('image')
              .limit(1)
              .coerceTo('array')
            }
          })
          .run($conn)
        rows = await cursor.toArray()

        rows = foldersToKeep.concat(rows.map(row => {
        return {
          name: row.basename,
          type: 'file',
          cover: (row.cover.length > 0 && row.cover[0].image) ? row.cover[0].image : '',
          urn: row.urn,
          info: row.info
        }
        }))

        return {
          rows,
          total,
          page,
          pageSize,
          totalPages: Number.isInteger(totalPages) ? totalPages : Math.floor(totalPages) + 1
        }
      } catch (e) {
        console.log(e);
        return {}
      }
    }
  }
}
