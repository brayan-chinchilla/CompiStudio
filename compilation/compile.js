let fs = require('fs'); 
let parser = require('./grammar');

const TYPE_OP = require('./util').TYPE_OP

let Scope = require('./util').Scope
let Symbol = require('./util').Symbol
let Error = require('./util').Error

let isImplicitCast = require('./util').isImplicitCast;

let collectGlobals = require('./collectGlobals').collectGlobals;

let getExpType = require('./expTypes').getExpType;

let isPrimType = require('./util').isPrimType;

let gen3D = require('../gen3D/gen3D').gen3D;
let genDOT_AST = require('../genDOT_AST').genDOT_AST;

function throwError(detail, statement){
    throw {type:"SEMANTIC", detail: detail, line:statement.line, column: statement.column}
}

function buildSymbolTable(statements, currentScope, isGlobal){
    statements.forEach( (statement) => {
        try{
            if(statement.type == TYPE_OP.DEFINE_STRC){
                //do nothing
            }
            else if(statement.type == TYPE_OP.DECLAR){
                if(isGlobal){
                    var sym = currentScope.getSymbol(_symbolTable, statement.id);

                    //put type if it was not explicit
                    if(statement.jType.toUpperCase() == 'VAR' || statement.jType.toUpperCase() == 'CONST' || statement.jType.toUpperCase() == 'GLOBAL'){
                        var expType = getExpType(statement.exp, _symbolTable, currentScope);
                        sym.jType = expType;

                        sym.type = isPrimType(sym.jType) ? "_global_prim" : "_global_obj";
                        if(statement.jType.toUpperCase() == 'CONST')
                            sym.const = true;
                    }
                    //verify type if it was explicit
                    else{
                        if(statement.exp != null){
                            var expType = getExpType(statement.exp, _symbolTable, currentScope);
                            if(statement.jType.toUpperCase() != expType.toUpperCase()){

                                if(! isImplicitCast(statement.jType, expType))
                                    throwError(`Type missmatch\n${statement.jType} = ${expType}`, statement);
                            }
                        }
                    }
                }
                else{
                    var sym = new Symbol(statement.id, isPrimType(statement.jType) ? "_local_prim" : "_local_obj", statement.jType, currentScope.id, 1, _relativePos++);
                    currentScope.addSymbol(sym);

                    //put type if it was not explicit
                    if(statement.jType.toUpperCase() == 'VAR' || statement.jType.toUpperCase() == 'CONST' || statement.jType.toUpperCase() == 'GLOBAL'){
                        var expType = getExpType(statement.exp, _symbolTable, currentScope);
                        sym.jType = expType;

                        sym.type = isPrimType(sym.jType) ? "_local_prim" : "_local_obj";
                        if(statement.jType.toUpperCase() == 'CONST')
                            sym.const = true;
                    }
                    //verify type if it was explicit
                    else{
                        if(statement.exp != null){
                            var expType = getExpType(statement.exp, _symbolTable, currentScope);
                            if(statement.jType.toUpperCase() != expType.toUpperCase()){

                                if(! isImplicitCast(statement.jType, expType))
                                    throwError(`Type missmatch\n${statement.jType} = ${expType}`, statement);
                            }
                        }
                    }
                }
            }
            else if(statement.type == TYPE_OP.ASSIGN){
                var typeSym = getExpType(statement.id, _symbolTable, currentScope);
                var typeExp = getExpType(statement.exp, _symbolTable, currentScope);

                if(typeSym != typeExp && !isImplicitCast(typeSym, typeExp))
                    throwError(`Type missmatch\n${typeSym} = ${typeExp}`, statement);
            }
            else if(statement.type == TYPE_OP.IF){
                var newScope = addScope("if", "Block", currentScope.id);
                buildSymbolTable(statement.ifTrue, newScope, false);

                if(statement.ifFalse){
                    buildSymbolTable(statement.ifFalse, currentScope, false)
                }
            }
            else if(statement.type == TYPE_OP.SWITCH){
                var newScope = addScope("switch", "Block", currentScope.id);

                statement.cases.forEach((c) => {
                    buildSymbolTable(c.ifTrue, newScope, false);
                })
            }
            else if(statement.type == TYPE_OP.FOR){
                var newScope = addScope("for", "Block", currentScope.id);
                if(statement.init)
                    buildSymbolTable([statement.init], newScope, false);
                if(statement.update)
                    buildSymbolTable([statement.update], newScope, false);

                buildSymbolTable(statement.block, newScope, false);
            }
            else if(statement.type == TYPE_OP.WHILE){
                var newScope = addScope("while", "Block", currentScope.id);
                buildSymbolTable(statement.block, newScope, false);
            }
            else if(statement.type == TYPE_OP.DO_WHILE){
                var newScope = addScope("do_while", "Block", currentScope.id);
                buildSymbolTable(statement.block, newScope, false);
            }
            else if(statement.type == TYPE_OP.FUNC_DEF){
                //save _relativePos
                var relativePosTmp = _relativePos;                        
                
                //reserve one for return
                _relativePos = 1;

                var funcId = "_func_" + statement.name;
                statement.params.forEach((param) => {
                    funcId += "-" + param.jType
                })
                var newScope = addScope(funcId, "func", "_global");

                statement.params.forEach((param) => {
                    var sym = new Symbol(param.id, isPrimType(param.jType) ? "_local_prim" : "_local_obj", param.jType, newScope.id, 1, _relativePos++)
                    newScope.addSymbol(sym);
                })

                buildSymbolTable(statement.block, newScope, false);

                //update size of scope and size of symbol in global scope
                newScope.size = _relativePos;
                currentScope.getSymbol(_symbolTable, funcId, true).size = _relativePos;

                //restore relativePos
                _relativePos = relativePosTmp;
            }
            else if(statement.type == TYPE_OP.IMPORT){
                //do nothing
            }
            //pending implementation
            else if(statement.type == TYPE_OP.CALL){

            }
            else if(statement.type == TYPE_OP.CALL_JS){
                
            }
            else if(statement.type == TYPE_OP.RETURN){

            }
            else if(statement.type == TYPE_OP.THROW){

            }
            else if(statement.type == TYPE_OP.TRY){

            }
            else{
                //TODO
                console.error(statement.type + " aun no ha sido implementado");
            }
        }catch(error){
            console.log(error);
            _errores.push(error);
        }
    })
}

function addScope(id, type, padre_id){
    if(type == "Block"){
        id = id + "_" + (_idBlock++)
    }
    var scope = new Scope(id, type, padre_id);
    _symbolTable.push(scope);

    return scope;
}

function parseSource(fileName){
    let ast = [];
    try {
        // leemos nuestro archivo de entrada
        const entrada = fs.readFileSync(__dirname + '/../entradas/' + fileName);
        // invocamos a nuestro parser con el contendio del archivo de entradas
        parsedSource = parser.parse(entrada.toString());
        ast = parsedSource.ast;
        _errores = _errores.concat(parsedSource.errores);
    } catch (e) {
        console.error(e);
    }
    return ast;
}

function compile(ast){

    //Get import statement and add all funcs to current AST
    var importStatement = ast.find((statement) => statement.type == TYPE_OP.IMPORT);
    if(importStatement){
        importStatement.imports.forEach((fileName) => {
            parseSource(fileName).filter((globalStatement) => globalStatement.type == TYPE_OP.FUNC_DEF).forEach((func) => {
                ast.push(func);
            })
        })
    }

    //print AST in json format
    fs.writeFileSync(__dirname + '/../debug/ast.json', JSON.stringify(ast));

    var scope_Global = addScope("_global", "_global", null);
    _relativePos = 0;
    _idBlock = 0;
    
    //navigate AST to add globals (define and global var)
    collectGlobals(ast, _symbolTable);

    //build symboltable and type-check
    buildSymbolTable(ast, scope_Global, true);

    //print SymbolTable in json format
    fs.writeFileSync(__dirname + '/../debug/st.json', JSON.stringify(_symbolTable));

    return gen3D(_symbolTable, ast);
}

var _relativePos = 0;
var _idBlock = 0;
var _symbolTable = [];
var _errores = [];

module.exports.compile = (sourceStr) => {
    _relativePos = 0;
    _idBlock = 0;
    _symbolTable = [];
    _errores = [];
    try {
        // invocamos a nuestro parser con el contendio del archivo de entradas
        var parsedSource = parser.parse(sourceStr);
        var ast = parsedSource.ast;
        _errores = _errores.concat(parsedSource.errores);

        var C3D = compile(ast);
        
        //prepare symbolTable for report
        symbolTableUnified = [];
        _symbolTable.forEach(scope => {
            symbolTableUnified = symbolTableUnified.concat(scope.symbols);
        })

        return {C3D: C3D, errorTable: _errores, symbolTable: symbolTableUnified, ast: genDOT_AST(ast)}

    } catch (e) {
        console.error(e);
        symbolTableUnified = [];
        _symbolTable.forEach(scope => {
            symbolTableUnified.concat(symbolTableUnified, scope.symbols);
        })
        return {C3D: "#error", errorTable: _errores, symbolTable: symbolTableUnified, ast: "digraph ast{}"}
    }
}