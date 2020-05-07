var express = require('express');
var server = express();

server.use(express.json())

server.get('/', function(req, res){
    res.sendFile('frontend/index.html', {root: __dirname});
})

server.post('/compile', function(req, res){
    console.log(req.body.sourceCode);
    res.send({
        C3D: "Codigo 3D"
    });
})

server.post('/optimize', function(req, res){
    console.log(req.body.C3D);
    res.send({
        C3D_Optimizado: "Optimizado"
    })
})

server.post('/execute', function(req, res){
    console.log(req.body.C3D);
    res.send({
        console: "Consola"
    })
})

server.use(express.static(__dirname + '/frontend'));

server.listen(8000);
console.log("Server listening on http://localhost:8000/")