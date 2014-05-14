var should    = require('should');
var path      = require('path');
var Authlogic = require('../index');
var utils     = require('./utils');


var authLogic;
var Members, Roles;
var superman, role;
var rootuser;
// authLogic.initRoot();

describe('init and reset root user', function () {

  before(function () {
    authLogic = Authlogic.create({
      dbPath : path.join(__dirname, 'reset_test_data')
    });
    Members = authLogic.can.open('members');
    Roles   = authLogic.can.open('roles');
    authLogic.initRoot();  
  });

  after(function (done) {
    utils.clear(authLogic.config.dbPath, done);
  });

  it('should init role table', function () {
    role     = Roles.findBy('name', 'root').execSync();
    role.should.be.ok;
  });

  it('should init member table', function () {
    superman = Members.findBy('username', authLogic.config.defaultRoot.username).execSync();
    superman.should.be.ok;
    superman.should.have.property('password');
    Members.model(superman).isValidPassword(authLogic.config.defaultRoot.password).should.be.true;
  });
});


describe('init root user with custom args', function () {

  before(function () {
    authLogic = Authlogic.create({
      dbPath : path.join(__dirname, 'init_test_data')
    });
    Members = authLogic.can.open('members');
    Roles   = authLogic.can.open('roles');
    rootuser = ['root', 'root123'];
    authLogic.initRoot(rootuser[0], rootuser[1]);
  });

  after(function (done) {
    utils.clear(authLogic.config.dbPath, done);
  });

  

  it('should init role table', function () {
    role     = Roles.findBy('name', 'root').execSync();
    role.should.be.ok;
  });

  it('should init member table', function () {
    superman = Members.findBy('username', rootuser[0]).execSync();
    superman.should.be.ok;
    superman.should.have.property('password');
    Members.model(superman).isValidPassword(rootuser[1]).should.be.true;
  });

});


describe('reset root user', function () {

  before(function () {
    authLogic = Authlogic.create({
      dbPath : path.join(__dirname, 'data2')
    });
    Members = authLogic.can.open('members');
    rootuser = ['root', 'root123'];
    authLogic.initRoot(rootuser[0]);
  });

  after(function (done) {
    utils.clear(authLogic.config.dbPath, done);
  });

  it('should change member table', function () {
    authLogic.resetRoot(rootuser[0], rootuser[1]);

    superman = Members.findBy('username', rootuser[0]).execSync();
    superman.should.be.ok;
    superman.should.have.property('password');
    Members.model(superman).isValidPassword(rootuser[1]).should.be.true;
  });

  it('reset with default root user', function () {
    authLogic.resetRoot();

    superman = Members.findBy('username', authLogic.config.defaultRoot.username).execSync();
    superman.should.be.ok;
    superman.should.have.property('password');
    Members.model(superman).isValidPassword(authLogic.config.defaultRoot.password).should.be.true;
  });

});

