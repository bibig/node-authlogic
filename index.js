exports.create = create;

var Auths = require('./libs/auths');


function create (settings) {
  var auths = new Auths(settings);
  return auths;
}