exports.create = create;


var yi = require('yi');
var Dashboards = require('jsoncan-dashboard');
var tables = {};

tables.roles = {
  basic: {
    title: 'roles info',
    description: 'roles defined table',
    max: 20
  },
  list: {
    showFields: ['seq', 'name|link'],
    order: ['seq']
  },
  view: {
    showFields: ['name', 'seq', 'description'],
    hasMany: {
      table: 'members',
      title: 'members',
      viewLinkField: 'username|link',
      order: ['created', true]
    }
  }
};

tables.members = {
  basic: {
    title: 'members',
    description: 'members management',
    max: 1000,
    formLayout: [['_role', 'username', 'password'], 'email', 'isAdmit']
  },
  list: {
    showFields: ['username|link', '_role.name|link', 'isAdmit', 'created'],
    query: {
      name: 'roles.name',
      title: 'role',
      order: ['seq']
    }
  },
  view: {
    showFields: ['username', '_role.name|link', 'email', 'isAdmit', 'created']
  }
};

function create (can, settings) {
  
  var dashboards = new Dashboards(can, settings, tables);

  dashboards.addIndexPage();

  // console.log(dashboards);
  return dashboards.app;
}