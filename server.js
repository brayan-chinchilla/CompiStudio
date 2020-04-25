var express = require('express');
var server = express();

server.get('/', function(req, res){
    res.sendFile('frontend/index.html', {root: __dirname});
})

server.use(express.static(__dirname + '/frontend'));

server.listen(8000);
console.log("Server listening on http://localhost:8000/")