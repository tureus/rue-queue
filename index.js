/*jslint node: true */
"use strict";

var util = require('util');
var EventEmitter = require('events');

var RegretfulQueue = function (params) {
  EventEmitter.call(this);
  this.setMaxListeners(1);

  if (typeof params.maxsize !== 'number' || params.maxsize < 1) {
    throw "must set maxsize";
  } else if (typeof params.callback !== 'function') {
    throw "must set callback function";
  } else if (typeof params.name !== 'string' || params.name.length === 0) {
    throw "must provide name";
  } else if (typeof params.regretsCallback !== 'function') {
    console.log("note, you can provide an optional regretsCallback");
  }

  this.name = params.name;
  this.queue = [];
  this.maxsize = params.maxsize;
  this._regrets = 0;
  this.callback = params.callback;
  this.regretsCallback = params.regretsCallback;

  this.push = function (val) {
    if (this.queue.length+1 > this.maxsize) {
      this._regrets += 1;
      this.queue.pop(); // end of the array is the oldest data
    }

    this.queue.unshift(val);
    this.emit('drain');
  };

  this.regrets = function() {
    return this._regrets;
  };

  this.list = function (val) {
    return this.queue;
  };

  this._drainRunning = false;
  this.on('drain', function(){
    console.log('called drain: ', this.queue);
    if (this._drainRunning) {
      return;
    }

    this._drainRunning = true;
    for (var i=this.queue.length-1; i > -1; i--) {
      console.log("state:", i, "queue: ", this.queue);
      try {
        var entry = this.queue[i];
        this.callback(entry);
        this.queue.splice(i, 1);
      } catch(e) {
        console.log("RegretfulQueue(", this.name, ") callback died with: ", e);
        this.resetDrainRetryTimer();
      }
    }
    this._drainRunning = false;
  });

  this.resetTime = 5000;
  this._drainRetryTimer = null;
  this.resetDrainRetryTimer = function() {
    if (typeof this._drainRetryTimer !== 'undefined') {
      clearTimeout(this._drainRetryTimer);
    }

    var me = this;
    this._drainRetryTimer = setTimeout(function() {
      me.emit('drain');
    }, this.resetTime);
  };
};
util.inherits(RegretfulQueue, EventEmitter);

var tryTimes = 3;
var rq = new RegretfulQueue({
  name: "test-rqueue",
  maxsize: 2,
  callback: function(value){
    if (value === 9012 && tryTimes !== 0) {
      tryTimes -= 1;
      throw "SURPRISE!!! " + value;
    }
    console.log("going to drain: ", arguments);
  },
  regretsCallback: function(regrets) {
    console.log("I have", regrets, "regrets");
  }
});

rq._drainRunning = true;
rq.push(1234);
rq.push(5678);
rq._drainRunning = false;
rq.push(9012);

module.exports = function(params) {
  return new RegretfulQueue(params);
};
