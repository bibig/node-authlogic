
var should    = require('should');
var request   = require('supertest');
var path      = require('path');
var Authlogic = require('../index');
var cheerio   = require('cheerio');
var utils     = require('./utils');

var authLogic = Authlogic.create({
  dbPath : path.join(__dirname, 'data')
});

var rootUser = authLogic.config.defaultRoot;

authLogic.initRoot();

describe('get static asserts', function () {
  it('get base css', function (done) {
    request(authLogic.app)
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
  var agent = request.agent(authLogic.app);

  this.timeout(5000);

  after(function (done) {
    utils.clear(authLogic.config.dbPath, done);
  });

  it('get /login', function (done) {

    agent
      .get('/login')
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

  it('post /login', function (done) {
    // console.log('%s: %d', csrf, csrf.length);
    agent
      .post('/login')
      .field('member[username]', rootUser.username)
      .field('member[password]', rootUser.password)
      .field('member[remember]', 'on')
      .field('_csrf', csrf)
      .expect(302)
      .end(function (e, res) {

        if (e) { console.error(e); console.log(e.stack); return; }

        should.not.exist(e);
        should(res.headers.location).eql('/admin');
        // console.log(res.headers['set-cookie']);
        // console.log(res.header);
        // console.log(res.text);

        done();

      });
  });

  it('get /logout', function (done) {

    agent
      .get('/logout')
      .expect(302)
      .end(function (e, res) {

        if (e) { console.error(e); console.log(e.stack); return; }

        should.not.exist(e);
        should(res.headers.location).eql('/login');

        done();
      });
  });

  it('get /admin', function (done) {

    agent
      .get('/admin')
      .expect(302)
      .end(function (e, res) {

        if (e) { console.error(e); console.log(e.stack); return; }

        should.not.exist(e);
        should(res.headers.location).eql('/login');

        done();
      });
  });  


});
