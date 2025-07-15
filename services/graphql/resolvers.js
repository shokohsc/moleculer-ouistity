const sh = require('exec-sh').promise
const path = require('path')
const { filter, initial, uniqBy } = require('lodash')
const parseString = require('xml2js').parseString

const { global: { archivesMountPath } } = require('../../application.config')

const parse = async (data) => {
  const entries = { files: [], type: false, count: 0 }
  // split lines
  const content = data.toString().split('\n')
  const lines = await filter(content, function (o) { return o !== '' })
  // file or not file
  lines.map(async line => {
    const tmp = line.split('  ') // hack
    const words = await filter(tmp, function (o) { return o !== '' })
    // type
    if (words[0].search(/Type/) !== -1) {
      entries.type = words[0].split(' = ')[1].toLowerCase()
    }
    // files content
    if (line.search(/^\d+-\d+-\d+\s+\d+:\d+:\d+\s+[\.AR]+\s+\d+\s+\d+\s+.+\.[JPEGjpegPNpnAVIFavifXMLxml]+$/) !== -1) {
      const regex = /^(?<datetime>\d+-\d+-\d+\s+\d+:\d+:\d+)\s+[\.AR]+\s+(?<size>\d+)\s+(?<compressed>\d+)\s+(?<file>.+\.[JPEGjpegPNpnAVIFavifXMLxml]+)$/
      const [, datetime, size, compressed, file] = regex.exec(line) || [];
      if (undefined !== file && undefined !== size && undefined !== compressed && undefined !== datetime) {
        entries.count++
        entries.files.push({
          name: file,
          size: size,
          compressed: compressed,
          datetime: datetime
        })
      }
    }
    return true
  })
  return entries
}
const getArchiveList = async (archive) => {
  const { stdout } = await sh(`7z l "${archive}"`, true)
  const entries = await parse(stdout)
  entries.files.sort((rowA, rowB) => {
    if (rowA.name.toLowerCase() > rowB.name.toLowerCase()) {
      return 1;
    }
    if (rowA.name.toLowerCase() < rowB.name.toLowerCase()) {
      return -1;
    }
    return 0;
  })

  return entries.files
}
const getCover = async (archive) => {
  const files = await getArchiveList(archivesMountPath + '/' + archive)
  const list = files
    .filter(file => path.extname(file.name).toLowerCase() !== '.xml')
  
  return list[0].name
}
const getComicInfo = async (archive) => {
  let info = {}
  const list = await getArchiveList(archivesMountPath + '/' + archive)
  if (list.some(item => item.name === "ComicInfo.xml")) {
    const comicInfo = await sh(`7z e -so "${archivesMountPath + '/' + archive}" "ComicInfo.xml" | tee`, true)
    if (!comicInfo.stderr && comicInfo.stdout) {
      const xml = comicInfo.stdout
      parseString(xml, (err, result) => {
        info = {
          series: result.ComicInfo.Series ? result.ComicInfo.Series[0]: '',
          number: result.ComicInfo.Number ? result.ComicInfo.Number[0]: '',
          summary: result.ComicInfo.Summary ? result.ComicInfo.Summary[0]: '',
          writer: result.ComicInfo.Writer ? result.ComicInfo.Writer[0]: '',
          coverArtist: result.ComicInfo.CoverArtist ? result.ComicInfo.CoverArtist[0]: '',
          penciller: result.ComicInfo.Penciller ? result.ComicInfo.Penciller[0]: '',
        }
      })
    }
  }
  return info
}


module.exports = {
  Query: {
    read: async (_, { book }, { $moleculer }, ___) => {
      $moleculer.logger.info('Query - read', book)
      try {
        const files = await getArchiveList(archivesMountPath + '/' + book)
        const rows = files
          .filter(file => path.extname(file.name).toLowerCase() !== '.xml')
          .map(function (file) { return {name: file.name, image: `/images?archive=${encodeURIComponent(book)}&file=${encodeURIComponent(file.name)}`}; })
        const re = /\D/g
        rows.forEach(r => {
          r.name = r.name.padStart(9, '0')
        })
        rows.sort((a, b) => parseInt(a.name.replace(re, ''), 10) - parseInt(b.name.replace(re, ''), 10))
        return {
          rows,
          total: rows.length
        }
      } catch (e) {
        console.log(e);
        return {}
      }
    },
    browse: async (_, { directory = '', page = 1, pageSize = 10 }, { $moleculer }, ___) => {
      $moleculer.logger.info('Query - browse', directory, page, pageSize)
      try {
        const folders = await sh(`ls -p '${archivesMountPath + '/' + directory}' | grep -v ".pdf" | grep -v ".txt" | egrep '/$' | sort -n`, true)
        const files = await sh(`ls -p '${archivesMountPath + '/' + directory}' | grep -v ".pdf" | grep -v ".txt" | egrep -v '/$' | sort -n`, true)

        let rows = initial(folders.stdout.split('\n'))
          .map(function (item) { return {name: item.replace(archivesMountPath + '/', ''), type: `folder`}; })
          .concat(initial(files.stdout.split('\n'))
            .map(function (item) { return {name: item, type: `file`}; }))

        const _page = (parseInt(page) - 1) >= 0 ? parseInt(page) - 1 : 0
        const _pageSize = (parseInt(pageSize)) >= 0 ? parseInt(pageSize) : 1
        const total = rows.length
        const totalPages = total / _pageSize
        rows = rows.slice(_page * _pageSize, _page * _pageSize + _pageSize)

        const foldersToKeep = rows.filter(row => 'folder' === row.type)
        const filesToSearch = rows.filter(row => 'file' === row.type).map(row => directory + row.name)

        rows = 0 < filesToSearch.length ? filesToSearch.map(file => { return {name: file, type: `file`}; }) : []

        for (let i = 0; i < rows.length; i++) {
          const cover = await getCover(rows[i].name)
          rows[i] = {
            name: path.basename(rows[i].name),
            type: 'file',
            cover: `/images?archive=${encodeURIComponent(rows[i].name)}&file=${encodeURIComponent(cover)}`, // Returns the first file from the archive sorted alphabetically
            info: await getComicInfo(rows[i].name), // Returns the ComicInfo.xml file content from the archive if it exists
            path: archivesMountPath + '/' + rows[i].name
          };
        }

        rows = foldersToKeep.concat(rows)

        rows.sort((rowA, rowB) => {
          if (rowA.name.toLowerCase() > rowB.name.toLowerCase()) {
            return 1;
          }
          if (rowA.name.toLowerCase() < rowB.name.toLowerCase()) {
            return -1;
          }
          return 0;
        })

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
    search: async (_, { query = '', page = 1, pageSize = 10 }, { $moleculer }, ___) => {
      $moleculer.logger.info('Query - search', query, page, pageSize)
      try {
        const folders = await sh(`find ${archivesMountPath} -iname "*${query}*" -type d |sort -n`, true)
        const files = await sh(`find ${archivesMountPath} -iname "*${query}*" -type f |sort -n`, true)

        let rows = initial(folders.stdout.split('\n'))
          .map(function (item) { return {name: item.replace(archivesMountPath + '/', '') + '/', type: `folder`}; })
          .concat(initial(files.stdout.split('\n'))
            .map(function (item) { return {name: item.replace(archivesMountPath + '/', ''), type: `file`}; }))

        const _page = (parseInt(page) - 1) >= 0 ? parseInt(page) - 1 : 0
        const _pageSize = (parseInt(pageSize)) >= 0 ? parseInt(pageSize) : 1
        const total = rows.length
        const totalPages = total / _pageSize
        rows = rows.slice(_page * _pageSize, _page * _pageSize + _pageSize);

        const foldersToKeep = rows.filter(row => 'folder' === row.type)
        const filesToSearch = uniqBy(rows.filter(row => 'file' === row.type).map(row => row.name), path.basename)

        rows = 0 < filesToSearch.length ? filesToSearch.map(file => { return {name: file, type: `file`}; }) : []

        for (let i = 0; i < rows.length; i++) {
          const cover = await getCover(rows[i].name)
          rows[i] = {
            name: path.basename(rows[i].name),
            type: 'file',
            cover: `/images?archive=${encodeURIComponent(rows[i].name)}&file=${encodeURIComponent(cover)}`, // Returns the first file from the archive sorted alphabetically
            info: await getComicInfo(rows[i].name), // Returns the ComicInfo.xml file content from the archive if it exists
            path: rows[i].name
          };
        }

        rows = foldersToKeep.concat(rows)

        rows.sort(function (rowA, rowB) {
          if (rowA.name.toLowerCase() > rowB.name.toLowerCase()) {
            return 1;
          }
          if (rowA.name.toLowerCase() < rowB.name.toLowerCase()) {
            return -1;
          }
          return 0;
        })

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
