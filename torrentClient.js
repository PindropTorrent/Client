var app = require('http').createServer()
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(3000);

var emitData = function(s, data, n){
    s.emit("myeventres", {data : data, packetNumber : n});
}

io.on('connection', function (socket) {
    console.log("connected");
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