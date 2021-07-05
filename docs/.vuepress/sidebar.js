module.exports = [
	{
		title: '关于微前端',
		collapsable: true,  // 是否具有展开收起功能
		children: [ // 这个是根据自己的需求来订，对应自己在docs下的文件夹名，默认首页是README.md
			'/guide/notes/one',
		]  
	},
	{
		title: '关于single-spa',
		collapsable: true,  // 是否具有展开收起功能
		children: [ // 这个是根据自己的需求来订，对应自己在docs下的文件夹名，默认首页是README.md
			'/guide/notes/two',
		]  
	},
	{
		title: 'single-spa-vue源码解析',
		collapsable: true,  // 是否具有展开收起功能
		children: [ // 这个是根据自己的需求来订，对应自己在docs下的文件夹名，默认首页是README.md
			'/guide/notes/three',
		]  
	}
]
