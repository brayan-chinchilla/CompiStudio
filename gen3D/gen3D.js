let TYPE_OP = require('../compilation/util').TYPE_OP
let TYPE_VAL = require('../compilation/util').TYPE_VAL
let isPrimType = require('../compilation/util').isPrimType;

var _symbolTable;
var _currentScope;
var _localScopeCount;

var _output;

var _display;
var _numTmp;
var _numTag;

function genTmp(){
    return "t" + _numTmp++;
}

function genLabel(){
    return "L" + _numTag++;
}

function addDisplay(typeDisplay, startLabel, endLabel, newScope){
    _display.push({type: typeDisplay, startLabel: startLabel, endLabel: endLabel});
    previousScope = _currentScope;
    _currentScope = newScope;
}

function removeDisplay(){
    _currentScope = previousScope;
    return _display.pop();
}

module.exports.gen3D = (symbolTable, instructions) => {
    _symbolTable = symbolTable;
    _currentScope = symbolTable[0];
    _localScopeCount = 0;
    _output = [];
    _display = [];
    _numTmp = _numTag = 0;

    gen3D(instructions);

    var declarTmps = "var ";
    for(var i = 0; i < _numTmp - 1; i++){
        declarTmps += "t" + i + ", ";
    }
    declarTmps += "t" + (_numTmp - 1) + ";\n";

    return declarTmps + _output.join("\n");
}

function gen3D(instructions){
    _output.push("var P, H;");
    _output.push("var heap[];")
    _output.push("var stack[];")
    _output.push("\nproc _init begin");
    _output.push(`H = ${_currentScope.size};`);
    _output.push("P = 0;")

    //initialize defines and globals so they point to null
    gen3D_initializeGlobalSyms();

    //execute globals
    gen3D_executeGlobals(instructions.filter(inst => inst.type == TYPE_OP.DECLAR || inst.type == TYPE_OP.DEFINE_STRC))

    _output.push("call principal;")

    var labelEndProgram = genLabel();
    _output.push(`goto ${labelEndProgram};`)
    _output.push("end")

    //gen3D for funcs
    gen3D_funcs(instructions.filter(inst => inst.type == TYPE_OP.FUNC_DEF))

    //proc that works as end marker
    _output.push(`\n${labelEndProgram}:`);
}

function gen3D_funcs(functions){
    functions.forEach(func => {
        var funcId = "_func_" + func.name;
        func.params.forEach((param) => {
            funcId += "-" + param.jType
        })

        _output.push(`\nproc ${funcId} begin`);

        addDisplay("_func", null, genLabel(), _symbolTable.find(scope => scope.id == funcId))

        //gen3D_local
        _localScopeCount = 0;
        gen3D_LocalBlock(func.block);

        _output.push(`${removeDisplay().endLabel}:`)
        _output.push("end");
    })
}

function gen3D_LocalBlock(instructions){
    instructions.forEach(inst => {

        //TODO pending implementation
        if(inst.type == TYPE_OP.DEFINE_STRC){
        }
        else if(inst.type == TYPE_OP.DECLAR){
        }
        else if(inst.type == TYPE_OP.ASSIGN){
        }
        else if(inst.type == TYPE_OP.IF){
        }
        else if(inst.type == TYPE_OP.SWITCH){
        }
        else if(inst.type == TYPE_OP.FOR){
        }
        else if(inst.type == TYPE_OP.WHILE){
        }
        else if(inst.type == TYPE_OP.DO_WHILE){
        }
        else if(inst.type == TYPE_OP.FUNC_DEF){
        }
        else if(inst.type == TYPE_OP.IMPORT){
        }
        else if(inst.type == TYPE_OP.CALL){
        }
        else if(inst.type == TYPE_OP.CALL_JS){
        }
        else if(inst.type == TYPE_OP.RETURN){
        }
        else if(inst.type == TYPE_OP.THROW){
        }
        else if(inst.type == TYPE_OP.TRY){
        }
        else{
            //TODO
            console.error(statement.type + " aun no ha sido implementado");
        }
    })
}

function gen3D_initializeGlobalSyms(){
    _output.push("#--------- begin null initialize globals")
    _currentScope.symbols.filter(sym => sym.type.includes("_global_") || sym.type.includes("_obj_def")).forEach(sym => {
        _output.push(`heap[${sym.pos}] = -1;`);
    })
    _output.push("#--------- end null initialize globals")
}

function gen3D_executeGlobals(instructions){
    _output.push("#--------- begin execute globals")
    instructions.forEach(inst => {
        if(inst.type == TYPE_OP.DECLAR){
            if(inst.exp != null){
                var exp = gen3D_Exp(inst.exp);
                var sym = _currentScope.getSymbol(_symbolTable, inst.id, true);
                _output.push(`heap[${sym.pos}] = ${exp.val};`);
            }
            //if prim initialize to 0
            else if(isPrimType(inst.jType)){
                _output.push(`heap[${sym.pos}] = 0;`);
            }
        }
        else if(inst.type == TYPE_OP.DEFINE_STRC){
            var objDefSym = _currentScope.getSymbol(_symbolTable, "_obj_" + inst.id, true);
            var objScope = _symbolTable.find((scope) => scope.id == "_obj_" + inst.id);

            _output.push(`heap[${objDefSym.pos}] = h; #pos where _obj_def will reside`);
            _output.push(`h = h + ${objScope.size}; #skip size of obj`);

            inst.l_declar.forEach(declar => {
                var tmpObjPosStart = genTmp();
                _output.push(`${tmpObjPosStart} = heap[${objDefSym.pos}];`)
                var tmpObjPos = genTmp();
                _output.push(`${tmpObjPos} = ${tmpObjPosStart} + ${objScope.getSymbol(null, declar.id, true).pos};`);
                if(declar.exp == null)
                    _output.push(`heap[${tmpObjPos}] = ${isPrimType(declar.jType) ? 0 : -1};`);
                else
                    _output.push(`heap[${tmpObjPos}] = ${gen3D_Exp(declar.exp).val};`);                
            })
        }
    })
    _output.push("#--------- end execute globals")
}

function gen3D_Exp(exp){
    switch(exp.type){
        case TYPE_OP.CALL:
            return gen3D_Call(exp);
        case TYPE_OP.CALL_JS:
            return gen3D_CallJs(exp);
        case TYPE_OP.ARRAY_DEF:
            return gen3D_ArrayDef(exp);
        case TYPE_OP.DOT:
            return gen3D_Dot(exp);
        case TYPE_OP.ACCESS:
            return gen3D_Access(exp);
        case TYPE_OP.PLUSPLUS:
        case TYPE_OP.MINUSMINUS:
            return gen3D_Update(exp);
        case TYPE_OP.ID:
            return gen3D_Id(exp);
        case TYPE_OP.STRC:
            return gen3D_Strc(exp);
        case TYPE_OP.DOLLAR:
            return gen3D_Dollar(exp);
        case TYPE_OP.TERNARY:
            return gen3D_Ternary(exp);
        case TYPE_OP.CAST:
            return gen3D_Cast(exp);
        case TYPE_OP.POW:
            return gen3D_Arithmetic_StrictInteger(exp);
        case TYPE_OP.LESS:
        case TYPE_OP.LESSEQUAL:
        case TYPE_OP.GREATER:
        case TYPE_OP.GREATEREQUAL:
            return gen3D_Relational(exp);
        case TYPE_OP.NOTEQUAL:
        case TYPE_OP.EQUALEQUAL:
            return gen3D_EqualVal(exp);
        case TYPE_OP.EQUALEQUALEQUAL:
            return gen3D_EqualRef(exp);
        case TYPE_OP.AND:
        case TYPE_OP.OR:
        case TYPE_OP.XOR:
            return gen3D_Logic(exp);
        case TYPE_OP.NOT:
            return gen3D_Not(exp);
        //already implemented
        case TYPE_OP.ATOMIC:
            return gen3D_Atomic(exp);
        case TYPE_OP.PLUS:
        case TYPE_OP.MINUS:
        case TYPE_OP.TIMES:
        case TYPE_OP.DIVIDE:
        case TYPE_OP.MODULE:
            return gen3D_Arithmetic(exp);
        case TYPE_OP.UMINUS:
            return gen3D_Uminus(exp);
    }
}

function gen3D_Atomic(exp){
    if(exp.jType != TYPE_VAL.STRING)
        return {val: exp.val};

    //get value in Heap
    var tmp = genTmp();
    _output.push(`${tmp} = h; #pos in heap where string starts`)
    for(var i = 0; i < exp.val.length; i++){
        _output.push(`heap[h] = ${exp.val.charCodeAt(i)};`)
        _output.push(`h = h + 1;`)
    }
    _output.push("heap[h] = 0;");
    _output.push("h = h + 1;")

    return {val: tmp};
}

function gen3D_Arithmetic(exp){
    var exp1 = gen3D_Exp(exp.op1);
    var exp2 = gen3D_Exp(exp.op2);

    var tmp = genTmp();
    _output.push(`${tmp} = ${exp1.val} ${exp.op} ${exp2.val};`)

    return {val: tmp};
}

function gen3D_Uminus(exp){
    var exp1 = gen3D_Exp(exp.op1);

    var tmp = genTmp();
    _output.push(`${tmp} = - ${exp1.val}`);

    return {val: tmp};
}