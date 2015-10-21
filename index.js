/*jslint node: true */
"use strict";

var util = require('util');
var EventEmitter = require('events');

var RueQueue = function (params) {
  EventEmitter.call(this);
  this.setMaxListeners(1);

  if (typeof params.maxsize !== 'number' || params.maxsize < 1) {
    throw "must set maxsize";
  } else if (typeof params.callback !== 'function') {
    throw "must set callback function";
  } else if (typeof params.name !== 'string' || params.name.length === 0) {
    throw "must provide name";
  }

  this.name = params.name;
  this.queue = [];
  this.maxsize = params.maxsize;
  // this._regrets = 0;
  this.callback = params.callback;
  this.retryWait = params.retryWait || 5000;
  this.verbose = params.verbose || false;

  this.push = function (val) {
    if (this.queue.length+1 > this.maxsize) {
      // this._regrets += 1;
      var maybe_regret = this.queue.pop(); // end of the array is the oldest data
      if (typeof maybe_regret._regret !== 'undefined') {
        this.queue.pop(); // get rid of the oldest data
        maybe_regret._regret += 1;
        this.queue.push(maybe_regret);
      } else {
        this.queue.push({_regret: 1});
      }
    }

    this.queue.unshift(val);
    this.emit('drain');
  };

  this.on('error', function() {
    this.resetDrainRetryTimer();
  });

  this.on('success', function() {
    this.queue.pop();
    this.emit('drain');
  });

  var me = this;
  this.success = function(){
    if (me.verbose) {
      console.log("callback invoked success");
    }
    me.emit('success');
  };

  this.error = function(){
    if (me.verbose) {
      console.log("callback invoked error");
    }
    me.emit('error');
  };

  this._drainRunning = false;
  this.on('drain', function(){
    if (this.queue.length === 0) {
      // We stop trying to process messages
      return;
    }

    var entry = this.queue[this.queue.length-1]; // peek
    try {
      this.callback(entry,this);
    } catch(e) {
      if (this.verbose) {
        console.log("RueQueue(", this.name, ") callback died with: ", e, this.queue);
      } else {
        console.log("RueQueue(", this.name, ") callback died with: ", e);
      }
      this.resetDrainRetryTimer();
    }
  });

  this._drainRetryTimer = null;
  this.resetDrainRetryTimer = function() {
    if (typeof this._drainRetryTimer !== 'undefined') {
      clearTimeout(this._drainRetryTimer);
    }

    var me = this;
    this._drainRetryTimer = setTimeout(function() {
      me.emit('drain');
    }, this.retryWait);
  };
};

util.inherits(RueQueue, EventEmitter);

module.exports = function(params) {
  return new RueQueue(params);
};
