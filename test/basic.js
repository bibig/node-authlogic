
var should = require('should');
var request = require('supertest');
var path = require('path');
var Auths = require('../index');

var auths = Auths.create({
  dbPath: path.join(__dirname, 'data'),
  logo: '/|xxxx网站|.:navbar-brand|i:eye-open',
  mainToolbars: [
    'http://www.apple.com|i:fa-bolt|apple', 
    'http://www.google.com|i:@|google'
  ],
  rightToolbars: ['/register|注册'],
  footbars: ['auths sandbox, copyright']
});

describe('<basic test>', function () {

  var agent = request.agent(auths.app);

  it('get /login', function (done) {

    agent
      .get('/login')
      .expect(200)
      .end(function (e, res) {

        if (e) { console.error(e); console.log(e.stack); return; }

        should.not.exist(e);

        console.log(res.text);

        done();

      });

  });

});
