var request = require("request");
var pingPacket = 'abcdefghijklmnop';
var endPoint = 12;

var ping = require('ping');

var perf = require('execution-time')();
var hosts = ['google.com'];
hosts.forEach(function(host){
	perf.start();
    ping.sys.probe(host, function(isAlive){
        var msg = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';
        console.log(msg);
        var t = perf.stop();
    	console.log("Time taken : " + Math.floor(t.time) + " milliseconds");
    });
    
});