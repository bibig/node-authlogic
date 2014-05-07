exports.create = create;

var yi = require('yi');

function create (app, settings) {
  return new Routes(app, settings);
}

function Routes (app, settings) {
  this.app         = app;
  this.Auth        = settings.can.open('auths');
  this.Role        = settings.can.open('roles');
  this.redirectMap = settings.redirectMap || {};
}

Routes.prototype.login = function () {
  var self = this;

  return function (req, res, next) {
    var locals = {};
    var isPass = false;
    var authData;

    function renderForm () {
      locals.token = req.csrfToken();
      res.render('login.html', locals);    
    }

    if (req.method === 'POST') {
      authData = req.body.auth;
      // console.log(authData);

      if (yi.isNotEmpty(authData.name) && yi.isNotEmpty(authData.password)) {

        self.Auth.findBy('name', authData.name).exec(function (e, auth) {
          var model;

          // console.log(auth);
          if (e) { next(e); return; } else if ( auth ) {

            model = self.Auth.model(auth);
            // console.log(auth);

            if ( model.isValidPassword(authData.password) ) {
              isPass = true;
            }

          }

          if (isPass) {

            self.Role.find(auth._role).exec(function (e, role) {
              var redirectUrl;

              // console.log(role);
              if (e) { next(e); return; } else if ( ! role ) {
                next(new Error('没有找到用户对应的角色'));
              } else {
                
                req.session.isLogin = true;
                req.session.role = role.name;

                if (authData.remember == 'on') {
                  req.session.cookie.originMaxAge =  1000 * 3600 * 24 * 30;
                }

                redirectUrl = self.redirectMap[role.name] || '/';
                // console.log(redirectUrl);
                res.redirect(redirectUrl);
              }

            }); // end of find

          } else {
            locals.errorMessage = '对不起，用户名和密码不符';
            renderForm();
          }

        });  // end of loadby

      } else {
        locals.errorMessage = '请输入用户名和密码';
        renderForm();
      }

    } else {
      renderForm();
    } 

  };
};

Routes.prototype.enable = function () {
  this.app.all('/login', this.login());
};

/*function guestOnly (req, res, next) {
  if (req.session.isAdmin === true) {
    res.redirect('/');
  } else {
    next();
  }
}

// todo: 可以考虑带上url参数，成功登陆后直接转过去
function adminOnly (req, res, next) {
  if (req.session.isAdmin === true) {
    next();
  } else {
    res.redirect('/login');
  }
}

function logout (req, res) {
  req.session.isAdmin = null;
  res.redirect('/');
}*/