let fs = require('fs'); 

let TYPE_OP = require('../compilation/util').TYPE_OP
let TYPE_VAL = require('../compilation/util').TYPE_VAL
let isPrimType = require('../compilation/util').isPrimType;

var _symbolTable;
var _currentScope;
var _currentFuncSize;
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

    if(typeDisplay == "_func")
        _currentFuncSize = newScope.size;
}

function removeDisplay(){
    _currentScope = previousScope;
    return _display.pop();
}

module.exports.gen3D = (symbolTable, instructions) => {
    _symbolTable = symbolTable;
    _currentScope = symbolTable[0];
    _currentFuncSize = 0;
    _localScopeCount = 0;
    _output = [];
    _display = [];
    _numTmp = _numTag = 100;

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

    _output.push("call _func_principal;")

    var labelEndProgram = genLabel();
    _output.push(`goto ${labelEndProgram};`)
    _output.push("end")

    //gen3D for funcs
    gen3D_funcs(instructions.filter(inst => inst.type == TYPE_OP.FUNC_DEF))

    gen3D_Native();
    _output.push(fs.readFileSync(__dirname + "/nativas.txt").toString())

    //proc that works as end marker
    _output.push(`\n${labelEndProgram}:`);
}

function gen3D_funcs(functions){
    functions.forEach(func => {
        var funcId = "_func_" + func.name;
        func.params.forEach((param) => {
            funcId += "-" + param.jType
        })

        _output.push(`\nproc ${funcId.split("-").join("_")} begin`);

        addDisplay("_func", null, genLabel(), _symbolTable.find(scope => scope.id == funcId))

        //gen3D_local
        gen3D_LocalBlock(func.block);

        _output.push(`${removeDisplay().endLabel}:`)
        _output.push("end");
    })
}

function gen3D_LocalBlock(instructions){
    instructions.forEach(inst => {
        if(inst.type == TYPE_OP.DEFINE_STRC){
            gen3D_DefineStrc(inst);
        }
        else if(inst.type == TYPE_OP.DECLAR){
            gen3D_Declar(inst);
        }
        else if(inst.type == TYPE_OP.CALL){
            gen3D_Call(inst);
        }
        //TODO pending implementation
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
        else if(inst.type == TYPE_OP.CALL_JS){
        }
        else if(inst.type == TYPE_OP.CONTINUE){
            _output.push(`goto ${_display[_display.length - 1].startLabel};`)
        }
        else if(inst.type == TYPE_OP.BREAK){
            _output.push(`goto ${_display[_display.length - 1].endLabel};`)
        }
        else if(inst.type == TYPE_OP.RETURN){
            _output.push(`stack[p] = ${inst.exp ? gen3D_Exp(inst.exp).val : -1};`);
            _output.push(`goto ${_display[0].endLabel};`);
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
    _currentScope.symbols.filter(sym => 
        sym.pos != -1 && (sym.type.includes("_global_") || sym.type.includes("_obj_def"))
    ).forEach(sym => {
        _output.push(`heap[${sym.pos}] = -1;`);
    })
    _output.push("#--------- end null initialize globals")
}

function gen3D_executeGlobals(instructions){
    _output.push("#--------- begin execute globals")
    instructions.forEach(inst => {
        if(inst.type == TYPE_OP.DECLAR){
            gen3D_DeclarGlobal(inst);
        }
        else if(inst.type == TYPE_OP.DEFINE_STRC){
            gen3D_DefineStrc(inst);
        }
    })
    _output.push("#--------- end execute globals")
}

function gen3D_DeclarGlobal(inst){
    //initialize var if there is an expression
    var sym = _symbolTable[0].getSymbol(_symbolTable, inst.id, true);

    if(inst.exp != null){
        var exp = gen3D_Exp(inst.exp);
        _output.push(`heap[${sym.pos}] = ${exp.val};`);
    }
    //if prim initialize to 0
    else if(isPrimType(inst.jType)){
        _output.push(`heap[${sym.pos}] = 0;`);
    }
}

function gen3D_DefineStrc(inst){
    var objDefSym = _symbolTable[0].getSymbol(_symbolTable, "_obj_" + inst.id, true);
    var objScope = _symbolTable.find((scope) => scope.id == "_obj_" + inst.id);

    _output.push(`heap[${objDefSym.pos}] = h;`);
    _output.push(`h = h + ${objScope.size};`);

    var tmpObjPosStart = genTmp();
    _output.push(`${tmpObjPosStart} = heap[${objDefSym.pos}];`)

    inst.l_declar.forEach(declar => {
        var tmpObjPos = genTmp();
        _output.push(`${tmpObjPos} = ${tmpObjPosStart} + ${objScope.getSymbol(null, declar.id, true).pos};`);
        if(declar.exp == null)
            _output.push(`heap[${tmpObjPos}] = ${isPrimType(declar.jType) ? 0 : -1};`);
        else
            _output.push(`heap[${tmpObjPos}] = ${gen3D_Exp(declar.exp).val};`);                
    })
}

function gen3D_Declar(inst){
    if(inst.global){
        gen3D_DeclarGlobal(inst)
    }
    else{
        var sym = _currentScope.getSymbol(_symbolTable, inst.id, true);

        if(inst.exp != null){
            var exp = gen3D_Exp(inst.exp);
            var tmpPos = genTmp();
            _output.push(`${tmpPos} = p + ${sym.pos};`)
            _output.push(`stack[${tmpPos}] = ${exp.val};`);
        }
        //if prim initialize to 0
        else if(isPrimType(inst.jType)){
            var tmpPos = genTmp();
            _output.push(`${tmpPos} = p + ${sym.pos};`)
            _output.push(`stack[${tmpPos}] = 0;`);
        }
    }
}

function gen3D_Exp(exp){
    switch(exp.type){
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
        case TYPE_OP.DOLLAR:
            return gen3D_Dollar(exp);
        case TYPE_OP.TERNARY:
            return gen3D_Ternary(exp);
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
        case TYPE_OP.STRC:
            return gen3D_Strc(exp);
        case TYPE_OP.CAST:
            return gen3D_Cast(exp);
        case TYPE_OP.CALL:
            return gen3D_Call(exp);
        case TYPE_OP.ATOMIC:
            return gen3D_Atomic(exp);
        case TYPE_OP.PLUS:
        case TYPE_OP.MINUS:
        case TYPE_OP.TIMES:
        case TYPE_OP.DIVIDE:
        case TYPE_OP.MODULE:
            return gen3D_Arithmetic(exp);
        case TYPE_OP.POW:
            return gen3D_Pow(exp);
        case TYPE_OP.UMINUS:
            return gen3D_Uminus(exp);
    }
}

function gen3D_Strc(exp){
    //heap space
}

function gen3D_Cast(exp){
    if(exp.endType != TYPE_VAL.DOUBLE)
        return gen3D_Call({resolvedCall: "_func_trunk_any", params: [exp.exp]})
    else
        return gen3D_Exp(exp.exp);
}

function gen3D_Call(exp){
    var tmp1 = genTmp();
    _output.push(`${tmp1} = p + ${_currentFuncSize};`)

    //pass params
    exp.params.forEach((paramExp, index) => {
        var tmpParam = gen3D_Exp(paramExp).val;
        var tmp2 = genTmp();
        _output.push(`${tmp2} = ${tmp1} + ${index + 1};`)
        _output.push(`stack[${tmp2}] = ${tmpParam};`)
    })

    //call
    _output.push(`p = p + ${_currentFuncSize};`);
    _output.push(`call ${exp.resolvedCall};`);

    //capture return value
    var tmp3 = genTmp();
    _output.push(`${tmp3} = stack[p];`);

    //return
    _output.push(`p = p - ${_currentFuncSize};`);

    return {val: tmp3};
}

function gen3D_Atomic(exp){
    if(exp.jType != TYPE_VAL.STRING)
        return {val: exp.val};

    //get value in Heap
    var tmp = genTmp();
    _output.push(`${tmp} = h;`)
    for(var i = 0; i < exp.val.length; i++){
        _output.push(`heap[h] = ${exp.val.charCodeAt(i)};`)
        _output.push(`h = h + 1;`)
    }
    _output.push("heap[h] = 0;");
    _output.push("h = h + 1;")

    return {val: tmp};
}

function gen3D_Arithmetic(exp){
    if(exp.op == '+'){
        if(exp.op1.jType == TYPE_VAL.STRING && exp.op2.jType == TYPE_VAL.STRING)
            return gen3D_Call({resolvedCall: "_func_CONCAT_STRING_STRING", params: [exp.op1, exp.op2]})
        
        if(exp.op1.jType == TYPE_VAL.STRING && exp.op2.jType == TYPE_VAL.BOOLEAN)
            return gen3D_Call({resolvedCall: "_func_CONCAT_STRING_BOOLEAN", params: [exp.op1, exp.op2]})
        if(exp.op1.jType == TYPE_VAL.BOOLEAN && exp.op2.jType == TYPE_VAL.STRING)
            return gen3D_Call({resolvedCall: "_func_CONCAT_BOOLEAN_STRING", params: [exp.op1, exp.op2]})
        
        if(exp.op1.jType == TYPE_VAL.STRING && exp.op2.jType == TYPE_VAL.CHAR)
            return gen3D_Call({resolvedCall: "_func_CONCAT_STRING_CHAR", params: [exp.op1, exp.op2]})
        if(exp.op1.jType == TYPE_VAL.CHAR && exp.op2.jType == TYPE_VAL.STRING)
            return gen3D_Call({resolvedCall: "_func_CONCAT_CHAR_STRING", params: [exp.op1, exp.op2]})
        
        if(exp.op1.jType == TYPE_VAL.STRING && exp.op2.jType == TYPE_VAL.INTEGER)
            return gen3D_Call({resolvedCall: "_func_CONCAT_STRING_INTEGER", params: [exp.op1, exp.op2]})
        if(exp.op1.jType == TYPE_VAL.INTEGER && exp.op2.jType == TYPE_VAL.STRING)
            return gen3D_Call({resolvedCall: "_func_CONCAT_INTEGER_STRING", params: [exp.op1, exp.op2]})

        if(exp.op1.jType == TYPE_VAL.STRING && exp.op2.jType == TYPE_VAL.DOUBLE)
            return gen3D_Call({resolvedCall: "_func_CONCAT_STRING_DOUBLE", params: [exp.op1, exp.op2]})
        if(exp.op1.jType == TYPE_VAL.DOUBLE && exp.op2.jType == TYPE_VAL.STRING)
            return gen3D_Call({resolvedCall: "_func_CONCAT_DOUBLE_STRING", params: [exp.op1, exp.op2]})
    }

    var exp1 = gen3D_Exp(exp.op1);
    var exp2 = gen3D_Exp(exp.op2);

    var tmp = genTmp();
    _output.push(`${tmp} = ${exp1.val} ${exp.op} ${exp2.val};`)

    return {val: tmp};
}

function gen3D_Pow(exp){
    return gen3D_Call({resolvedCall: "_func_POW_INTEGER_INTEGER", params: [exp.op1, exp.op2]})
}

function gen3D_Uminus(exp){
    var exp1 = gen3D_Exp(exp.op1);

    var tmp = genTmp();
    _output.push(`${tmp} = - ${exp1.val}`);

    return {val: tmp};
}

function gen3D_Native(){
    gen3D_Print();
}

function gen3D_Print(){
    var endProcLabel = genLabel();
    _output.push(`\nproc _func_print_string begin`)

    var tmp0 = genTmp();
    _output.push(`${tmp0} = p + 1;`)
    var tmp1 = genTmp();
    var ifNotNullLabel = genLabel();

    _output.push(`${tmp1} = stack[${tmp0}];`)
    _output.push(`if(${tmp1} <> -1) goto ${ifNotNullLabel};`)
    _output.push(`print("%c", 78);`, `print("%c", 85);`, `print("%c", 76);`, `print("%c", 76);`, `goto ${endProcLabel};`)
    _output.push(`${ifNotNullLabel}:`)

    var tmp2 = genTmp();
    _output.push(`${tmp2} = heap[${tmp1}];`, )
    
    var loop = genLabel();
    _output.push(`${loop}:`)
    _output.push(`if(${tmp2} == 0) goto ${endProcLabel};`)
    _output.push(`print("%c", ${tmp2});`, `${tmp1} = ${tmp1} + 1;`, `${tmp2} = heap[${tmp1}];`, `goto ${loop};`)

    _output.push(`${endProcLabel}:`, 'print("%c", 10);');
    _output.push('end');
}