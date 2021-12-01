const r = require('rethinkdb')
const sh = require('exec-sh').promise
const path = require('path')
const { initial } = require('lodash')
const redis = require('redis')
const checksum = require('checksum')
const checksumFilePromise = (file) => {
  return new Promise((resolve, reject) => {
    checksum.file(file, (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

const { global: { archivesMountPath } } = require('../../application.config')

const { redis: mem } = require('../../application.config')
const client = redis.createClient({ url: `redis://${mem.hostname}:${mem.port}` })
client.on('error', (err) => console.log('Redis Client Error', err))

async function getFilesChecksums(key, filesToSearch = []) {
  await client.connect()
  let filesChecksums = []
  try {
    const exists = await client.exists(key)
    if (exists) {
      filesChecksums = JSON.parse(await client.get(key))
    }
    else {
      filesChecksums = await Promise.all(filesToSearch.map(async (row) => await checksumFilePromise(row)))
      await client.set(key, JSON.stringify(filesChecksums))
      await client.expire(key, mem.cacheTTL)
    }
  } catch(err) {
    console.log({message: err.message})
  }
  await client.quit()

  return filesChecksums
}

async function getBooksAndCovers($conn, filesChecksums = []) {
  // const result = []
  // await Promise.all(filesChecksums.map(async (fileChecksum) => {
  //   const cursor = await r.db('ouistity')
  //     .table('books')
  //     .getAll(fileChecksum, {index: "checksum"})
  //     .pluck('urn', 'basename', 'info')
  //     .orderBy('archive')
  //     .merge(function(book){
  //       return {
  //         cover: r.db('ouistity')
  //         .table('pages')
  //         .getAll(book('urn'), {index: "book"})
  //         .orderBy('name')
  //         .pluck('image')
  //         .limit(1)
  //       }
  //     })
  //     .run($conn)
  //   result.push(await cursor.toArray())
  // }))

  const cursor = await r.db('ouistity')
    .table('books')
    .getAll(...filesChecksums, {index: "checksum"})
    .pluck('urn', 'basename', 'info')
    .orderBy('archive')
    .merge(function(book){
      return {
        cover: r.db('ouistity')
        .table('pages')
        .getAll(book('urn'), {index: "book"})
        .orderBy('name')
        .pluck('image')
        .limit(1)
      }
    })
    .run($conn)
  const result = await cursor.toArray()

  return result
}

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
          .map(function (item) { return {name: item.replace(archivesMountPath + '/', ''), type: `folder`}; })
          .concat(initial(files.stdout.split('\n'))
            .map(function (item) { return {name: item, type: `file`}; }))

        const _page = (parseInt(page) - 1) >= 0 ? parseInt(page) - 1 : 0
        const _pageSize = (parseInt(pageSize)) >= 0 ? parseInt(pageSize) : 1
        const total = rows.length
        const totalPages = total / _pageSize
        rows = rows.slice(_page * _pageSize, _page * _pageSize + _pageSize);

        const foldersToKeep = rows.filter(row => 'folder' === row.type)
        const filesToSearch = rows.filter(row => 'file' === row.type).map(row => archivesMountPath + '/' + directory + row.name)

        const filesChecksums = 0 < filesToSearch.length ? await getFilesChecksums(directory + ':' + _page + ':' + _pageSize, filesToSearch) : []
        rows = 0 < filesToSearch.length ? await getBooksAndCovers($conn, filesChecksums) : []

        rows = foldersToKeep.concat(rows.flat().map(row => {
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
          .map(function (item) { return {name: item.replace(archivesMountPath + '/', '') + '/', type: `folder`}; })
          .concat(initial(files.stdout.split('\n'))
            .map(function (item) { return {name: item, type: `file`}; }))

        const _page = (parseInt(page) - 1) >= 0 ? parseInt(page) - 1 : 0
        const _pageSize = (parseInt(pageSize)) >= 0 ? parseInt(pageSize) : 1
        const total = rows.length
        const totalPages = total / _pageSize
        rows = rows.slice(_page * _pageSize, _page * _pageSize + _pageSize);

        const foldersToKeep = rows.filter(row => 'folder' === row.type)
        const filesToSearch = rows.filter(row => 'file' === row.type).map(row => row.name)

        const filesChecksums = 0 < filesToSearch.length ? await getFilesChecksums(query + ':' + _page + ':' + _pageSize, filesToSearch) : []
        rows = 0 < filesToSearch.length ? await getBooksAndCovers($conn, filesChecksums) : []

        rows = foldersToKeep.concat(rows.flat().map(row => {
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
