module.exports = {
    title: '微前端文档',  // 文档标题，左上角显示
    description: '微前端文档描述',
    base: '/single-web/', // 这里写你的仓库名称
    head: [
        ['link', { rel: 'shortcut icon', type: "image/x-icon", href: `/jyjwebdocs/favicon.ico` }]
    ], //这里配置你的网页头部信息等
    themeConfig: {
        nav: [
            {
                text: '指南', link: '/guide/'
            },
            {
                text: '推荐',
                items: [
                    {
                        text: '插件',
                        items: [
                            {text: 'SystemJs', link: 'https://github.com/systemjs/systemjs'},
                            {text: 'single-spa', link: 'https://single-spa.js.org/'},
                            {text: 'qiankun', link: 'https://qiankun.umijs.org/zh/'},
                        ]
                    },
                ]
            }
        ],
        /**
         * 设置侧边栏最大深度
         * 一般是以单个md文件中的 # ## ### #### 这几个标题文字为锚点自动生成导航
         * **/
        sidebarDepth: 4,
        // 设置侧边栏内容
        sidebar: require('./sidebar'),
    }
}