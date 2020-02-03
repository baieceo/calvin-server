(function () {
	var app = new Vue({
		el: '#app',
		data() {
			return {
				swiperData: [],
				swiperIndex: 0,
				swiperInterval: 10000,
				groupData: [],
				groupIndex: 0
			}
		},
		created() {
			this.fetchData()
		},
		mounted() {
			this.swiperPlay()
		},
		methods: {
			fetchData() {
				axios.all([
					axios.get('http://localhost:3000/cms/type/image-list/1000001574330955256.json'),
					axios.get('http://localhost:3000/cms/type/tour-area/2000001574334071864.json')
				])
  				.then(axios.spread((bannerRes, tourRes) => {
  					const bannerImages =  bannerRes.data.props.find(i => i.key === 'images').value

  					this.swiperData = bannerImages.map(i => ({ img: i }))

  					const idList = tourRes.data.props.find(i => i.key === 'id-list').value
  					const tourImageList = tourRes.data.props.find(i => i.key === 'web-image-list').value
  					const tourTitleList = tourRes.data.props.find(i => i.key === 'title-list').value
  					const tourSummaryList = tourRes.data.props.find(i => i.key === 'summary-list').value

  					this.groupData = tourImageList.map((i, n) => ({
  						id: idList[n],
  						url: `contact.html?id=${idList[n]}&title=${tourTitleList[n]}`,
  						img: tourImageList[n],
  						title: tourTitleList[n],
  						desc: tourSummaryList[n]
  					}))
  				}))
			},

			swiperPlay() {
				this.swiperIndex++

				if (this.swiperIndex >= this.swiperData.length) this.swiperIndex = 0

				setTimeout(this.swiperPlay, this.swiperInterval)
			}
		}
	})
})()