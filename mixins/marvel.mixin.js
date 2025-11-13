module.exports = {
  name: 'marvel',
  settings: {
		marvel: {
				publicUrl: process.env.APP_MARVEL_PUBLIC_URL || 'https://bifrost.marvel.com',
        publicUri: process.env.APP_MARVEL_PUBLIC_URI || '/v1/catalog',
		}
  },
  methods: {
		async listComics(results) {
			const comics = []
			for (const result of results) {
				comics.push({ 
					comicId: result.id, 
					title: result.title, 
					thumbnail: { path: result.metadata.image_url, extension: result.metadata.image_extension }, 
					metadata: result.metadata
				})
			}
			return comics
		},
  },
  async created () {
		this.ttl = 30
		this.searchLimit = 10
		this.searchOffset = 0
  },
}
