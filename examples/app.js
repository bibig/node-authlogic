
var express = require('express');
var Auths = require('../index');
var path  = require('path');
var mainApp = express();
var mount = '/auths';

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
// auths.app.listen(4001);

mainApp.use(mount, auths.app);
mainApp.listen(4001);
