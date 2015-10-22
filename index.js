/*jslint node: true */
"use strict";

var util = require('util');
var EventEmitter = require('events');

var RueQueue = function (params) {
  if (typeof params.maxsize !== 'number' || params.maxsize < 1) {
    throw "must set maxsize";
  } else if (typeof params.callback !== 'function') {
    throw "must set callback function";
  } else if (typeof params.name !== 'string' || params.name.length === 0) {
    throw "must provide name";
  }

  EventEmitter.call(this);
  this.setMaxListeners(1);

  console.log("creating RueQueue", params.name);

  this.name = params.name;
  this._queue = [];
  this.maxsize = params.maxsize;
  this.callback = params.callback;
  this.retryWait = params.retryWait || 5000;
  this.verbose = params.verbose || false;

  this.log = function() {
    var args = [];
    for(var i=0; i<arguments.length; i++){
      args.push(arguments[i]);
    }
    args.unshift("RueQueue(" + this.name + ")");
    console.log.apply(null, args);
  };

  this.push = function (val,doDrain) {
    if (this._queue.length+1 > this.maxsize) {

      var maybe_regret = this._queue.pop(); // end of the array is the oldest data
      if (typeof maybe_regret._regrets !== 'undefined') {
        this._queue.pop(); // get rid of the oldest data
        maybe_regret._regrets += 1;
        this._queue.push(maybe_regret);
      } else {
        this._queue.push({_regrets: 1});
      }

    }

    this._queue.unshift(val);

    // if they don't specify anything assume 'drain'
    if (typeof doDrain === 'undefined') {
      this.emit('drain');
    }
  };

  this.pushNoDrain = function(val) {
    this.push(val,false);
  }

  this.on('error', function() {
    this.resetDrainRetryTimer();
  });

  this.on('success', function() {
    this._queue.pop();
    this.emit('drain');
  });

  var me = this;
  this.success = function(){
    me.emit('success');
  };

  this.error = function(){
    me.emit('error');
  };

  this.on('drain', function(){
    if (this._queue.length === 0) {
      return; // We stop trying to process messages until more are enqueued
    }

    var entry = this._queue[this._queue.length-1]; // peek
    try {
      this.callback(entry,this);
    } catch(e) {
      this.log("RueQueue(", this.name, ") callback died with: ", e);
      this.resetDrainRetryTimer();
    }
  });

  this._drainRetryTimer = null;
  this.resetDrainRetryTimer = function() {
    clearTimeout(this._drainRetryTimer);

    var me = this;
    this._drainRetryTimer = setTimeout(function() {
      // me.log("resetDrainRetryTimer calling 'drain'");
      me.emit('drain');
    }, this.retryWait);
  };

};

util.inherits(RueQueue, EventEmitter);

module.exports = function(params) {
  return new RueQueue(params);
};
