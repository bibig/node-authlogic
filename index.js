exports.create = create;

var Routes = require('./libs/routes');
var path   = require('path');
var yi     = require('yi');
var CONFIG = require('./libs/config');


function create (settings) {
  return new Auths(settings);
}

function Auths (settings) {
  
  this.settings = yi.merge(settings || {}, {
    dbPath: path.join(__dirname, './data'),
    mount: '',
    stylesheets: {},
    javascripts: {}
  });

  this.initCan();
  this.initApp();
  this.initRoutes();
  this.initLocals();
  this.initErrorHandler();
}

Auths.prototype.initCan = function () {

  if ( ! this.settings.can ) {
    this.settings.can = require('./libs/can').create(this.settings.dbPath);
  }

  this.can = this.settings.can;

};

Auths.prototype.initRoot = function (name, password) {
  var Roles = this.can.open('roles');
  var Auths = this.can.open('auths');
  var root, auth;

  name = name || 'superman';
  password = password || 'superman123';

  auth = Auths.findBy('name', name).execSync();

  if ( ! auth ) {
    root = Roles.findBy('name', 'root').execSync();

    if ( ! root ) {
      root = Roles.insertSync({
        seq         : 0,
        name        : 'root',
        description : 'administrator role'
      });
    }
    Auths.insertSync({
      _role: root,
      name: name || 'superman',
      password: password || 'superman123'
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
  // var multipart      = require('connect-multiparty');
  // var debug       = require('debug')('app');
  var csrf           = require('csurf');
  
  var swig           = require('swig');
  // var swigExtras  = require('swig-extras');
  var app            = express();

  app.isProduction   = app.get('env') === 'production';

  // swigExtras.useFilter(swig, 'nl2br');

  app.engine('html', swig.renderFile);
  app.set('view engine', 'html');
  app.set('views', path.join(__dirname, 'views'));

  if ( ! app.isProduction ) {
    app.set('view cache', false);
    swig.setDefaults({ cache: false });
  }
  
  // view engine setup
  // app.set('views', path.join(__dirname, 'views'));
  // app.set('view engine', 'jade');


  app.use(favicon(this.settings.favicon || CONFIG.favicon));
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded());

  /*
  app.use(multipart({
    maxFilesSize: 20 * 1024 * 1024,
    uploadDir: path.join(__dirname, 'public/uploads')
  }));
  */

  app.use(require('stylus').middleware({
     src:__dirname + '/public',
     compress: (app.isProduction ? true : false),
     force: (app.isProduction ?  false : true)
   }));

  app.use(cookieParser('jsoncan auths'));
  app.use(session({keys: ['jsoncan', 'auths'], maxAge: 60 * 60 * 1000}));
  app.use(csrf());
  app.use(express.static(path.join(__dirname, 'public')));

  this.app = app;
};

Auths.prototype.initErrorHandler = function () {
  /// error handlers
  // development error handler
  // will print stacktrace
  /// catch 404 and forwarding to error handler
  this.app.use(function(req, res, next) {
      var err = new Error('对不起，页面不存在');
      err.status = 404;
      next(err);
  });

  if (! this.app.isProduction ) {
    
    this.app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      // res.send('对不起，后台发生错误');
      res.render('error', {
          message: err.message,
          error: err
      });
    });

  }

  // production error handler
  // no stacktraces leaked to user
  this.app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
          message: err.message
      });
  });

};

Auths.prototype.initLocals = function () {

  if ( ! this.app) { return; }

  var anchors    = require('bootstrap-helper').anchors;
  var currentDate = new Date();

  this.app.locals.mount        = this.settings.mount;
  this.app.locals.currentDate  = [currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate()];

  // prepare for logo
  if (yi.isNotEmpty(this.settings.logo)) {
    this.app.locals.logo = anchors.render(this.settings.logo);
  }

  // prepare for nav links, render toolbars
  if (yi.isNotEmpty(this.settings.mainToolbars)) {
    this.app.locals.mainToolbars = anchors.render(this.settings.mainToolbars); 
  }

  if (yi.isNotEmpty(this.settings.rightToolbars)) {
    this.app.locals.rightToolbars = anchors.render(this.settings.rightToolbars);
  }

  if (yi.isNotEmpty(this.settings.footbars)) {
    this.app.locals.footbars = anchors.render(this.settings.footbars);
  }

  this.app.locals.stylesheets           = this.settings.stylesheets;
  this.app.locals.stylesheets.base      = this.settings.stylesheets.base || this.settings.mount + CONFIG.stylesheets.base;
  this.app.locals.stylesheets.bootstrap = this.settings.stylesheets.bootstrap || CONFIG.stylesheets.bootstrap;
  this.app.locals.stylesheets.fa        = this.settings.stylesheets.fa || CONFIG.stylesheets.fa;
  
  this.app.locals.javascripts           = this.settings.javascripts;
  // this.app.locals.javascripts.base      = this.settings.javascripts.base || this.settings.mount + CONFIG.javascripts.base;
  
  this.app.locals.javascripts.jquery    = this.settings.javascripts.jquery || CONFIG.javascripts.jquery;

  this.app.locals.javascripts.bootstrap = this.settings.javascripts.bootstrap || CONFIG.javascripts.bootstrap;
  this.app.locals.javascripts.tinymce   = this.settings.javascripts.tinymce || CONFIG.javascripts.tinymce;

};

Auths.prototype.initRoutes = function () {
  var routes = Routes.create(this.app, this.settings);
  routes.enable();
};
