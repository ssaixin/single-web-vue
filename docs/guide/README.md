# 网站前端开发指北

## 快速导航

<TOC :include-level="[2, 3]" />

## 前言

网站后台开发，前端部分日常操作总结，帮助大家开发通用功能，和处理常见问题（ps: 默认谷歌浏览器）

## 网页布局

非弹窗页的布局结构分为2类：

1、带左侧树形结构的
![](/Blog/images/左侧有树结构.png)

2、普通结构（无左侧树形）
![](/Blog/images/普通结构.png)



### 带左侧树形结构

```html
<div id="ui_layout" class="mini-layout" style="width:100%;height:100%;">
    <div region="west" showHeader="false" width="240" splitSize="6" showSplitIcon="true" maxWidth="500"
         style="border:none; background:#F6FAFD; border-right: solid 1px #e5e5e5;">
        <div style="padding:5px; overflow: hidden;">
            <ul id="organ_catalog_tree" class="ztree"></ul>
        </div>
    </div>

    <div region="center" style="border:none; overflow: auto; border-left: solid 1px #e5e5e5;">
        <div id="主体内容id"></div>
    </div>
</div>
```

` splitSize="6" showSplitIcon="true"`是成对出现的属性，表示带拖拽按钮宽度为6

` splitSize="0"`表示不可拖拽

` maxWidth="500"`表示可展开最大宽度

------

如何渲染主体内容呢？这个带树形的一般都是通过点击树节点调用方法载页面。具体调用方法如下：

```javascript
// 加载内容
var getContentApp = function (url, options) {
    return App.getContentAjax(url, options).done(function (res) {
        $("#主体内容id").html(res);
    });
}

// 传递参数
App.getContentAjax(url).done(function (res) {
	$('#主体内容id').html('<script>var _govYearData = ' + data + ';<\/script>' + res);
});
```

因为`getContentApp`函数返回的是ajax对象，所以可以接着链式调用`getContentApp(url).done(function(){ xxx})`

**主体内容中存在添加/编辑页时（非弹窗形式），它的打开方式依旧是`getContentApp(url)`**

### 普通结构（无左侧树形）

```html
<div id="ui_layout" class="mini-layout" style="width:100%;height:100%;">
    <div region="center" style="border:none; overflow: auto;">
        <div class="portlet light">
            <div class="portlet-body">
                <!--搜索部分-->
                <div class="table-toolbar">
                    <div class="row">
                        <!--左侧按钮区-->
                        <div class="col-md-4">
                            <div class="btn-group">
                                <button type="button" class="btn btn-default btn-search" onclick="add()">添加</button>
                            </div>
                        </div>
                        <!--右侧form查询区-->
                        <div class="col-md-8">
                            <form class="form-inline tr" role="form">

                            </form>
                        </div>
                    </div>
                </div>

                <!--表格or列表区-->
                <div id="page_cont">

                </div>
            </div>
        </div>
    </div>
</div>
```

上面是一个健全的普通页面布局，有的时候出现页面超出却没有滚动条，就是你的之前使用的页面布局方式有问题导致的。

**普通结构中存在添加/编辑页时（非弹窗形式），它的打开方式是` App.getContentHtml(url);`即可**

::: warning 注意
这两类布局方式，在js加载时都需要` mini.parse();`
:::


## 菜单跳转

想在首页跳转到特点的二级菜单下
![](/Blog/images/菜单定位.png)

`App.setSidebarMenuActive(Ls.base64.encode("二级菜单data-id"));`

此方法只能对二级非父级菜单有效

## 弹窗页

### 弹窗页调用方式

1.通过url打开弹窗页

```javascript
// url 弹窗地址 弹窗宽和高
Ls.openWin(url, '1000px', '500px', {
    maxable: true, // 是否有最大化按钮
    isDefaultMax: true, // 是否默认最大化
    id: '', // 弹窗id
    title: '', // 弹窗标题名
    close: function (d) { // 关闭弹窗后的回调函数
        // 存在返回值时，再触发刷新加载等事件
        if (d) {

        }
    },
    ok: function () { // 弹窗底部确认按钮事件 （不推荐使用这种方式， 弹窗页里的提交事件就在弹窗页里完成）
        var iframe = this.iframe.contentWindow; // 获取弹窗对象
        if (!iframe.document.body) {
            return false;
        }
        iframe.$("#" + iframe.cur.id).submit(); // 弹窗里的提交事件
        return false;
    }
});
```

2.通过传入HTMLElement打开弹窗 （适用于简单的内容的）

```javascript
cur.backWin = Ls.openWin({
    content: document.getElementById('comment-wrap'), // dom元素id，在当前页将结构写好传入
    id: 'comment',
    title: '评论',
    width: '400px',
    height: '200px',
    ok: function () {
        save();
        return false;
    }
});

 function save() {
     cur.backWin.close();
 }
```

### 弹窗页参数接受、定义底部按钮、关闭事件

```javascript
var cur = {
    api: Ls.getWin.api, // 弹窗对象绑定的方法api
    win: Ls.getWin.win, // 获取父级页面的Windows对象
    dialog: Ls.getWin.dialog, // 子窗口数据读取父窗口传输的数据 （不常用）
    params: {
        id: Ls.url.get('id')
    }
};

```

读取url上的参数 (也可以后端直接渲染得到)

```javascript
父页面
url + '?id=1&pid=0'

弹窗页
Ls.url.get('id')  Ls.url.get('pid')
```



弹窗底部按钮定义

```javascript
 cur.api.button(
     {
         id: 'save',
         className: 'btn-save',
         focus: true,
         name: '保存',
         callback: function () {
             save(); // 在保存完之后再执行关闭
             return false; // return false 阻止弹窗关闭
         }
     },
     {
         id: 'save2',
         className: 'btn-submit',
         name: '保存并发布',
         callback: function () {
             Publish();
             return false;
         }
     },
     {
         id: 'back',
         className: 'btn-cancel',
         name: '取消',
     }
 );
```

关闭事件

```javascript
 // 直接关闭
Ls.winClose();

// 关闭并传递数据or状态
cur.api.close(xxx);

这样Ls.openWin中的close回调函数就接受到参数了，根据参数父页面处理刷新加载等操作
```

dialog的使用 

```javascript
父页面
cur.dialog.data('sysData', data); // 定义个变量，传入数据
Ls.openWin(url, '1000px', '500px', {
    close: function (d) {
        cur.dialog.removeData('sysData'); // 销毁这个变量
        if (d) {

        }
    }
});

弹窗页
var data = cur.dialog.data('sysData'); // 获取到数据
```

### 弹窗页布局

```html
<!--公用头部必须-->
#parse("_page_layout/_header.vm")
<body class="page-body-white">
<div class="portlet light">
    <div class="portlet-body form">
        <!--主体内容-->
        <form role="form">

        </form>
    </div>
</div>
</body>
<!--公用顶部必须-->
#parse("_page_layout/_footer.vm")
<script>

</script>
```

### 自定义弹窗

业务需要提供了一个简易的弹窗
![](/Blog/images/自定义弹窗.png)

最简单的调用方式，传入text属性

```javascript
indexMgr._selfWin({text: '确定提交？'}, function(){
    // 点击确定时触发
    todo()
    this.close();
})
```

自定义内容，需要传入当前页定义好的tpl模板内容，之后 弹窗内容就展示自定义的模板

```javascript
 indexMgr._selfWin({
     width: '550px',
     height: '300px',
     title: '上报至省平台',
     text: '成功上报' + num + '个网站年报至省平台！',
     tpl: 'annual_report_submit_win'
 }, function () {
     todo();
     this.close();
 });
```

## form表单操作
![](/Blog/images/search.png)

原先的搜索和显示全部方法操作繁琐，简化搜索参数赋值操作。

### 必要的DOM结构
 **给form添加id，和参数有关的每一项input要添加name属性和参数名对应，showAll方法传入this参数**

```html
<div class="table-toolbar">
    <div class="row">
        <div class="col-md-4">

        </div>
        <div class="col-md-8">
            <form class="form-inline tr" role="form" id="departListForm">
                <input type="datetime" id="startDate" class="form-control w150" placeholder="开始时间" name="startDate"
                       onfocus="WdatePicker({dateFmt:'yyyy-MM-dd HH:mm:ss',maxDate: '#F{$dp.$D(\'endDate\')}',readOnly:true})"
                       readonly/>
                <input type="datetime" id="endDate" class="form-control w150" placeholder="结束时间" name="endDate"
                       onfocus="WdatePicker({dateFmt:'yyyy-MM-dd HH:mm:ss',minDate: '#F{$dp.$D(\'startDate\')}',readOnly:true})"
                       readonly/>
                <input class="form-control w220" id="allOrgan" type="text" placeholder="部门" name="organDn">
                <input type="text" id="keywords" name="keywords" class="form-control w140" placeholder="标题"
                       maxlength="50">
                <button type="button" class="btn btn-default btn-search" onClick="search()">搜 索</button>
                <button type="button" class="btn btn-default btn-show-all" onClick="showAll(this)">显示全部</button>
            </form>
        </div>
    </div>
</div>
```
### 定义好所有的查询参数

```javascript
var cur = {
    params: {
        endDate: '',
        endDate: '',
        keywords: '',
        organDn: '',
        dataFlag: 1
    }
};
```

### 新的调用方式

```javascript
function search() {
    _tools.setFormParams($('#form的id'), cur.params); // 将form表单的数据更新到cur.params上
    cur.grid.reload(); // 或者 getData() 此时的cur.params为最新值
}

function showAll(self) {
    self.parentNode.reset();
    search();
}
```

::: warning 注意
支持selectpage，特别复杂的form不支持
:::

## avalon数据的双向绑定

### 必要的DOM结构
给要双向绑定的父级添加ms-controller属性一般是form，input元素用ms-duplex="属性名"相互绑定

```html
<form role="form" id="oneLinePlay_form" ms-controller="oneLinePlay_form">
    <table class="table table-bordered picture-table">
        <tbody>
            <tr>
                <th>名称：</th>
                <td colspan="3">
                   <input type="text" name="title" id="title" ms-duplex="name"
                                           class="form-control" placeholder="" maxlength="20">
                </td>
               
            </tr>

            <tr>
                <th>是否开放：</th>
                <td>
                   <label class="radio-inline">
                        <input type="radio" name="isOPen" ms-duplex-string="isOPen" value="1"> 是
                    </label>
                    <label class="radio-inline">
                        <input type="radio" name="isOPen" ms-duplex-string="isOPen" value="0"> 否
                    </label>
                </td>

            </tr>

            <tr class="food">
                <th>发布日期：</th>
                <td>
                    <input type="datetime" id="publishDate" name="publishDate" ms-duplex="publishDate" class="form-control readonly" readonly/>
                </td>
            </tr>
            <tr class="food">
                <th style="vertical-align: top;">美食简介：</th>
                <td colspan="4">
                    <textarea id="content" ms-duplex="content" name="content"></textarea>
                </td>
            </tr>

        </tbody>
    </table>
</form>
```

### 定义vmId

```javascript
 var cur = {
     vmId: 'oneLinePlay_form',
 };
```

### 请求得到数据后调用initVm函数

```javascript
 function initVm(obj) { // obj 是数据对象
     obj.$id = cur.vmId;
     //如果模型已经绑定，不再绑定
     cur.vm = avalon.vmodels[obj.$id];
     if (!cur.vm) {
         cur.vm = avalon.define(obj);
     } else {
         Ls.assignVM(cur.vm, obj);
     }
     avalon.scan($('#' + cur.vmId).get(0), cur.vm);
 }
```

### 提交数据

```javascript
 var data = Ls.toJSON(cur.vm.$model);
```

### 常见错误
![avalon](/Blog/images/avalon.png)

::: warning 注意
上图这种错误90%是因为html上绑定了ms-duplex="xxx"，而数据对象里不存在xxx属性导致的；

$id 有可能会被后端直接渲染成一个变量导致报错，可以改写成 `\$id`

:::


## validator 表单验证

### 简易的方式，验证规则直接写在dom上

```html
<input name="keywords" type="text" class="txtinput" size="50" maxlength="30" data-rule="关键词:required;">

<input name="name" data-rule="required;length(~30);" data-msg-required="姓名不能为空" data-msg-length="姓名最多填写30个字符"/>

<!--自带的验证规则-->
<input name="phone" data-rule="required;mobile|tel|shortTel" data-msg-required="联系电话不能为空" />

<!--自定义的验证规则-->
<input id="search_keywords" value="" name="keyWords" type="text" placeholder="请输入检索内容" size="24" maxlength="30" data-rule="required; xxx" data-rule-xxx="[/^.*$/, '输入正确的检索内容']" data-msg-required="请输入需要查找的信息">
```

### 通过js绑定  

```javascript
   cur.form.validator({
       rules: { // 自定验证规则
           loginName: function(element) {
               return /^[a-zA-Z]\w{3,}/.test(element.value)
               || this.test(element, "mobile")
               || this.test(element, "email")
               || 'Please fill user name, phone number or E-mail';
           }
       },
       fields: { // 绑定的属性要和input的name相对应
           'title': '标题:required;length[1~250];',
           'videoName': '视频新闻路径:required;loginName;',
       },
       valid: function(form){ // 表单提交
           var me = this;
           // 提交表单之前，hold住表单，防止重复提交
           me.holdSubmit();

           Ls.ajax({
               url: url,
               data: $(form).serialize(),
               success: function(){
                   // 提交表单成功后，释放hold
                   me.holdSubmit(false);
               }
           });
       },
       msgClass: "n-top", // 提示信息位置
       timely: 2, // 触发验证方式
       ignore: ':hidden' // 隐藏的dom结构不验证
   });
```

对于同一个form表单不同情况下，验证字段不一样的情况，可以如下操作

```javascript
function setValid(type) {
    var fields = {
        'title': '名称:required;length[1~250];',
        'tel': '景区电话:required;',
    };

    if (type === 'scenic') {
        fields = {
            'title': '名称:required;length[1~250];',
            'pos': '电子地图:required;',
            'intro': '景点介绍:required;',
        };
    } else if (type === 'food') {
        fields = {
            'title': '名称:required;length[1~250];',
            'type': '美食类型:required;',
            'content': '美食简介:required;',
        };
    }

    cur.form.validator({
        fields: fields,
        msgClass: 'n-top',
        timely: 2,
        ignore: ':hidden'
    });
}

```

### 判断表单是否验证通过

```javascript
cur.form.isValid()
```

### 表单校验的触发

```javascript
cur.form.trigger("validate");

cur.form.submit();
```

## 表格grid

html结构简单说明，添加class`ls-mini-datagrid`是为了` width="100%"`的那一项在小分辨率正常显示，且有最小默认宽度，`cellStyle`可修改最小宽度。

表格中只有个项的宽度为100%，其他以数值分割大小

```html
<div id="datagrid" class="mini-datagrid ls-mini-datagrid" style="width:100%;"
     multiSelect="true"
     sizeList="[15,30,45]" pageSize="15" allowCellSelect="false" onlyCheckSelection="true" onlyCheckSelection="true"
     url="/survey/theme/getPage" allowCellWrap="true" allowHeaderWrap="true">
    <div property="columns">
        <!--序号-->
        <div type="indexcolumn"></div>
        <!--勾选-->
        <div type="checkcolumn" width="40"></div>
        <div id="fieldWidth" field="title" width="100%" headerAlign="center" align="left"
             cellStyle="min-width: 150px;" renderer="renderTitle">主题
        </div>
        <div field="publishDate" width="200" headerAlign="center" dateFormat="yyyy-MM-dd HH:mm:ss" align="center" allowSort="false">发布日期</div>
    </div>
</div>
```

### 表格的实例化和设置高度

```javascript
// 老版
cur.grid = mini.get("datagrid");
Ls.mini_datagrid_height(cur.grid, 50);

// 新版 
cur.grid = Ls.gridParse('datagrid', 50);
```

### 表格请求数据

```javascript
cur.grid.load(cur.params);

// 提供了请求完成的回调函数
cur.grid.load(cur.params, function (resp) {
    console.log(resp)
});
```

### 表格数据重新加载

```javascript
cur.grid.reload();
```

### 表格勾选事件监听

```javascript
cur.grid.on("beforeselect", function (e) {
    var disabledStr = e.record.isPublish;
    if (disabledStr) {
        e.cancel = true // 不允许勾选
    }
});
```

### 表格勾选完成后的数据调用

```javascript
function use(id) {
    var ids = id ? [id] : indexMgr._getGridSelectProp(cur.grid, 'id'); // _getGridSelectProp 的第二个参数是 以哪个属性为提交参数
    if (!ids.length) {
        Ls.tipsInfo('请选择数据');
        return;
    }

    Ls.ajax({
        url: url,
        data: {
            ids: ids.toString(),
        }
    })
}
```

### 表格数据渲染的两种方式

1. renderer 
   grid中通过field="属性名"，便可以渲染数据，如果要改写数据在该项上添加renderer

```javascript
// renderer="renderTitle"   

function renderTitle(e) {
    var rec = e.record, 
        title = rec.title,
        str = "";
    
    return str;
}
```

2. ondrawcell
   在表头上添加`ondrawcell="onDrawCell"`

```javascript
// 适用于多个项需要改写的表格

function onDrawCell(e) {
    var node = e.node,
        record = e.record,
        field = e.field;

    if (field === "title") {
        e.cellHtml = '<a class="blue" href="javascript:void(0)" onclick="pmcProjectView(' + record.id + ')">' + record.title + '</a>';
    }
    //考核周期
    if (field === "rangeDate") {
        var start = Ls.dateFormat(record.startDate, 'yyyy-MM-dd'),
            end = Ls.dateFormat(record.endDate, 'yyyy-MM-dd');
        e.cellHtml = start + '~' + end;
    }
    //
    if (field === "opt") {
        var btnStr = '<button type="button" class="btn btn-default btn-sm btn-edit" onclick="addOrEdit(' + record.id +
            ')">编辑</button>&nbsp;&nbsp;<button type="button" class="btn btn-default btn-sm btn-edit" onclick="deleteProjects(' + record.id +
            ')">删除</button>';
        var btnStr2 = '<button type="button" disabled class="btn btn-sm disabled-btn">编辑</button>&nbsp;' +
            '&nbsp;<button type="button" disabled class="btn btn-sm disabled-btn">删除</button>';
        if (record.status == -1) {
            e.cellHtml = btnStr;
        } else {
            e.cellHtml = btnStr2;
        }
    }
}
```

## ztree

### 异步树

```javascript
var ztree_settings = {
    view: {
		addDiyDom: function (treeId, node) { // 自定义树节点上的按钮
            var aObj = $("#" + node.tId + "_a");
            var editBtn = ' <span class="button edit-a" id="editBtn_' + node.organId + '" title="修改"></span>';
            aObj.after(editBtn);
            var editBtn = $("#editBtn_" + node.organId);
        
            editBtn && editBtn.on("click", function () {

                return false;
            });
        }
    },
    async: {
        enable: true,
        url: url,
        autoParam: ["id=parentId", "organId"], // 异步加载时需要自动提交父节点属性的参数
        otherParam: ["catalog", "true", "all", "false"], //  请求提交的静态参数键值对
        dataFilter: function dataFilter(treeId, parentNode, responseData) {
            // 树数据过滤器
            var responseData = Ls.treeDataFilter(responseData, Ls.treeDataType.PUBLIC_CONTENT);
            return responseData;
        }
    },
    data: {
        simpleData: { // 构成父子关系的字段
            idKey: 'id',
            pIdKey: 'parentId'
        }
    },
    callback: {
        onClick: function (event, treeId, node) { // 点击事件
           console.log(node)
        },
        onAsyncSuccess: function () {  // 异步加载完成的回调事件
            if (!isInit) {
                // 只有一条是自动展开
                if (cur.tree.getNodes().length == 1) {
                    cur.tree.expandNode(cur.tree.getNodes()[0], true, false, true);
                }

                isInit = true;
                // 添加模拟滚动条
                App.initContentScroll(null, "#" + cur.tree_id, {
                    bottom: '-9px',
                });
            }

        }
    }
};
cur.tree = $.fn.zTree.init($("#" + cur.tree_id), ztree_settings);

```

### 同步树

```js
 var data = {
     id: 1,
     parentId: '-1',
     name: '目录列表',
     open: true,
     children: d.data,
     "icon": GLOBAL_CONTEXTPATH + "/assets/images/organ.gif",
 };
var ztree_settings = {
    view: {
		addDiyDom: function (treeId, node) { // 自定义树节点上的按钮
            var aObj = $("#" + node.tId + "_a");
            var editBtn = ' <span class="button edit-a" id="editBtn_' + node.organId + '" title="修改"></span>';
            aObj.after(editBtn);
            var editBtn = $("#editBtn_" + node.organId);
        
            editBtn && editBtn.on("click", function () {

                return false;
            });
        }
    },
    data: {
        simpleData: { // 构成父子关系的字段
            idKey: 'id',
            pIdKey: 'parentId'
        }
    },
    callback: {
        onClick: function (event, treeId, node) { // 点击事件
           console.log(node)
        }
    }
};

// 初始化树
cur.tree = $.fn.zTree.init($("#" + cur.tree_id), ztree_settings, data);
```










