// ==UserScript==
// @name         测试
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  1：百度文库免费下载、内容自由复制、广告过滤、非VIP用户点可继续阅读不用VIP等；2：全网VIP视频免费破解去广告(综合线路电视剧免跳出选集)支持爱奇艺、腾讯、优酷、哔哩哔哩等；3：全网音乐有声音频免客户端下载,支持网易云音乐、QQ音乐、酷狗、喜马拉雅、咪咕等；4：知乎使用增强：外链接直接跳出、问题,回答时间标注、短视频下载等；5：短视频去水印下载(无限制下载)支持：抖音、快手；6：CSDN使用增强：广告移除、净化剪切板、未登录查看折叠评论等；7：京东、淘宝、天猫等优惠券查询
// @author       Jazzu Lu
//-----------------------------------------------------------
// @require      https://code.jquery.com/jquery-1.9.1.js
//-----------------------------------------------------------
// @require
// @resource css
//-----------------------------------------------------------
// @include      https://material-ui.com/zh/*
//-----------------------------------------------------------
// @require      file:///D:/Workplace/TM_ScrapyZhihuData/MSTicket.js
//-----------------------------------------------------------
// @run-at       document-idle
// @original-author Jazzu Lu
// @original-license GPL License
// @charset		 UTF-8
// ==/UserScript==

Date.prototype.format = function (fmt="YYYY-mm-dd HH:MM") {
  let date = this;
  let ret;
  const opt = {
    "Y+": date.getFullYear().toString(),        // 年
    "m+": (date.getMonth() + 1).toString(),     // 月
    "d+": date.getDate().toString(),            // 日
    "H+": date.getHours().toString(),           // 时
    "M+": date.getMinutes().toString(),         // 分
    "S+": date.getSeconds().toString()          // 秒
    // 有其他格式化字符需求可以继续添加，必须转化成字符串
  };
  for (let k in opt) {
    ret = new RegExp("(" + k + ")").exec(fmt);
    if (ret) {
      fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
    }
  }
  return fmt;
}

/** ----------------- 获取遮罩下的元素 ------------------- **/
class GetElement {
  constructor(){
    let nodes = document.getElementsByTagName('*'), node;
    for (let i = 0, j = nodes.length; i < j; i++) {
      if (!/style|head|script|html|body|title|br|ul/i.test(nodes[i].tagName)) { //过滤掉不需要的标签，如ul这些只是容器，要获取li就需要过滤掉ul，要不点击li的时候获取到的只能是ul，因为li包含在ul中，还有dl之类之类的自己添加进去
        node = nodes[i];
        node.p = this.#computeRange(node);
        window.nodes[window.nodes.length] = node;
      }
    }
    this.nodes = nodes;
    // let dv = document.createElement('div');
    // dv.onclick = function (e) {
    //   let o = GetObject(e || window.event);
    //   if (o) alert(o.tagName + '\n' + o.innerHTML);
    // }
  }

  static #computeRange(o) {//获取对象范围
    let p = { x: o.offsetLeft, y: o.offsetTop,x1:o.offsetWidth,y1:o.offsetHeight };
    while (o === o.offsetParent) {
      p.x += o.offsetLeft;
      p.y += o.offsetTop;
    }
    p.x1 += p.x;
    p.y1 += p.y;
    return p;
  }
  GetObject(e) {
    let nodes = this.nodes;
    let x = e.clientX + Math.max(document.body.scrollLeft, document.documentElement.scrollLeft),
      y = e.clientY + Math.max(document.body.scrollTop, document.documentElement.scrollTop);
    for (let i = 0, j = nodes.length; i < j; i++)
      if (nodes[i].p.x <= x && nodes[i].p.x1 >= x && nodes[i].p.y <= y && nodes[i].p.y1 >= y) return nodes[i];
  }
}


/** 总数据 **/
const PL_ROW = ()=>({id:-new Date().getTime(), name:'', field:'', date:new Date().format(), field:''});   /** 单行数据 **/
let PL_ROWS = [];   /** 全部的数据 **/
let PL_SNAPSHOT = null;   /** 快照 **/

/** ----------------- 入口 ------------------- **/
(function() {
  createCss();    /** 创建 css **/
  let floatWidget = (`<div id='jl_float_container'><div class="jl_list"></div><div class="jl_btn_group"></div></div>`);   /** 左侧小组件 **/
  let snapshot = (`<div id='jl_snapshot'></div>`);  /** 点击区域的快照 **/
  let mask = (`<div id='jl_mask'></div>`);  /** 点击区域的快照 **/
  $("body").append(floatWidget).append(snapshot).append(mask);
  renderBtn();
})();

/** ----------------- 事件 ------------------- **/
function addRow(){
  PL_ROWS.push({...PL_ROW()})
  renderRows(PL_ROWS);
}
function deleteRow(){
  let id = $(this).parents('.jl_row').data('id');
  PL_ROWS = PL_ROWS.filter(r=>r.id!=id);
  renderRows(PL_ROWS);
}
function fieldFocus(){

}
function fieldBlur(){
  let id = $(this).parents('.jl_row').data('id');
  let curRow = PL_ROWS.find(v=>v.id==id);
  $(document).on('click',function (){
    console.log("blur:",$(this))
    // $("#jl_snapshot").html($(this).html())
  })
  // renderRows(PL_ROWS);
}

/** 实现双向绑定 **/
function inputChange(){
  let field = $(this).data('name');
  let id = $(this).parents('.jl_row').data('id');
  let curRow = PL_ROWS.find(r=>r.id==id);
  if(field && curRow){
    curRow[field] = $(this).val();
  }
}

/** ----------------- 渲染 DOM ------------------- **/
/** 渲染 Button **/
function renderBtn(){
  let btnHtml = `<button type="button" class="jl_row_add_btn">添加一条数据</button>`;
  $("#jl_float_container .jl_btn_group").append(btnHtml).find('.jl_row_add_btn').on("click",addRow);

}
/** 渲染行数据 **/
function renderRow(row){
  return (`
    <div class="jl_row mb" data-id="${row.id}">
      <div class="name"><input type="text" data-name="name" placeholder="名称" value="${row.name}"></div>
      <div class="field"><input type="text" data-name="field" placeholder="点击区域" value="${row.field}"></div>
      <div class="time"><input type="text" data-name="date" class="datepicker" placeholder="点击时间" value="${row.date}"></div>
      <div class="delete">删除</div>
    </div>
  `)
}
function renderRows(rows){
  let rowsHtml = ``;
  rows.forEach(row=>{
    rowsHtml += renderRow(row)
  })
  $("#jl_float_container .jl_list").html(rowsHtml);
  $( "#jl_float_container .jl_row .delete" ).each(function(){
    $(this).unbind(deleteRow).on("click",deleteRow);
  });
  $( "#jl_float_container .jl_row .field input" ).each(function(){
    $(this).unbind(fieldBlur).on("blur",fieldBlur);
  });
  $( "#jl_float_container .jl_row input" ).each(function(){
    $(this).unbind(inputChange).on("change",inputChange);
  });
}


/** ----------------- 渲染 Style ------------------- **/
function createCss(){
  let css = (`
    <style>
      #jl_snapshot{position: fixed;right: 0;top: 5vh;border: 2px #333 solid;padding: 0;display: none;}
      #jl_float_container{position: fixed;left: -0px;top: 20vh;z-index: 10000;width: 320px;border: 1px #ddd solid;border-radius:5px;padding:5px;transition: .8s all ease;background: #fff;}
      #jl_float_container:hover{left: 0;}
      #jl_float_container .ma{margin: 10px;}
      #jl_float_container .ml{margin-left: 10px;} #jl_float_container .mr{margin-right: 10px;}
      #jl_float_container .mt{margin-top: 10px;}  #jl_float_container .mb{margin-bottom: 10px;}
      /* 行 */
      #jl_float_container .jl_list{max-height: 30vh;overflow-y: auto;}
      #jl_float_container .jl_row{display: flex;justify-content: space-between;align-items: center;}
      #jl_float_container .jl_row input{width: 70px;}
      #jl_float_container .jl_row .time input{width: 116px;}
      #jl_float_container .jl_row .delete{color: #ef2525;cursor: pointer;font-weight: 600;}
      /* 添加按钮 */
      #jl_float_container .jl_btn_group{display: flex;justify-content: flex-end;}
    </style>
  `)
  $("body").append(css);
}