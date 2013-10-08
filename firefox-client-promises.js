var FirefoxClient = require('firefox-client');
var Promise = require('node-promise').Promise;

function cbWith(p, res) {
  return function(err) {
    if (err) {
      p.reject(err);
    }
    p.resolve(res);
  }
}

function cbRes(p) {
  return function(err, res) {
    if (err) {
      p.reject(err);
    }
    p.resolve(res);
  }
}


function ClientWrapper() {
  this.fx = new FirefoxClient();
}

ClientWrapper.prototype.connect = function(port, host) {
  if (arguments.length === 0) {
    port = 6000;
  }
  if (arguments.length <= 1) {
    host = 'localhost';
  }

  var p = new Promise();
  this.fx.connect(port, host, cbWith(p, this));
  return p;
}

ClientWrapper.prototype.disconnect = function() {
  this.fx.disconnect();
}

ClientWrapper.prototype.listTabs = function() {
  var p = new Promise();
  this.fx.listTabs(cbRes(p));
  return p.then(function(tabs) {
    return tabs.map(function(tab) {
      return new TabWrapper(tab);
    });
  });
};

ClientWrapper.prototype.Console = {};

function TabWrapper(tab) {
  this.tab = tab;
  this.url = tab.url;
  this.Console = new Console(this);
}

TabWrapper.prototype.Console = {};
TabWrapper.prototype.Console.prototype = TabWrapper.prototype;

TabWrapper.prototype.evaluateJS = function(code) {
  var p = new Promise();
  this.tab.Console.evaluateJS(code, cbRes(p));
  return p;
};


function Console(tabwrap) {
  this.tabwrap = tabwrap;
  this.tab = tabwrap.tab;
}

Console.prototype.evaluateJS = function(code) {
  var p = new Promise();
  this.tab.Console.evaluateJS(code, cbRes(p));
  return p;
};


module.exports = ClientWrapper;
