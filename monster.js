var Promise = require('node-promise').Promise;

var FirefoxClientP = require('./firefox-client-promises');


function main() {
  var ai = new CookieClickerAI();
  ai.start();
}


function CookieClickerAI() {
  var p = new Promise();

  this._p = p;
  this.then = p.then;
}

CookieClickerAI.prototype.start = function() {
  return new FirefoxClientP(6000).connect()
    .then(this.getTabList)
    .then(this.getCCTab)
    .then(function(cc) {
      this.cc = cc;
      this._p.resolve();
    }.bind(this))

    .then(this.setupBrowser.bind(this))
    .then(this.setupBigCookie.bind(this))
    .then(this.setupBuying.bind(this))
    .then(this.setupGoldenCookies.bind(this));
};

CookieClickerAI.prototype.getTabList = function(client) {
  return client.listTabs();
};

CookieClickerAI.prototype.getCCTab = function(tabList) {
  var p = new Promise();

  var ccTabs = tabList.filter(function(tab) {
    return (/orteil.dashnet.org\/cookieclicker/).exec(tab.url);
  });

  var stdin = process.openStdin();

  if (ccTabs.length <= 0) {
    p.reject('No cookie clicker tabs found');

  } else if (ccTabs.length === 1) {
    p.resolve(ccTabs[0]);

  } else {
    console.log('There are ' + ccTabs.length  + ' cookie clicker tabs.');
    ccTabs.forEach(function(tab, i) {
      console.log(i + ') ' + tab.tab.title + ' (' + tab.url + ')');
    });
    process.stdout.write('Which one do you want?\n> ');

    var parseInput = function(data) {
      var choice = ccTabs[parseInt(data, 10)];

      if (choice === undefined) {
        process.stdout.write('Invalid\n> ');
      } else {
        p.resolve(choice);
        stdin.removeListener('data', parseInput);
      }
    };
    stdin.addListener('data', parseInput);
  }

  return p;
};

CookieClickerAI.prototype.setupBrowser = function() {
  function inBrowser() {
    window.monster = window.monster || {};
    window.alert = function() { return true; };
    window.confirm = function() { return true; };
  }

  return this.cc.Console.evaluateJS(iife(inBrowser));
};

CookieClickerAI.prototype.setupBigCookie = function() {
  var start = new Date();
  var t = 0;
  var metricStride = 30000;

  var click = function() {
    this.clickCookie().then(function() {
      setImmediate(click);

      t++;
      if (t >= metricStride) {
        var now = new Date();
        var clicksPerMs = t / (now - start);3
        t = 0;
        start = now;

        this.getClickNumber().then(function(cookiesPerClick) {
          var clicks = Math.round(clicksPerMs * 1000);
          var cps = Math.round(clicksPerMs * 1000 * cookiesPerClick);
          console.log('Clicking:', clicks, 'clicks/s,', cps, 'cookies/second');
        });
      }
    }.bind(this));
  }.bind(this);
  click();
};

CookieClickerAI.prototype.setupBuying = function() {
  setInterval(function() {
    this.buySomething().then(function(bought) {
      if (bought) {
        console.log('Bought', bought);
      }
    });
  }.bind(this), 1000);
};

CookieClickerAI.prototype.setupGoldenCookies = function() {
  function inBrowser() {
    var cookie = $('#goldenCookie');
    if (cookie) {
      var opacity = parseFloat(cookie.style.opacity);
      var display = cookie.style.display;
      if (display !== 'none' && opacity > 0.25) {
        cookie.click();
        return true;
      }
    }
    return false;
  }

  setInterval(function() {
    this.cc.Console.evaluateJS(iife(inBrowser)).then(function(resp) {
      if (resp.exception) {
        console.log('Exception!', resp.exception);
      } else {
        if (resp.result === true) {
          console.log('Clicked a golden cookie!');
        }
      }
    });
  }.bind(this), 1000);
};

CookieClickerAI.prototype.clickCookie = function() {
  var p = new Promise();

  var clientSide = function() {
    if (!monster.bigCookie) {
      monster.bigCookie = $('#bigCookie');
    }
    monster.bigCookie.click();
    // $('#bigCookie').click();
  };

  this.cc.Console.evaluateJS(iife(clientSide)).then(function(resp) {
    if (resp.exception) {
      console.log('Exception!', resp.exception);
    }
    p.resolve();
  });

  return p;
};

CookieClickerAI.prototype.getCPS = function() {
  var p = new Promise();
  function inBrowser() {
    return $('#cookies div').textContent;
  }
  this.cc.Console.evaluateJS(iife(inBrowser)).then(function(res) {
    var match = /per second : ([\d,.]+)/.exec(res.result);
    if (!match) {
        p.reject('Could not find CPS.');
    }
    var cpsText = match[1].replace(/,/g, '');
    p.resolve(parseFloat(cpsText));
  });
  return p;
};

CookieClickerAI.prototype.getProducts = function() {
  var re = (/• (\d+) ([\w ]+)• producing ([\d,.]+) cookies per second.*/);
  function inBrowser() {
    return $$;
  }
};

CookieClickerAI.prototype.getClickNumber = function() {
  var p = new Promise();

  function inBrowser() {
    var elem = $('.cookieNumber');
    if (elem) {
      return elem.textContent;
    } else {
      return null;
    }
  }

  this.cc.Console.evaluateJS(iife(inBrowser)).then(function(res) {
    var clickNumber = parseFloat(res.result.replace(/,/g, ''));
    p.resolve(clickNumber);
  });

  return p;
};

CookieClickerAI.prototype.buySomething = function() {
  var p = new Promise();

  function inBrowser() {
    var product = $$('#upgrades .upgrade.enabled:not([onclick*="84"])') 
    if (!product.length) {
        product = $$('.product.enabled');
    }
    product = product[product.length - 1];
    if (product) {
      product.click();
      var name = product.querySelector('.title');
      if (name === null) {
        return 'an upgrade';
      } else {
        return name.textContent;
      }
    }
    return null;
  }

  this.cc.Console.evaluateJS(iife(inBrowser)).then(function(res) {
    var type = res.result.type;
    if (type === 'null') {
      p.resolve(null);
    } else if (type === 'undefined') {
      console.log(res);
      throw 'Something went wrong trying to buy something';
    } else {
      p.resolve(res.result);
    }
  });

  return p;
};


function iife(func) {
  return '(' + func.toString() + ')();';
}


main();
