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
      text     : '名称', 
      max      : 100, 
      required : true,
      isUnique : true,
      isInput  : true
    },
    description: {
      type    : 'string',
      text    : '描述',
      isInput : true
    },
    membersCount: {
      type: 'int',
      default: 0,
      required: true
    }
  },
  members: {
    _role: {
      type      : 'ref',
      text      : '角色',
      required  : true,
      isInput   : true,
      inputType : 'select',
      present   : 'name',
      counter   : 'membersCount'
    },
    username: {
      type     : 'string',
      text     : '登录账号',
      max      : 50,
      min      : 3,
      required : true,
      isUnique : true,
      isInput  : true
    },
    email: {
      type: 'email',
      text: 'email',
      isInput: true
    },
    password: {
      type: 'password',
      text: '密码',
      required: true,
      isInput: true,
      inputType: 'password'
    },
    isAdmit: { 
      type: 'boolean',
      text: '已批准',
      default: false, 
      format: function (v) { return v ? '是' : '否'; }, 
      isInput: true, 
      inputType: 'checkbox'
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