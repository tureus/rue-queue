var RueQueue = require("../rue-queue");

var throwError = true;
var rq = new RueQueue({
  name: "test-rqueue",
  maxsize: 2,
  retryWait: 1,
  verbose: true,
  callback: function(value,queueHandle){
    if (throwError) {
      queueHandle.error();
      return;
      // throw "SURPRISE!!! " + value;
    }
    console.log("going to drain: ", value);
    queueHandle.success();
  }
});

rq.push(1);
rq.pushNoDrain(2);
rq.push(3);
rq.push(4);
rq.push(5);
rq.push(6);
throwError = false;
