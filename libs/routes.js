exports.create = create;

var yi = require('yi');

function create (config) {
  return new Routes(config);
}

function Routes (config) {

  this.event          = config.event;
  this.table_roles    = config.tables.roles;
  
  this.table_members  = config.tables.members;
  this.field_username = config.tables.field_username;
  this.field_password = config.tables.field_password;
  this.field_status   = config.tables.field_status;

  this.flashMessages  = config.flashMessages;

  this.extra_fields_in_session = config.tables.extra_fields_in_session;
  
  this.Members        = config.can.open(this.table_members);

  if (this.table_roles) {
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

      locals.flash = req.shine();
      res.render('login.html', locals);    
    }

    if (req.method === 'POST') {
      memberData = req.body.member;
      // console.log(memberData);

      if (yi.isNotEmpty(memberData.username) && yi.isNotEmpty(memberData.password)) {

        self.Members.findBy(self.field_username, memberData.username).exec(function (e, member) {
          var model, username, auth, redirectUrl;

          // console.log(member);
          if (e) { return next(e); } else if ( member ) {

            if ( self.field_admit ) {
              if ( ! member[field_admit] ) {
                locals.errorMessage = self.errorMessages['103'];
                self.event.emit('failed', 103, memberData);
                return renderForm();
              }
            }

            username = member[self.field_username];
            model    = self.Members.model(member);
            // console.log(member);

            if ( model.isValidPassword(memberData.password, self.field_password) ) {

              // check status of member
              if ( self.field_status ) {
                if ( ! member[field_status] ) {
                  locals.errorMessage = self.errorMessages['104'];
                  self.event.emit('failed', 104, memberData);
                  return renderForm();
                }
              }

              isPass = true;
            }

          }

          if (isPass) {

            // add base auth info
            req.session.auth = auth = {
              username : username
            };

            // add extra info
            self.extra_fields_in_session.forEach(function (name) {
              auth[name] = member[name];
            });

            if (self.table_roles) {
              self.Role.find(member._role).exec(function (e, role) {
                
                var rolename;

                // console.log(role);
                if (e) { next(e); return; } else if ( ! role ) {
                  self.event.emit('failed', 100, memberData);
                  next(new Error(self.errorMessages['100']));
                } else {
                  
                  rolename = role[self.field_rolename];

                  // add role info
                  auth.role = rolename;
                  // console.log(req.session.role);

                  if (memberData.remember == 'on') {
                    req.sessionOptions.maxAge =  1000 * 3600 * 24 * 30;
                  }
                  // event fire
                  self.event.emit('success', auth);
                  redirectUrl = self.loginRedirectMap[rolename] || self.loginRedirectMap.member;
                  // console.log(redirectUrl);
                  
                  return redirectUrlInSessionAfterLogin(req, res, redirectUrl);
                }

              }); // end of find role
            } else { // not set role table
              // event fire
              self.event.emit('success', auth);
              redirectUrl = self.loginRedirectMap.member;
              
              return redirectUrlInSessionAfterLogin(req, res, redirectUrl);
            }

          } else {
            self.event.emit('failed', 101, memberData);
            locals.errorMessage = self.errorMessages['101'];
            renderForm();
          }

        });  // end of loadby

      } else {
        locals.errorMessage = self.errorMessages['102'];
        self.event.emit('failed', 102, memberData);
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
    req.shine('success', self.flashMessages.logout);
    res.redirect(self.logoutRedirectUrl);
  };
};

// open to guest 
Routes.prototype.register = function () {

};


function redirectUrlInSessionAfterLogin (req, res, optionUrl) {
  var url = req.session.authUrl || optionUrl || '/';
  
  req.session.authUrl = null;
  res.redirect(url);

}
