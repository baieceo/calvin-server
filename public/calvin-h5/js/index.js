(function () {
	var app = new Vue({
		el: '#app',
		data() {
			return {
				swiperData: [
					{
						url: '/',
						img: './images/index/index-1.jpg'
					},
					{
						url: '/',
						img: './images/index/index-1-1.png'
					}
				],
				swiperIndex: 0,
				swiperInterval: 10000,
				groupData: [
					{
						id: 1,
						url: '/',
						img: './images/index/index-6.jpg',
						title: '台北故宮',
						desc: '中国三大博物馆之一，中国艺术史和汉学研究重镇，孩子将在此地，以天马行空的文字，将中国三千年历史国宝写进他笔下的创意作品。'
					},
					{
						id: 2,
						url: '/',
						img: './images/index/index-7.png',
						title: '台北故宮7',
						desc: '中国三大博物馆之一，中国艺术史和汉学研究重镇，孩子将在此地，以天马行空的文字，将中国三千年历史国宝写进他笔下的创意作品。'
					},
					{
						id: 3,
						url: '/',
						img: './images/index/index-8.png',
						title: '台北故宮8',
						desc: '中国三大博物馆之一，中国艺术史和汉学研究重镇，孩子将在此地，以天马行空的文字，将中国三千年历史国宝写进他笔下的创意作品。'
					},
					{
						id: 4,
						url: '/',
						img: './images/index/index-9.png',
						title: '台北故宮9',
						desc: '中国三大博物馆之一，中国艺术史和汉学研究重镇，孩子将在此地，以天马行空的文字，将中国三千年历史国宝写进他笔下的创意作品。'
					},
					{
						id: 5,
						url: '/',
						img: './images/index/index-10.png',
						title: '台北故宮10',
						desc: '中国三大博物馆之一，中国艺术史和汉学研究重镇，孩子将在此地，以天马行空的文字，将中国三千年历史国宝写进他笔下的创意作品。'
					},
					{
						id: 6,
						url: '/',
						img: './images/index/index-6.jpg',
						title: '台北故宮',
						desc: '中国三大博物馆之一，中国艺术史和汉学研究重镇，孩子将在此地，以天马行空的文字，将中国三千年历史国宝写进他笔下的创意作品。'
					}
				],
				groupIndex: 0
			}
		},
		mounted() {
			this.swiperPlay()
		},
		methods: {
			swiperPlay() {
				this.swiperIndex++

				if (this.swiperIndex >= this.swiperData.length) this.swiperIndex = 0

				setTimeout(this.swiperPlay, this.swiperInterval)
			}
		}
	})
})()