var app = require('http').createServer()
var io = require('socket.io')(app);
var fs = require('fs');
var request = require('request');

app.listen(4000);

var sck; 
var cont = true;

var fileData = [];

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

var state = "";

io.on('connection', function (socket) {
    console.log("connected");
    socket.on("myeventres", function(data){
    	console.log("HERE");
    	console.log("Data for packet : " + data.packetNumber);
		console.log(data.data);
		if((data.data).length == 0){
			cont = false;
			state = "NOTRECIEVED";
		}else{
			item = {};
			item.packetNumber = data.packetNumber;
			item.data = data.data;
			fileData.push(item);
			cont = true;
		}
	});

	socket.on('myevent', function (data) {
        var fileId = data.fileId + ".txt";
        var packetNumber = data.packetNumber;
        var sourceIP = data.sourceIP;
        newSocket = require('socket.io-client')(sourceIP);

        fs.readFile(fileId, 'utf8', (err, data)=>{
        	if(err){
        		console.log("File Not present");
        		var dataToSend = "";
        		for(var i in fileData){
        			if(fileData[i].packetNumber == packetNumber){
        				console.log("Data present with me");
        				datatToSend = fileData[i].data;
        				break;
        			}
        		}
        		emitData(newSocket, dataToSend, packetNumber);

        	}else{
        		console.log("File present");
        		console.log(data);
	            var len = data.length;
	            var dataToSend = "";
	            dataToSend = data.substr(16*(packetNumber-1), 16);
	            emitData(newSocket, dataToSend, packetNumber);
        	}
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
				console.log(html);
				html = JSON.parse(html);
				for(var j in html){
					seeders.push(html[j].IpAdd);
				}

				var seederLength = seeders.length;
				var fallback = false;
				setInterval(function(){
					if(state == "NOTRECIEVED"){
						i--;
						cont=true;
						fallback = true;
						state = "RECEIVED";
					}
					if(cont && i<(size/16)){
						sourceIP = "http://" + seeders[(fallback)?0:(i%seederLength)] + ":4000";
						fallback = false;
						console.log("sourceIP : " + sourceIP);
						emitRequest(sourceIP, fileId, (i+1));
						cont = false;
						if(i==5){
							console.log("registering");
							request.get(data.trackerIP + "/addSeeder?fileId="+fileId+"&ipAdd=192.168.1.8", function(e, r, h){
								if(e){
									console.log(e);
								}else{
									console.log("registered");
								}
							});	

							var str = "";
							for(var k in fileData){
								console.log(fileData[k]);
								str += fileData[k].data;
							}

							fs.writeFile('g.txt', str, (err)=>{
								if(err){
									console.log("File not saved");
								}
							});
						}
						
						i++;

						request(trackerIP, function(e, r, h){
							if(err){
								console.log(err);
							}else{
								seeders = [];
								console.log(h);
								h = JSON.parse(h);
								for(var j in h){
									seeders.push(h[j].IpAdd);
								}
							}
						});
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


