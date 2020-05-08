var fs = require('fs'); 
var parser = require('./grammar');

let ast;

try {
    // leemos nuestro archivo de entrada
    const entrada = fs.readFileSync('./entrada.txt');
    // invocamos a nuestro parser con el contendio del archivo de entradas
    ast = parser.parse(entrada.toString());

    // imrimimos en un archivo el contendio del AST en formato JSON
    fs.writeFileSync('./ast.json', JSON.stringify(ast));
} catch (e) {
    console.error(e);
    return;
}
console.log("................................................ seems ok");