exports.create = create;

var yi = require('yi');

function create (config) {
  return new Routes(config);
}

function Routes (config) {

  this.hasRole        = config.tables.hasRole;
  
  this.table_members  = config.tables.members;
  this.field_username = config.tables.field_username;
  this.field_password = config.tables.field_password;
  
  this.Members        = config.can.open(this.table_members);

  if (this.hasRole) {
    this.table_roles    = config.tables.roles;
    this.field_rolename = config.tables.field_rolename;
    this.Role           = config.can.open(this.table_roles);    
  }

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

        self.Members.findBy(self.field_username, memberData.username).exec(function (e, member) {
          var model, username;

          // console.log(member);
          if (e) { next(e); return; } else if ( member ) {

            username = member[self.field_username];
            model    = self.Members.model(member);
            // console.log(member);

            if ( model.isValidPassword(memberData.password, self.field_password) ) {
              isPass = true;
            }

          }

          if (isPass) {

            if (self.hasRole) {
              self.Role.find(member._role).exec(function (e, role) {
                var redirectUrl;
                var rolename;

                // console.log(role);
                if (e) { next(e); return; } else if ( ! role ) {
                  next(new Error(self.errorMessages['100']));
                } else {
                  
                  rolename = role[self.field_rolename];
                  // console.log('ready to set session');
                  req.session.auth = {
                    role     : rolename,
                    username : username
                  };
                  // console.log(req.session.role);

                  if (memberData.remember == 'on') {
                    req.sessionOptions.maxAge =  1000 * 3600 * 24 * 30;
                  }

                  redirectUrl = self.loginRedirectMap[rolename] || self.loginRedirectMap.member;
                  // console.log(redirectUrl);
                  res.redirect(redirectUrl);
                }

              }); // end of find role
            } else {
              req.session.auth = {
                username : member[username]
              };
            }
            

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