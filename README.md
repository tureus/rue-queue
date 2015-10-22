RueQueue
======

A fixed-size queue with callback invocation. If the callback fails it backs off for a fixed amount of time. Evicts the oldest data when the queue is full, it also keeps track of the number of evictions.

Usage:
```
var rq = new RueQueue({
  name: "my-cool-ruequeue",
  maxsize: 10,
  retryWait: 1000, // 1 second
  callback: function(value,queueHandle){
    console.log("going to drain: ", value);
    var success;
    // do something
    if success {
      queueHandle.success();
    } else {
      queueHandle.error();
    }
  }
});

// Elsewhere in your code...
rq.push({my: "datum", is: "cool"});

// stdout will print:
// going to drain: {my: "datum", is: "cool"}

// But if the queue starts to overflow you will get a special datum:
// {_regrets: 15}
```
