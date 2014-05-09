exports.create = create;

var yi = require('yi');

function create (config) {
  return new Routes(config);
}

function Routes (config) {
  this.Members           = config.can.open('members');
  this.Role              = config.can.open('roles');
  this.loginRedirectMap  = config.redirectMap.login;
  this.logoutRedirectUrl = config.redirectMap.logout;
  this.errorMessages     = config.errorMessages;
  this.csrf              = config.csrf;
}

Routes.prototype.login = function () {
  var self = this;

  return function (req, res, next) {
    var locals = {};
    var isPass = false;
    var memberData;

    // console.log(req.sessionOptions);
    // console.log(req.session.isMember);
    // console.log(req.session.role);

    function renderForm () {

      if (self.csrf) {
        locals.token = req.csrfToken();
      }
        
      res.render('login.html', locals);    
    }

    if (req.method === 'POST') {
      memberData = req.body.member;
      // console.log(memberData);

      if (yi.isNotEmpty(memberData.username) && yi.isNotEmpty(memberData.password)) {

        self.Members.findBy('username', memberData.username).exec(function (e, member) {
          var model;

          // console.log(member);
          if (e) { next(e); return; } else if ( member ) {

            model = self.Members.model(member);
            // console.log(member);

            if ( model.isValidPassword(memberData.password) ) {
              isPass = true;
            }

          }

          if (isPass) {

            self.Role.find(member._role).exec(function (e, role) {
              var redirectUrl;

              // console.log(role);
              if (e) { next(e); return; } else if ( ! role ) {
                next(new Error(self.errorMessages['100']));
              } else {
                
                // console.log('ready to set session');
                req.session.auth = {
                  isMember : true,
                  role     : role.name 
                };
                // console.log(req.session.role);

                if (memberData.remember == 'on') {
                  req.sessionOptions.maxAge =  1000 * 3600 * 24 * 30;
                }

                redirectUrl = self.loginRedirectMap[role.name] || self.loginRedirectMap.member;
                // console.log(redirectUrl);
                res.redirect(redirectUrl);
              }

            }); // end of find

          } else {
            locals.errorMessage = self.errorMessages['101'];
            renderForm();
          }

        });  // end of loadby

      } else {
        locals.errorMessage = self.errorMessages['102'];
        renderForm();
      }

    } else {
      renderForm();
    } 

  };
};

Routes.prototype.logout = function () {
  var self = this;

  return function (req, res) {
    req.session.auth = null;
    res.redirect(self.logoutRedirectUrl);
  };
};

// open to guest 
Routes.prototype.register = function () {

};