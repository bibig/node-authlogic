module.exports = Auths;

var Routes = require('./routes');
var path   = require('path');
var yi     = require('yi');
var Config = require('../config');

function Auths (settings) {
  
  this.config = Config.create(settings);
  this.initCan();
  this.initApp();
  this.initRoutes();

  if (this.config.hasDashboards) {
    this.initDashboards();  
  }

  this.initErrorHandler();
}

Auths.prototype.initCan = function () {

  if ( ! this.config.can ) {
    this.config.can = require('./can').create(this.config.dbPath);
  }

  this.can = this.config.can;

};

Auths.prototype.initRoot = function (username, password) {
  var Roles = this.can.open('roles');
  var Members = this.can.open('members');
  var root, member;

  username = username || 'superman';
  password = password || 'superman123';

  member = Members.findBy('username', username).execSync();

  if ( ! member ) {
    root = Roles.findBy('name', 'root').execSync();

    if ( ! root ) {
      root = Roles.insertSync({
        seq         : 0,
        name        : 'root',
        description : 'administrator role'
      });
    }
    Members.insertSync({
      _role    : root,
      username : username || 'superman',
      password : password || 'superman123',
      isAdmit  : true
    });
  }
  
};

Auths.prototype.initApp = function () {
  if (this.app) return;

  var express        = require('express');
  var favicon        = require('serve-favicon');
  var logger         = require('morgan');
  var cookieParser   = require('cookie-parser');
  var bodyParser     = require('body-parser');
  var session        = require('cookie-session');
  var multipart      = require('connect-multiparty');
  // var debug       = require('debug')('app');
  var csrf           = require('csurf');
  
  var swig           = require('swig');
  // var swigExtras  = require('swig-extras');
  var app            = express();

  app.isProduction   = app.get('env') === 'production';

  // swigExtras.useFilter(swig, 'nl2br');

  app.engine('html', swig.renderFile);
  app.set('view engine', 'html');
  app.set('views', path.join(__dirname, '../views'));

  if ( ! app.isProduction ) {
    app.set('view cache', false);
    swig.setDefaults({ cache: false });
  }
  
  // view engine setup
  // app.set('views', path.join(__dirname, 'views'));
  // app.set('view engine', 'jade');


  app.use(favicon(this.config.favicon));
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded());

  app.use(multipart({
    maxFilesSize: 20 * 1024 * 1024,
    uploadDir: path.join(__dirname, 'tmp')
  }));

  app.use(require('stylus').middleware({
     src      : path.join(__dirname, '../public'),
     compress : (app.isProduction ? true : false),
     force    : (app.isProduction ?  false : true)
  }));

  app.use(cookieParser(this.config.cookieSecret));
  app.use(session(yi.clone(this.config.session)));
  
  if (this.config.csrf) {
    app.use(csrf());  
  }
  
  app.use(this.config.staticRoot, express.static(path.join(__dirname, '../public')));

  yi.merge(app.locals, this.config);

  this.app = app;
};

Auths.prototype.initErrorHandler = function () {
  var tailbone = require('tailbone').create({
    viewMount: this.config.viewMount
  });

  tailbone.enable(this.app);
};


Auths.prototype.initRoutes = function () {
  var routes = Routes.create(this.config);

  this.app.all('/login', [this.guestOnly()], routes.login());
  this.app.get('/logout', [this.memberOnly()], routes.logout());
};

Auths.prototype.initDashboards = function () {
  var Dashboards = require('./dashboards');
  var dashboardsApp = Dashboards.create(this.can, this.config.dashboardsConfig);

  this.app.get(this.config.dashboardsConfig.mount, this.rootOnly());
  this.app.use(this.config.dashboardsConfig.mount, dashboardsApp);

};

// middleware
Auths.prototype.guestOnly = function () {
  var backUrl = this.config.redirectMap.guestOnly;

  return function (req, res, next) {

    if ( yi.isNotEmpty(req.session.auth)) {
      res.redirect(backUrl);
      return;
    }

    next();
  };
};


Auths.prototype.memberOnly = function () {
  var backUrl = this.config.redirectMap.memberOnly;

  return function (req, res, next) {
    
    if (yi.isNotEmpty(req.session.auth)) {
      next();
      return;
    }
    res.redirect(backUrl);
  };
};

/**
 * [roleOnly]
 * 
 * 
 * @author bibig@me.com
 * @update [2014-05-09 22:47:43]
 * @param  {string} roleName 
 * @param  {string} backUrl
 * @return {function}
 */
Auths.prototype.roleOnly = function (roleName, backUrl) {
  var self = this;

  backUrl = backUrl || '/';

  return function (req, res, next) {

    if (req.session.auth) {
      if (req.session.auth.role === roleName) {
        next();
      } else {
        res.redirect(backUrl);
      }
    } else {
      res.redirect(self.config.redirectMap.memberOnly);
    }

  };
};

Auths.prototype.adminOnly = function (backUrl) {
  return this.roleOnly('admin', this.config.redirectMap.adminOnly);
};

Auths.prototype.rootOnly = function (backUrl) {
  return this.roleOnly('root', this.config.redirectMap.rootOnly);
};