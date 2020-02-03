(function () {
	var app = new Vue({
		el: '#app',
		data() {
			return {
				formData: {
					name: null,
					email: null,
					phone: null,
					wechat: null,
					grade: null,
					content: null
				},
				formRules: {
					name: [
						{ required: true, message: '请输入姓名' }
					],
					email: [
						{ required: true, message: '请输入电子邮箱' }
					],
					phone: [
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
				}
			}
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
				}
			}
		}
	})
})()