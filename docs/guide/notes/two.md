# 前言

这里主要通过以下两种插件来实现微前端初步测试的：

1、 <a target=“_blank” href="https://github.com/systemjs/systemjs">SystemJs</a>

首先是我们的SystemJS，它提供通用的模块导入途径，支持传统模块和ES6的模块。 SystemJs有两个版本，6.x版本是在浏览器中使用的，0.21版本的是在浏览器和node环境中使用的，两者的使用方式不同。在微服务中主要充当加载器的角色。

2、 <a target=“_blank” href="https://single-spa.js.org/docs/getting-started-overview.html">single-spa</a>

single-spa是一个在前端应用程序中将多个javascript应用集合在一起的框架。主要充当包装器的角色。

# single-spa简单介绍

在微前端介绍部分就已经提过了`single-spa`，在这里就简单的引用一下最好理解的一个说法：

在娘胎里，熊大、熊二、熊三...熊n 都是熊妈妈的宝宝。做b超时都能看到各个熊宝宝的表现和各自的行为，但是总体上，它们都在熊妈妈的肚子里。

而熊妈妈就属于这个single-spa包装后的平台， 而每个熊宝宝都是独立的，有各自的行为状态

# single-spa的简单原理

实现一套微前端架构，可以把其分成四部分（参考：<a target=“_blank” href="https://alili.tech/archive/11052bf4/">https://alili.tech/archive/11052bf4/</a>）

加载器：也就是微前端架构的核心，主要用来调度子应用，决定何时展示哪个子应用， 可以把它理解成电源。

包装器：有了加载器，可以把现有的应用包装，使得加载器可以使用它们，它相当于电源适配器。

主应用：一般是包含所有子应用公共部分的项目—— 它相当于电器底座

子应用：众多展示在主应用内容区的应用—— 它相当于你要使用的电器

所以是这么个概念：电源(加载器)→电源适配器(包装器)→️电器底座(主应用)→️电器(子应用)️

总的来说是这样一个流程：用户访问`index.html`后，浏览器运行加载器的`js`文件，加载器去配置文件，然后注册配置文件中配置的各个子应用后，首先加载主应用(菜单等)，再通过路由判定，动态远程加载子应用。

通俗一点就是子项目中的`link/script`标签和`<div id="app"></div>`插入到主项目，而这个操作的核心就是动态加载js和css。

动态加载js我们使用的是`system.js`（SystemJS 是一个通用的模块加载器，它能在浏览器或者 `NodeJS` 上动态加载模块，并且支持 `CommonJS`、`AMD`、`全局模块对象`和 `ES6` 模块。通过使用插件，它不仅可以加载 `JavaScript`，还可以加载 `CoffeeScript`和 `TypeScript`。）,借助这个插件，我们只需要将子项目的`app.js`暴露给它即可。


# single-spa实现步骤

要实现的效果就是子项目独立开发部署，顺便还能被主项目集成。

（这里对vue熟一点，demo代码都是通过vue来编写的，当然也可以采用其它的，比如react或者原生JS等）

## 新建一个项目文件夹

`mkdir single-demo-vue` 

 `cd single-demo-vue`

 接下来的所有代码都会在该目录中完成。

## 新建子应用program1

`vue create program1`

::: warning 注意
以下所有的操作都在项目根目录/single-demo-vue/program1下完成
:::

### 配置子应用

在项目根目录下新建vue.config.js文件

```html
const package = require('./package.json')
module.exports = {
  // 告诉子应用在这个地址加载静态资源，否则会去基座应用的域名下加载
  publicPath: '//localhost:8081',
  // 开发服务器
  devServer: {
    port: 8081
  },
  configureWebpack: {
    // 导出umd格式的包，在全局对象上挂载属性package.name，基座应用需要通过这个全局对象获取一些信息，比如子应用导出的生命周期函数
    output: {
      // library的值在所有子应用中需要唯一
      library: package.name,
      libraryTarget: 'umd'
    }
  }
}
```

### 安装single-spa-vue

`npm i single-spa-vue -S`
 
single-spa-vue负责为vue应用生成通用的生命周期钩子，在子应用注册到single-spa的主应用时需要用到

### 改造入口文件

```html
// /src/main.js
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import singleSpaVue from 'single-spa-vue'
 
Vue.config.productionTip = false
 
const appOptions = {
  el: '#microApp',
  router,
  render: h => h(App)
}
 
// 支持应用独立运行、部署，不依赖于基座应用
if (!window.singleSpaNavigate) {
  delete appOptions.el
  new Vue(appOptions).$mount('#app')
}
 
// 基于基座应用，导出生命周期函数
const vueLifecycle = singleSpaVue({
  Vue,
  appOptions
})
 
export function bootstrap (props) {
  console.log('program1 bootstrap')
  return vueLifecycle.bootstrap(() => {})
}
 
export function mount (props) {
  console.log('program1 mount')
  return vueLifecycle.mount(() => {})
}
 
export function unmount (props) {
  console.log('program1 unmount')
  return vueLifecycle.unmount(() => {})
}
```
### 更改视图文件

```html
<!-- /views/Home.vue -->
<template>
  <div class="home">
    <h1>program1 home page</h1>
  </div>
</template>
```
 
```html
<!-- /views/About.vue -->
<template>
  <div class="about">
    <h1>program1 about page</h1>
  </div>
</template>
```

### 环境配置文件

`.env`
应用独立运行时的开发环境配置

```html
NODE_ENV=development
VUE_APP_BASE_URL=/
```
 
`.env.micro`
作为子应用运行时的开发环境配置

```html
NODE_ENV=development
VUE_APP_BASE_URL=/program1
```
 
`.env.buildMicro`
作为子应用构建生产环境bundle时的环境配置，但这里的NODE_ENV为development，而不是production，是为了方便，这个方便其实single-spa带来的弊端（js entry的弊端）

```html
NODE_ENV=development
VUE_APP_BASE_URL=/program1
```

### 修改路由文件

```html

// /src/router/index.js
// ...
const router = new VueRouter({
  mode: 'history',
  // 通过环境变量来配置路由的 base url
  base: process.env.VUE_APP_BASE_URL,
  routes
})
// ...
```

### 修改package.json中的script

```html
{
  "name": "program1",
  // ...
  "scripts": {
    // 独立运行
    "serve": "vue-cli-service serve",
    // 作为子应用运行
    "serve:micro": "vue-cli-service serve --mode micro",
    // 构建子应用
    "build": "vue-cli-service build --mode buildMicro"
  },
    // ...
}
```

### 启动子应用program1

program1独立运行

`npm run serve`

作为子应用运行（会在pathname的开头加了/program1前缀）

`npm run serve:micro`

作为独立应用访问

![](/images/pic03.png)

## 创建子应用program2

在/single-demo-vue目录下新建子应用program2，步骤同program1，只需把过程中出现的'program1'字样改成'program2'即可，vue.config.js中的8081改成8082`

启动应用program2，作为独立应用访问

![](/images/pic04.png)

## 新建主应用

创建一个主应用root-html-file，这个主应用只需要简单的起一个服务访问静态资源即可。

`vue create root-html-file`

::: warning 注意
以下所有的操作都在项目根目录/single-spa-vue/root-html-file下完成
:::

### 安装single-spa

`npm i single-spa -S`

### 入口文件

```html
// src/main.js
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import { registerApplication, start } from 'single-spa'
 
Vue.config.productionTip = false
 
// 远程加载子应用
function createScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.onload = resolve
    script.onerror = reject
    const firstScript = document.getElementsByTagName('script')[0]
    firstScript.parentNode.insertBefore(script, firstScript)
  })
}
 
// 记载函数，返回一个 promise
function loadApp(url, globalVar) {
  // 支持远程加载子应用
  return async () => {
    await createScript(url + '/js/chunk-vendors.js')
    await createScript(url + '/js/app.js')
    // 这里的return很重要，需要从这个全局对象中拿到子应用暴露出来的生命周期函数
    return window[globalVar]
  }
}
 
// 子应用列表
const apps = [
  {
    // 子应用名称
    name: 'program1',
    // 子应用加载函数，是一个promise
    app: loadApp('http://localhost:8081', 'program1'),
    // 当路由满足条件时（返回true），激活（挂载）子应用
    activeWhen: location => location.pathname.startsWith('/program1'),
    // 传递给子应用的对象
    customProps: {}
  },
  {
    name: 'program2',
    app: loadApp('http://localhost:8082', 'program2'),
    activeWhen: location => location.pathname.startsWith('/program2'),
    customProps: {}
  },
]
 
// 注册子应用
for (let i = apps.length - 1; i >= 0; i--) {
  registerApplication(apps[i])
}
 
new Vue({
  router,
  mounted() {
    // 启动
    start()
  },
  render: h => h(App)
}).$mount('#app')
```
### App.vue

```html
<template>
  <div id="app">
    <div id="nav">
      <router-link to="/program1">program1</router-link> |
      <router-link to="/program2">program2</router-link>
    </div>
    <!-- 子应用容器 -->
    <div id = "microApp">
      <router-view/>
    </div>
  </div>
</template>
 
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
 
#nav {
  padding: 30px;
}
 
#nav a {
  font-weight: bold;
  color: #2c3e50;
}
 
#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
```
### 路由

```html
import Vue from 'vue'
import VueRouter from 'vue-router'
 
Vue.use(VueRouter)
 
const routes = []
 
const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})
 
export default router
```

## 启动主应用

`npm run serve`

![](/images/pic06.png)
![](/images/pic05.png)