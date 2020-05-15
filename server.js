let compile = require('./compilation/compile').compile;
let optimize = require('./optimization/optimize').optimize;

var express = require('express');
var server = express();

server.use(express.static(__dirname + '/frontend'));
server.use(express.json())

server.get('/', function(req, res){
    res.sendFile('frontend/index.html', {root: __dirname});
})

server.post('/compile', function(req, res){
    res.send(compile(req.body.sourceCode));
})

server.post('/optimize', function(req, res){
    res.send(optimize(req.body.C3D));
})

server.listen(8000);
console.log("Server listening on http://localhost:8000/")