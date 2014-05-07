
var Auths = require('../index');
var path  = require('path');

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

auths.initRoot();

auths.app.listen(4001);