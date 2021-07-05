# single-spa-vue 源码分析

single-spa-vue负责为vue应用生成通用的生命周期钩子，这些钩子函数负责子应用的初始化、挂载、更新（数据）、卸载。

```html
import "css.escape";
 
const defaultOpts = {
  // required opts
  Vue: null,
  appOptions: null,
  template: null
};
 
/**
 * 判断参数的合法性
 * 返回生命周期函数，其中的mount方法负责实例化子应用，update方法提供了基座应用和子应用通信的机会，unmount卸载子应用，bootstrap感觉没啥用
 * @param {*} userOpts = {
 *    Vue,
 *    appOptions: {
 *      el: '#id',
 *      store,
 *      router,
 *      render: h => h(App)
 *    } 
 * }
 * return 四个生命周期函数组成的对象
 */
export default function singleSpaVue(userOpts) {
  // object
  if (typeof userOpts !== "object") {
    throw new Error(`single-spa-vue requires a configuration object`);
  }
 
  // 合并用户选项和默认选项
  const opts = {
    ...defaultOpts,
    ...userOpts
  };
 
  // Vue构造函数
  if (!opts.Vue) {
    throw Error("single-spa-vue must be passed opts.Vue");
  }
 
  // appOptions
  if (!opts.appOptions) {
    throw Error("single-spa-vue must be passed opts.appOptions");
  }
 
  // el选择器
  if (
    opts.appOptions.el &&
    typeof opts.appOptions.el !== "string" &&
    !(opts.appOptions.el instanceof HTMLElement)
  ) {
    throw Error(
      `single-spa-vue: appOptions.el must be a string CSS selector, an HTMLElement, or not provided at all. Was given ${typeof opts
        .appOptions.el}`
    );
  }
 
  // Just a shared object to store the mounted object state
  // key - name of single-spa app, since it is unique
  let mountedInstances = {};
 
  /**
   * 返回一个对象，每个属性都是一个生命周期函数
   */
  return {
    bootstrap: bootstrap.bind(null, opts, mountedInstances),
    mount: mount.bind(null, opts, mountedInstances),
    unmount: unmount.bind(null, opts, mountedInstances),
    update: update.bind(null, opts, mountedInstances)
  };
}
 
function bootstrap(opts) {
  if (opts.loadRootComponent) {
    return opts.loadRootComponent().then(root => (opts.rootComponent = root));
  } else {
    return Promise.resolve();
  }
}
 
/**
 * 做了三件事情：
 *  大篇幅的处理el元素
 *  然后是render函数
 *  实例化子应用
 */
function mount(opts, mountedInstances, props) {
  const instance = {};
  return Promise.resolve().then(() => {
    const appOptions = { ...opts.appOptions };
    // 可以通过props.domElement属性单独设置自应用的渲染DOM容器，当然appOptions.el必须为空
    if (props.domElement && !appOptions.el) {
      appOptions.el = props.domElement;
    }
 
    let domEl;
    if (appOptions.el) {
      if (typeof appOptions.el === "string") {
        // 子应用的DOM容器
        domEl = document.querySelector(appOptions.el);
        if (!domEl) {
          throw Error(
            `If appOptions.el is provided to single-spa-vue, the dom element must exist in the dom. Was provided as ${appOptions.el}`
          );
        }
      } else {
        // 处理DOM容器是元素的情况
        domEl = appOptions.el;
        if (!domEl.id) {
          // 设置元素ID
          domEl.id = `single-spa-application:${props.name}`;
        }
        appOptions.el = `#${CSS.escape(domEl.id)}`;
      }
    } else {
      // 当然如果没有id，这里会自动生成一个id
      const htmlId = `single-spa-application:${props.name}`;
      appOptions.el = `#${CSS.escape(htmlId)}`;
      domEl = document.getElementById(htmlId);
      if (!domEl) {
        domEl = document.createElement("div");
        domEl.id = htmlId;
        document.body.appendChild(domEl);
      }
    }
 
    appOptions.el = appOptions.el + " .single-spa-container";
 
    // single-spa-vue@>=2 always REPLACES the `el` instead of appending to it.
    // We want domEl to stick around and not be replaced. So we tell Vue to mount
    // into a container div inside of the main domEl
    if (!domEl.querySelector(".single-spa-container")) {
      const singleSpaContainer = document.createElement("div");
      singleSpaContainer.className = "single-spa-container";
      domEl.appendChild(singleSpaContainer);
    }
 
    instance.domEl = domEl;
 
    // render
    if (!appOptions.render && !appOptions.template && opts.rootComponent) {
      appOptions.render = h => h(opts.rootComponent);
    }
 
    // data
    if (!appOptions.data) {
      appOptions.data = {};
    }
 
    appOptions.data = { ...appOptions.data, ...props };
 
    // 实例化子应用
    instance.vueInstance = new opts.Vue(appOptions);
    if (instance.vueInstance.bind) {
      instance.vueInstance = instance.vueInstance.bind(instance.vueInstance);
    }
 
    mountedInstances[props.name] = instance;
 
    return instance.vueInstance;
  });
}
 
// 基座应用通过update生命周期函数可以更新子应用的属性
function update(opts, mountedInstances, props) {
  return Promise.resolve().then(() => {
    // 应用实例
    const instance = mountedInstances[props.name];
    // 所有的属性
    const data = {
      ...(opts.appOptions.data || {}),
      ...props
    };
    // 更新实例对象上的属性值，vm.test = 'xxx'
    for (let prop in data) {
      instance.vueInstance[prop] = data[prop];
    }
  });
}
 
// 调用$destroy钩子函数，销毁子应用
function unmount(opts, mountedInstances, props) {
  return Promise.resolve().then(() => {
    const instance = mountedInstances[props.name];
    instance.vueInstance.$destroy();
    instance.vueInstance.$el.innerHTML = "";
    delete instance.vueInstance;
 
    if (instance.domEl) {
      instance.domEl.innerHTML = "";
      delete instance.domEl;
    }
  });
}
```

框架内子应用的各个状态以及状态的变更过程

```html
// 实现子应用的注册、挂载、切换、卸载功能
 
/**
 * 子应用状态
 */
// 子应用注册以后的初始状态
const NOT_LOADED = 'NOT_LOADED'
// 表示正在加载子应用源代码
const LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE'
// 执行完 app.loadApp，即子应用加载完以后的状态
const NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED'
// 正在初始化
const BOOTSTRAPPING = 'BOOTSTRAPPING'
// 执行 app.bootstrap 之后的状态，表是初始化完成，处于未挂载的状态
const NOT_MOUNTED = 'NOT_MOUNTED'
// 正在挂载
const MOUNTING = 'MOUNTING'
// 挂载完成，app.mount 执行完毕
const MOUNTED = 'MOUNTED'
const UPDATING = 'UPDATING'
// 正在卸载
const UNMOUNTING = 'UNMOUNTING'
// 以下三种状态这里没有涉及
const UNLOADING = 'UNLOADING'
const LOAD_ERROR = 'LOAD_ERROR'
const SKIP_BECAUSE_BROKEN = 'SKIP_BECAUSE_BROKEN'
 
// 存放所有的子应用
const apps = []
 
/**
 * 注册子应用
 * @param {*} appConfig = {
 *    name: '',
 *    app: promise function,
 *    activeWhen: location => location.pathname.startsWith(path),
 *    customProps: {}
 * }
 */
export function registerApplication (appConfig) {
  apps.push(Object.assign({}, appConfig, { status: NOT_LOADED }))
  reroute()
}
 
// 启动
let isStarted = false
export function start () {
  isStarted = true
}
 
function reroute () {
  // 三类 app
  const { appsToLoad, appsToMount, appsToUnmount } = getAppChanges()
  if (isStarted) {
    performAppChanges()
  } else {
    loadApps()
  }
 
  function loadApps () {
    appsToLoad.map(toLoad)
  }
 
  function performAppChanges () {
    // 卸载
    appsToUnmount.map(toUnmount)
    // 初始化 + 挂载
    appsToMount.map(tryToBoostrapAndMount)
  }
}
 
/**
 * 挂载应用
 * @param {*} app 
 */
async function tryToBoostrapAndMount(app) {
  if (shouldBeActive(app)) {
    // 正在初始化
    app.status = BOOTSTRAPPING
    // 初始化
    await app.bootstrap
    // 初始化完成
    app.status = NOT_MOUNTED
    // 第二次判断是为了防止中途用户切换路由
    if (shouldBeActive(app)) {
      // 正在挂载
      app.status = MOUNTING
      // 挂载
      await app.mount()
      // 挂载完成
      app.status = MOUNTED
    }
  }
}
 
/**
 * 卸载应用
 * @param {*} app 
 */
async function toUnmount (app) {
  if (app.status !== 'MOUNTED') return app
  // 更新状态为正在卸载
  app.status = MOUNTING
  // 执行卸载
  await app.unmount()
  // 卸载完成
  app.status = NOT_MOUNTED
  return app
}
 
/**
 * 加载子应用
 * @param {*} app 
 */
async function toLoad (app) {
  if (app.status !== NOT_LOADED) return app
  // 更改状态为正在加载
  app.status = LOADING_SOURCE_CODE
  // 加载 app
  const res = await app.app()
  // 加载完成
  app.status = NOT_BOOTSTRAPPED
  // 将子应用导出的生命周期函数挂载到 app 对象上
  app.bootstrap = res.bootstrap
  app.mount = res.mount
  app.unmount = res.unmount
  app.unload = res.unload
  // 加载完以后执行 reroute 尝试挂载
  reroute()
  return app
}
 
/**
 * 将所有的子应用分为三大类，待加载、待挂载、待卸载
 */
function getAppChanges () {
  const appsToLoad = [],
    appsToMount = [],
    appsToUnmount = []
  
  apps.forEach(app => {
    switch (app.status) {
      // 待加载
      case NOT_LOADED:
        appsToLoad.push(app)
        break
      // 初始化 + 挂载
      case NOT_BOOTSTRAPPED:
      case NOT_MOUNTED:
        if (shouldBeActive(app)) {
          appsToMount.push(app)
        } 
        break
      // 待卸载
      case MOUNTED:
        if (!shouldBeActive(app)) {
          appsToUnmount.push(app)
        }
        break
    }
  })
  return { appsToLoad, appsToMount, appsToUnmount }
}
 
/**
 * 应用需要激活吗 ？
 * @param {*} app 
 * return true or false
 */
function shouldBeActive (app) {
  try {
    return app.activeWhen(window.location)
  } catch (err) {
    console.error('shouldBeActive function error', err);
    return false
  }
}
 
// 让子应用判断自己是否运行在基座应用中
window.singleSpaNavigate = true
// 监听路由
window.addEventListener('hashchange', reroute)
window.history.pushState = patchedUpdateState(window.history.pushState)
window.history.replaceState = patchedUpdateState(window.history.replaceState)
/**
 * 装饰器，增强 pushState 和 replaceState 方法
 * @param {*} updateState 
 */
function patchedUpdateState (updateState) {
  return function (...args) {
    // 当前url
    const urlBefore = window.location.href;
    // pushState or replaceState 的执行结果
    const result = Reflect.apply(updateState, this, args)
    // 执行updateState之后的url
    const urlAfter = window.location.href
    if (urlBefore !== urlAfter) {
      reroute()
    }
    return result
  }
}
```
 