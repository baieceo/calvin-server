(function () {
	var app = new Vue({
		el: '#app',
		data() {
			return {
				loading: false,
				query: {
					title: '',
					id: ''
				},
				formData: {
					id: '',
					name: '蛋蛋',
					email: '55915577@qq.com',
					mobile: '13581518105',
					wechat: '13581519105',
					grade: '1年级',
					content: '<script>alert(1)</script>'
				},
				formRules: {
					name: [
						{ required: true, message: '请输入姓名' }
					],
					email: [
						{ required: true, message: '请输入电子邮箱' }
					],
					mobile: [
						{ required: true, message: '请输入联络手机' }
					],
					wechat: [
						{ required: true, message: '请输入微信' }
					],
					grade: [
						{ required: true, message: '请输入年级' }
					],
					content: [
						{ required: true, message: '请输入联系内容' }
					]
				},
				message: ''
			}
		},
		created() {
			var self = this

			window.location.search.replace(/([^=&?]+)=([^=&?]+)/ig, function ($0, key, val) {
				self.query[key] = decodeURIComponent(val)
			})

			this.formData.id = this.query.id
		},
		mounted() {
			this.initForm()
		},
		methods: {
			initForm() {
				const refs = this.$refs['form']
				const rulesName = refs.getAttribute('rules')

				Object.entries(this[rulesName]).forEach(([key, item]) => {
					if (item.some(rule => rule.required)) {
						refs.querySelector('[prop=' + key + ']').classList.add('is-required')
					}
				})
			},
			validate() {
				const refs = this.$refs['form']
				const rulesName = refs.getAttribute('rules')
				const modelName = refs.getAttribute('model')
				const refsProps = refs.querySelectorAll('[prop]')
				const props = Array.from(refsProps).map(e => e.getAttribute('prop'))
				let failure = false

				props.forEach(name => {
					const rules = this[rulesName][name]

					rules.forEach(rule => {
						const element = Array.from(refsProps).find(el => el.getAttribute('prop') === name)
						const error = element.querySelector('.form-item__error')
						const errors = []

						if (rule.required && !this[modelName][name]) {
							errors.push(rule.message)
						}

						if (errors.length) {
							failure = true
							error.innerHTML = errors.shift()
						} else {
							error.innerHTML = ''
						}
					})
				})

				if (failure) {
					console.log('failure')
				} else {
					console.log('success')

					this.postData()
				}
			},
			postData() {
				let self = this

				this.loading = true

				let url = ''

				if (this.formData.id) {
					url = 'http://localhost:3000/api/v1/apply/create'

					this.formData.apply_id = this.formData.id
				} else {
					url = 'http://localhost:3000/api/v1/message/create'
				}

				axios.post(url, this.formData)
					.then(function (response) {
						if (!response.data.code) {
							self.message = ''
							self.loading = false

							let title = encodeURIComponent('留言成功')

							if (self.formData.id) {
								title = `报名${self.query.title}成功`
							} else {
								title = '留言成功'
							}

							title = encodeURIComponent(title)

							let content = encodeURIComponent('感谢您的支持，我们会尽快答复您')

							window.location.href = `result.html?title=${title}&content=${content}`
						} else {
							self.message = response.data.message
							self.loading = false
						}
					})
					.catch(function (error) {
						self.loading = false
					})
			}
		}
	})
})()