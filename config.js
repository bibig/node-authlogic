exports.create = create;

var yi   = require('yi');
var path = require('path');
var anchors    = require('bootstrap-helper').anchors;
var Event = require('events').EventEmitter;

var Config = {
  path       : __dirname,
  staticRoot : '/auths-assets',
  
  
  viewMount  : '',
  mount      : '',
  
  csrf       :   true,
  favicon    : path.join(__dirname, './public/images/favicon.ico'),
  
  // db settings
  dbPath     : path.join(__dirname, './data'),
  
  tables     : {
    roles                   : 'roles',  // if false mean no roles table
    members                 : 'members',
    field_rolename          : 'name', 
    field_username          : 'username',
    field_password          : 'password',
    field_admit             : false,  // false mean don't need
    field_status            : false,  // false mean don't need
    extra_fields_in_session : []
  },

  // if authlogic is mounted on mainApp, make sure the cookieSecret and session keys are some with mainApp
  cookieSecret : 'authLogic',
  session: {
    keys: ['auth', 'logic'],
    maxAge: 60 * 60 * 1000
  }, 

  javascripts     : {
    jquery    : '//ajax.aspnetcdn.com/ajax/jQuery/jquery-1.11.0.min.js',
    tinymce   : '//tinymce.cachefly.net/4.0/tinymce.min.js',
    bootstrap : '//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min.js'
  },
  stylesheets: {
    bootstrap : '//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css',
    fa        : '//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css'
  },
  text: {
    login    : '登录',
    username : '用户名',
    password : '密码',
    remember : '记住我',
    logout   : '退出',
    member   : '成员'
  },
  errorMessages: {
    '100': '没有找到用户对应的角色', // the logined member missing role info.
    '101': '对不起，用户名和密码不符', // username and password are not matched
    '102': '请输入用户名和密码',      // should input username and password
    '103': '用户信息还在审批中',      // under admit
    '104': '用户已经停用'             // invalid status
  },
  flashMessages: {
    memberOnly : '只有注册用户才可以访问，请先登录。',
    roleOnly   : '只有%s用户才可以访问。',
    logout     : '您已成功退出。'
  },
  redirectMap: {
    logout     : null,  // where to redirect when logout
    memberOnly : null,  // will redirect to login page, need add mount
    adminOnly  : '/',   // where to redirect if no authority to access adminOnly page.
    rootOnly   : '/',   // where to redirect if no authority (super administrator) to access rootOnly page.
    guestOnly  : '/',  // basically, only use for login page

    login      : {
      root   : null, // need add mount
      member : '/'  
    }
  },
  hasDashboards: true,
  dashboardsConfig:  {
    mount : '/admin',
    title: 'dashboards'
  },
  defaultRoot: {
    username : 'king',
    password : 'king123'
  }
};

function create (settings) {
  var currentDate = new Date();
  var config = yi.merge(settings, yi.clone(Config));
  var urlRoot;

  if (! config.viewMount && config.mount ) { config.viewMount = config.mount; }
  
  config.dashboardsConfig.viewMount = path.join(config.viewMount, config.dashboardsConfig.mount);

  urlRoot = path.join(config.viewMount, config.staticRoot);
  config.currentDate  = [currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate()];

  
  // prepare for logo
  if (yi.isNotEmpty(config.logo)) {
    config.logo = anchors.render(config.logo);
  }

  // prepare for nav links, render toolbars
  if (yi.isNotEmpty(config.mainToolbars)) {
    config.mainToolbars = anchors.render(config.mainToolbars); 
  }

  if (yi.isNotEmpty(config.rightToolbars)) {
    config.rightToolbars = anchors.render(config.rightToolbars);
  }

  if (yi.isNotEmpty(config.footbars)) {
    config.footbars = anchors.render(config.footbars);
  }

  if ( ! config.stylesheets.base ) {
    config.stylesheets.base = path.join(urlRoot, '/stylesheets/base.css');  
  }
  
  if ( ! config.loginImage ) {
    config.loginImage = path.join(urlRoot, '/images/login.png');  
  }
  
  if ( ! config.redirectMap.login.root ) {
    config.redirectMap.login.root = config.dashboardsConfig.viewMount;
  }

  if ( ! config.redirectMap.memberOnly) {
    config.redirectMap.memberOnly = path.join(config.viewMount, '/login');
    
  }

  if ( ! config.redirectMap.logout ) {
    config.redirectMap.logout = path.join(config.viewMount, '/login');
  }

  if (config.hasDashboards) {
    if ( ! config.dashboardsConfig.mainToolbars) {
      config.dashboardsConfig.mainToolbars = [
        config.dashboardsConfig.viewMount + '|i:th|' + config.dashboardsConfig.title,
        path.join(config.dashboardsConfig.viewMount, '/members/add') + '|i:+|' + config.text.member
      ];
    }

    if ( ! config.dashboardsConfig.rightToolbars) {
      config.dashboardsConfig.rightToolbars = [
        config.viewMount + '/logout|i:off|' + config.text.logout
      ];
    }

    // keep cookie, session settings same
    config.dashboardsConfig.cookieSecret = config.cookieSecret;
    config.dashboardsConfig.session = yi.clone(config.session);

  }

  // init event
  config.event = new Event();

  if (config.onSuccess) {
    config.event.on('success', config.onSuccess);
  }

  if (config.onFailed) {
    config.event.on('failed', config.onFailed); 
  }

  // logout trigger
  if (config.onExit) {
    config.event.on('exit', config.onExit);  
  }

  return config;
}