const TYPE_OP = require('./util').TYPE_OP
const TYPE_VAL = require('./util').TYPE_VAL

let Symbol = require('./util').Symbol
let Scope = require('./util').Scope

const isPrimType = require('./util').isPrimType

var _globalScope;
var _globalPos;
var _symbolTable;

module.exports.collectGlobals = function collectGlobals(instructions, symbolTable){
    _symbolTable = symbolTable;
    _globalScope = symbolTable[0];
    _globalPos = 0;
    processInstructions(instructions, true);
    _globalScope.size = _globalPos;
}

function addScope(id, type, padre_id){
    var scope = new Scope(id, type, padre_id);
    _symbolTable.push(scope);

    return scope;
}

/**
 * Traverse AST and collect global vars, no creation of scopes
 * @param {[]} instructions 
 */
function processInstructions(instructions, isGlobal = false){
    instructions.forEach((instruction) => {
        if(instruction.type == TYPE_OP.DECLAR){
            //if we're on global scope, then add and mark as ready
            if(isGlobal){
                var sym = new Symbol(instruction.id, isPrimType(instruction.jType) ? "_global_prim" : "_global_obj", instruction.jType, "_global", 1, _globalPos++);
                _globalScope.addSymbol(sym);
            }
            else if(instruction.jType.toLowerCase == "global"){
                var sym = new Symbol(instruction.id, isPrimType(instruction.jType) ? "_global_prim" : "_global_obj", instruction.jType, "_global", 1, _globalPos++);
                _globalScope.addSymbol(sym);
            }
        }
        else if(instruction.type == TYPE_OP.DEFINE_STRC){
            var newScope = addScope("_obj_" + instruction.id.toUpperCase(), "_obj_def", null);

            var relativePos = 0;                    
            //Add all other properties to the scope
            instruction.l_declar.forEach((declar) => {
                newScope.addSymbol(new Symbol(declar.id, isPrimType(instruction.jType) ? "_property_prim" : "_property_obj", declar.jType, newScope.id, 1, relativePos++));
            });
            newScope.size = relativePos;

            _globalScope.addSymbol(new Symbol("_obj_" + instruction.id, "_obj_def", instruction.id, "_global", 1, _globalPos++))
        }
        else if(instruction.type == TYPE_OP.FUNC_DEF){

            var funcId = "_func_" + instruction.name;
            instruction.params.forEach((param) => {
                funcId += "-" + param.jType
            })
            //add function name to global scope
            _globalScope.addSymbol(new Symbol(funcId, "func", instruction.returnType, "_global", 0, -1))

            processInstructions(instruction.block);
        }
        else if(instruction.type == TYPE_OP.IF){
            processInstructions(instruction.ifTrue);
            if(instruction.ifFalse)
                processInstructions([instruction.ifFalse]);
        }
        else if(instruction.type == TYPE_OP.SWITCH){
            instruction.cases.forEach((c) => {
                processInstructions(c.ifTrue);
            })
        }
        else if(instruction.type == TYPE_OP.FOR){
            if(instruction.init)
                processInstructions([instruction.init]);
            if(instruction.update)
                processInstructions([instruction.update]);

            processInstructions(instruction.block);
        }
        else if(instruction.type == TYPE_OP.WHILE || instruction.type == TYPE_OP.DO_WHILE){
            processInstructions(instruction.block);
        }
        else if(instruction.type == TYPE_OP.TRY){
            processInstructions(instruction.tryBlock);
            processInstructions(instruction.catchBlock);
        }
        else{
            //just skip any other statement
        }
    })
}