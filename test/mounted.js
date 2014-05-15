
var should    = require('should');
var request   = require('supertest');
var path      = require('path');
var Authlogic = require('../index');
var cheerio   = require('cheerio');
var utils     = require('./utils');
var cookieSecret  = 'this is a test';
var sessionConfig = {
  keys: ['hello', 'world'],
  maxAge: 60 * 1000
};

var glory     = require('glory')({
  cookieSecret : cookieSecret,
  session      : sessionConfig
});

var mount   = '/auth';
var authLogic = Authlogic.create({
  mount: mount,
  cookieSecret: cookieSecret,
  session: sessionConfig,
  dbPath : path.join(__dirname, 'mounted_data')
});

var rootUser = authLogic.config.defaultRoot;

authLogic.initRoot();

glory.app.use(mount, authLogic.app);
glory.app.get('/', function (req, res, next) {
  if (req.session.auth) {
    res.send(req.session.auth.role + ',' + req.session.auth.username);  
  } else {
    res.send('no session');
  }
  
});

glory.app.get('/only-access-by-member', [authLogic.memberOnly()], function (req, res, next) {
  res.send('ok');
});

describe('get static asserts', function () {
  it('get base css', function (done) {
    request(glory.app)
      .get(authLogic.config.stylesheets.base)
      .expect(200)
      .expect('Content-Type', /css/)
      .end(function (e, res) {
        should.not.exist(e);
        // console.log(res.headers);
        done();  
      });
  });
});

describe('<basic test>', function () {
  var csrf;
  var cookies;
  var agent = request.agent(glory.app);

  this.timeout(5000);

  after(function (done) {
    utils.clear(authLogic.config.dbPath, done);
  });

  it('get /only-access-by-member by guest, should redirect to login page', function (done) {

    agent
      .get('/only-access-by-member')
      .expect(302)
      .end(function (e, res) {

        if (e) { console.error(e); console.log(e.stack); return; }

        should.not.exist(e);
        should(res.headers.location).eql('/auth/login');

        done();

      });
  });

  it('get /auth/login', function (done) {

    agent
      .get('/auth/login')
      .expect(200)
      .end(function (e, res) {
        
        if (e) { console.error(e); console.log(e.stack); return; }

        should.not.exist(e);

        // console.log(res.header);

        var $ = cheerio.load(res.text);
        csrf = $('input[name="_csrf"]').val();
        // console.log('%s: %d', csrf, csrf.length);
        cookies = res.headers['set-cookie'];
        // console.log(res.text);
        done();

      });
  });

  it('post /auth/login, when logined should redirect to the remembered url', function (done) {
    // console.log('%s: %d', csrf, csrf.length);
    agent
      .post('/auth/login')
      .field('member[username]', rootUser.username)
      .field('member[password]', rootUser.password)
      .field('member[remember]', 'on')
      .field('_csrf', csrf)
      .expect(302)
      .end(function (e, res) {

        if (e) { console.error(e); console.log(e.stack); return; }

        should.not.exist(e);
        should(res.headers.location).eql('/only-access-by-member');

        done();

      });
  });

  it('get /', function (done) {
    agent
      .get('/')
      .expect(200)
      .end(function (e, res) {
        should.not.exist(e);

        res.text.should.eql('root,' + rootUser.username);
        done();
      });
  });

  it('get /only-access-by-member', function (done) {

    agent
      .get('/only-access-by-member')
      .expect(200)
      .end(function (e, res) {

        if (e) { console.error(e); console.log(e.stack); return; }

        should.not.exist(e);

        res.text.should.eql('ok');
        done();
      });
  });

  it('get /auth/logout', function (done) {

    agent
      .get('/auth/logout')
      .expect(302)
      .end(function (e, res) {

        if (e) { console.error(e); console.log(e.stack); return; }

        should.not.exist(e);
        should(res.headers.location).eql('/auth/login');

        done();
      });
  });

  it('get /auth/admin', function (done) {

    agent
      .get('/auth/admin')
      .expect(302)
      .end(function (e, res) {

        if (e) { console.error(e); console.log(e.stack); return; }

        should.not.exist(e);
        should(res.headers.location).eql('/auth/login');

        done();
      });
  });  

  it('get /only-access-by-member ', function (done) {

    agent
      .get('/only-access-by-member')
      .expect(302)
      .end(function (e, res) {

        if (e) { console.error(e); console.log(e.stack); return; }

        should.not.exist(e);
        should(res.headers.location).eql('/auth/login');

        done();

      });
  });

});
