Vue.component('com-header', {
	template: 
	`
	  <div class="page-header">
	    <div class="page-header__inner">
	      <h1 class="logo"><a href="index.html">季路学旅</a></h1>
	      <h2 class="desc">亞洲青少年素質教育營隊</h2>
	      <ul class="links" :class="{ 'is-open': isOpen }" @click="isOpen = !isOpen">
	        <li class="item" :class="getNavClass(item)" v-for="item in navigator" :key="item.name"><a :href="item.path">{{ item.label }}</a></li>
	      </ul>
	    </div>
	  </div>
	`,
	data() {
		return {
			isOpen: false,
			navigator: [
				{
					name: 'about',
					path: 'about.html',
					label: '關於我們'
				},
				{
					name: 'plan',
					path: 'plan.html',
					label: '學旅方案'
				},
				{
					name: 'cases',
					path: 'cases.html',
					label: '學旅大小事'
				},
				{
					name: 'workshop',
					path: 'workshop.html',
					label: '培訓工作坊'
				},
				{
					type: 'button',
					name: 'contact',
					path: 'contact.html',
					label: '聯繫我們'
				}
			]
			
		}
	},
	methods: {
		getNavClass(item) {
			const pathname = window.location.pathname.split('/')
			const path = pathname[pathname.length - 1]
			const klass = []

			if (item.path === path) {
				klass.push('active')
			}

			if (item.type) {
				klass.push('item-' + item.type)
			}

			return klass
		}
	}
})