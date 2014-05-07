exports.create = create;

var Jsoncan = require('Jsoncan');

var seqs = function () {
  var list = [];
  for (var i = 1; i <= 20; i++) { list.push('#' + i); }
  return list;
} ();

var timestampFormat = function (s) {
  var d = new Date(s);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('-') + ' ' + [d.getHours(), d.getMinutes(), d.getSeconds()].join(':');
};


var tables = {
  roles: {
    seq: {
      type      : 'array',
      text      : '序号',
      values    : seqs,
      isInput   : true,
      inputType : 'select'
    },
    name: {
      type     : 'string', 
      text     : '标题', 
      max      : 100, 
      required : true,
      isUnique : true,
      isInput  : true
    },
    description: {
      type    : 'string',
      text    : '描述',
      isInput : true
    }
  },
  auths: {
    _role: {
      type     : 'ref',
      text     : '角色',
      required : true,
      isInput  : true
    },
    name: {
      type     : 'string',
      text     : '用户名',
      max      : 50,
      min      : 3,
      required : true,
      isUnique : true,
      isInput  : true
    },
    password: {
      type: 'password',
      text: '密码',
      required: true,
      isInput: true,
      inputType: 'password'
    },
    created:  { 
      type: 'created', 
      text: '创建时间',
      format: timestampFormat
    },
    modified: {
      type: 'modified', 
      text: '更新时间',
      format: timestampFormat
    }
  }
};

function create (path) {
  return new Jsoncan(path, tables);
}