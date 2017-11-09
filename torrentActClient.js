var app = require('http').createServer()
var io = require('socket.io')(app);
var fs = require('fs');
var request = require('request');

app.listen(4000);

var sck; 
var cont = true;

var emitRequest = function(s, f, n){
	sck = require('socket.io-client')(s);
	sck.emit("myevent", {
		fileId : f,
		packetNumber : n,
		sourceIP : 'http://192.168.1.8:4000'
	});
	cont = true;
	console.log("socket emitted to " + s);
}

var emitData = function(s, data, n){
    s.emit("myeventres", {data : data, packetNumber : n});
}

io.on('connection', function (socket) {
    console.log("connected");
    socket.on("myeventres", function(data){
    	console.log("HERE");
    	console.log("Data for packet : " + data.packetNumber);
		console.log(data.data);
		cont = true;
	});

	socket.on('myevent', function (data) {
        var fileId = data.fileId;
        var packetNumber = data.packetNumber;
        var sourceIP = data.sourceIP;
        newSocket = require('socket.io-client')(sourceIP);

        fs.readFile(fileId, 'utf8', (err, data)=>{
            console.log(data);
            var len = data.length;
            var dataToSend = "";
            dataToSend = data.substr(16*(packetNumber-1), 16);
            emitData(newSocket, dataToSend, packetNumber);
        });
    });
});



var seeders = [];

var download = function(){
	fs.readFile('gdata.pin', (err, data)=> {
		data = JSON.parse(data);
		var size = Number(data.fileSize);
		var fileId = data.fileId;
		var trackerIP = (data.trackerIP)+"/getTracker?fileId="+fileId;
		i=0;
		request(trackerIP, function(err, res, html){
			if(err){
				console.log(err);
			}else{
				res = JSON.parse(res);
				for(var j in res){
					seeders.push(res[j].IpAdd);
				}

				setInterval(function(){
					if(cont && i<(size/16)){
						sourceIP = seeders[i];
						emitRequest(sourceIP, fileId, (i+1));
						cont = false;
						i++;
					}
				},5000);
			}
		});
	});
}

var isSeed = true;
process.argv.forEach(function (val, index, array) {
  // console.log(index + ': ' + val);
  if(val == "download"){
  	download();
  	isSeed = false;
  }
});

if(isSeed == true){
	console.log("Seeding Only");
}


