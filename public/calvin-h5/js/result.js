(function () {
	var app = new Vue({
		el: '#app',
		data() {
			return {
				query: {
					title: '',
					desc: ''
				}
			}
		},
		created() {
			var self = this

			window.location.search.replace(/([^=&?]+)=([^=&?]+)/ig, function ($0, key, val) {
				self.query[key] = decodeURIComponent(val)
			})
		},
		methods: {
			
		}
	})
})()