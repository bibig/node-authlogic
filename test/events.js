
var should    = require('should');
var request   = require('supertest');
var path      = require('path');
var Authlogic = require('../index');
var cheerio   = require('cheerio');
var utils     = require('./utils');

var currentCode;
var currentAuth;

var authLogic = Authlogic.create({
  dbPath : path.join(__dirname, 'error-message-test'),
  csrf: false,
  onFailed: function (code, data) {
    currentCode = code;
    // console.log('failed: %d', code);
    // console.log(data);
  },
  onSuccess: function (auth) {
    currentAuth = auth;
    // console.log(auth);
  }
});

var rootUser = authLogic.config.defaultRoot;

authLogic.initRoot();

describe('test login failed situations', function () {
  var csrf;
  var cookies;
  var agent = request.agent(authLogic.app);

  this.timeout(5000);

  after(function (done) {
    utils.clear(authLogic.config.dbPath, done);
  });

  it('post /login with empty input', function (done) {
    // console.log('%s: %d', csrf, csrf.length);
    agent
      .post('/login')
      .field('member[username]', '')
      .field('member[password]', '')
      .field('member[remember]', 'on')
      .expect(200)
      .end(function (e, res) {

        if (e) { console.error(e); console.log(e.stack); return; }

        should.not.exist(e);
        should(res.text).match(new RegExp(authLogic.config.errorMessages[102]));
        should(currentCode).eql(102);
        done();

      });
  });

  it('post /login with wrong password', function (done) {
    // console.log('%s: %d', csrf, csrf.length);
    agent
      .post('/login')
      .field('member[username]', rootUser.username)
      .field('member[password]', 'im wrong password')
      .field('member[remember]', 'on')
      .expect(200)
      .end(function (e, res) {

        if (e) { console.error(e); console.log(e.stack); return; }

        should.not.exist(e);
        should(res.text).match(new RegExp(authLogic.config.errorMessages[101]));
        should(currentCode).eql(101);

        done();

      });
  });

  it('login onSuccess', function (done) {
    // console.log('%s: %d', csrf, csrf.length);
    agent
      .post('/login')
      .field('member[username]', rootUser.username)
      .field('member[password]', rootUser.password)
      .field('member[remember]', 'on')
      .expect(302)
      .end(function (e, res) {

        if (e) { console.error(e); console.log(e.stack); return; }

        should.not.exist(e);
        should(res.headers.location).eql('/admin');
        should(currentAuth.username).eql(rootUser.username);
        // console.log(res.headers['set-cookie']);
        // console.log(res.header);
        // console.log(res.text);

        done();

      });
  });

});
