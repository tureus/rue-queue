var RueQueue = require("../rue-queue");

var tryTimes = 3;
var rq = new RueQueue({
  name: "test-rqueue",
  maxsize: 2,
  retryWait: 1,
  callback: function(value){
    if (value === 9012 && tryTimes !== 0) {
      tryTimes -= 1;
      throw "SURPRISE!!! " + value;
    }
    console.log("going to drain: ", arguments);
  }
});

rq._drainRunning = true;
rq.push(1234);
rq.push(5678);
rq._drainRunning = false;
rq.push(9012);