
var glory = require('glory')({
  tailbone: {
    header: '<center><h3>this is an example site</h3><div>please access: <a href="/auths/login">/auths/login</a></div><div>if logined, access <a href="/auths/admin">/auths/admin</a></div></center>',
    footer: '<center>demo [superman/superman123]</center>'
  },
  port: {
    dev: 4001
  }
});

var Auths    = require('../index');
var path     = require('path');
var mount    = '/auths';
var auths = Auths.create({
  mount: mount,
  dbPath: path.join(__dirname, 'data'),
  logo: '/|xxxx网站|.:navbar-brand|i:eye-open',
  mainToolbars: [
    'http://www.apple.com|i:fa-bolt|apple', 
    'http://www.google.com|i:@|google'
  ],
  rightToolbars: ['/register|注册'],
  footbars: ['auths sandbox, copyright', '*demo: [superman/superman123]']
});

auths.initRoot();

glory.app.use(mount, auths.app);
glory.ready(function () {
  console.log('listen on ' + glory.app.get('port'));
});