var fs = require('fs'); 
var parser = require('./grammar');

const TYPE_OP = require('./instructions').TYPE_OP
let Scope = require('./util').Scope
let Symbol = require('./util').Symbol
let Error = require('./util').Error

function buildST(statements, currentScope, isGlobal){
    statements.forEach( (statement) => {

        if(statement.type == TYPE_OP.DEFINE_STRC){
            var newScope = addScope("_obj_" + statement.id, "strc_def", null);

            //save and restore relative Pos
            var relativePosTmp = relativePos;
            relativePos = 0;
            buildST(statement.l_declar, newScope, false);
            newScope.size = relativePos;
            relativePos = relativePosTmp;

        }
        else if(statement.type == TYPE_OP.DECLAR){
            var sym = new Symbol(statement.id, isGlobal ? "var_global" : "var_local", statement.jType, currentScope.id, 1, relativePos++);
            currentScope.addSymbol(sym);
            //TODO validation
        }
        else if(statement.type == TYPE_OP.IF){
            var newScope = addScope("if", "Block", currentScope.id);
            buildST(statement.ifTrue, newScope, false);

            if(statement.ifFalse){
                buildST(statement.ifFalse, currentScope, false)
            }
        }
        else if(statement.type == TYPE_OP.SWITCH){
            var newScope = addScope("switch", "Block", currentScope.id);

            statement.cases.forEach((c) => {
                buildST(c.ifTrue, newScope, false);
            })
        }
        else if(statement.type == TYPE_OP.FOR){
            var newScope = addScope("for", "Block", currentScope.id);
            if(statement.init)
                buildST([statement.init], newScope, false);
            if(statement.update)
                buildST([statement.update], newScope, false);

            buildST(statement.block, newScope, false);
        }
        else if(statement.type == TYPE_OP.WHILE){
            var newScope = addScope("while", "Block", currentScope.id);
            buildST(statement.block, newScope, false);
        }
        else if(statement.type == TYPE_OP.DO_WHILE){
            var newScope = addScope("do_while", "Block", currentScope.id);
            buildST(statement.block, newScope, false);
        }
        else if(statement.type == TYPE_OP.FUNC_DEF){
            //save relativePos
            var relativePosTmp = relativePos;                        
            
            //reserve one for return
            relativePos = 1;

            var funcId = "_func_" + statement.name;
            statement.params.forEach((param) => {
                funcId += "-" + param.jType
            })
            var newScope = addScope(funcId, "func", "_global");

            statement.params.forEach((param) => {
                var sym = new Symbol(param.id, "var_local", param.jType, newScope.id, 1, relativePos++)
                newScope.addSymbol(sym);
            })

            buildST(statement.block, newScope, false);

            //update size and restore relativePos
            newScope.size = relativePos;
            relativePos = relativePosTmp;

            currentScope.addSymbol(new Symbol(funcId, "func", statement.returnType, "_global", newScope.size, -1))
        }
        else{
            //TODO
            console.error(statement.type + " aun no ha sido implementado");
        }
    })
}

function addScope(id, type, padre_id){
    if(type == "Block"){
        id = id + "_" + (idBlock++)
    }
    var scope = new Scope(id, type, padre_id);
    symbolTable.push(scope);

    return scope;
}

let ast;

try {
    // leemos nuestro archivo de entrada
    const entrada = fs.readFileSync('../entradas/entrada.txt');
    // invocamos a nuestro parser con el contendio del archivo de entradas
    ast = parser.parse(entrada.toString());

    // imrimimos en un archivo el contendio del AST en formato JSON
    fs.writeFileSync('./ast.json', JSON.stringify(ast));
} catch (e) {
    console.error(e);
    return;
}
console.log("................................................ parse seems ok");


var symbolTable = [];
var scope_Global = addScope("_global", "global", null);

var relativePos = 0;
var idBlock = 0;

buildST(ast, scope_Global, true);
fs.writeFileSync('./st.json', JSON.stringify(symbolTable));