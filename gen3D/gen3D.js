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

function genTmp(quantity = 0){
    if(quantity == 0)
        return "t" + _numTmp++;
    
    var tmps = [];
    for(var i = 0; i < quantity; i++)
        tmps.push(genTmp());
    return tmps;
}

function genLabel(quantity = 0){
    if(quantity == 0)
        return "L" + _numTag++;

    var lbls = [];
    for(var i = 0; i < quantity; i++)
        lbls.push(genLabel());
    return lbls;
}

function backpatch(arrayIndexes, lbl){
    arrayIndexes.forEach(i => {
        _output[i] = _output[i].replace(/\$/, lbl);
    })
}

function addDisplay(typeDisplay, startLabel, endLabel, newScope){
    _display.push({type: typeDisplay, startLabel: startLabel, endLabel: endLabel, scope: newScope});
    _currentScope = newScope;

    if(typeDisplay == "_func")
        _currentFuncSize = newScope.size;
}

function removeDisplay(){
    var displayRemoved = _display.pop();
    
    if(_display.length != 0)
        _currentScope = _display[_display.length - 1].scope;
    else
        _currentScope = _symbolTable[0]

    return displayRemoved;
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
        else if(inst.type == TYPE_OP.DECLAR_LIST){
            gen3D_DeclarList(inst);
        }
        else if(inst.type == TYPE_OP.CALL){
            gen3D_Call(inst);
        }
        else if(inst.type == TYPE_OP.ASSIGN){
            gen3D_Assign(inst);
        }
        else if(inst.type == TYPE_OP.PLUSPLUS || inst.type == TYPE_OP.MINUSMINUS){
            gen3D_Update(inst);
        }
        else if(inst.type == TYPE_OP.CONTINUE){
            var loopDisplay;
            for(var i = _display.length - 1; i >= 0; i--){
                if(_display[i].type == "_cycle"){
                    loopDisplay = _display[i];
                    break;
                }
            }
            _output.push(`goto ${loopDisplay.startLabel};`)
        }
        else if(inst.type == TYPE_OP.BREAK){
            var loopDisplay;
            for(var i = _display.length - 1; i >= 0; i--){
                if(_display[i].type == "_cycle" || _display[i].type == "_switch"){
                    loopDisplay = _display[i];
                    break;
                }
            }
            _output.push(`goto ${loopDisplay.endLabel};`)
        }
        else if(inst.type == TYPE_OP.RETURN){
            if(inst.exp == null)
                _output.push(`stack[p] = -1};`);
            else{
                var returnExp = gen3D_Exp(inst.exp);

                if(inst.exp.jType == TYPE_VAL.BOOLEAN){
                    var lbl = genLabel(3)
                    backpatch(returnExp.l_true, lbl[0])
                    backpatch(returnExp.l_false, lbl[1])
            
                    _output.push(`${lbl[0]}:`);
                    _output.push(`stack[p] = 1;`)
                    _output.push(`goto ${lbl[2]};`)
                    _output.push(`${lbl[1]}:`);
                    _output.push(`stack[p] = 0;`)
                    _output.push(`goto ${lbl[2]};`)
                    _output.push(`${lbl[2]}:`)
                }
                else{
                    _output.push(`stack[p] = ${isPrimType(inst.exp.jType) ? returnExp.val : returnExp.ref};`)
                }
            }
            _output.push(`goto ${_display[0].endLabel};`);
        }
        else if(inst.type == TYPE_OP.IF){
            var labelSalidaIf = genLabel();
            _output.push('#begin if')
            gen3D_If(inst, labelSalidaIf);
            _output.push(`${labelSalidaIf}:`, '#end if')
        }
        else if(inst.type == TYPE_OP.FOR){
            _output.push('#begin for')
            gen3D_For(inst);
            _output.push('#end for');
        }
        else if(inst.type == TYPE_OP.WHILE){
            _output.push('#begin while')
            gen3D_While(inst);
            _output.push('#end while');
        }
        else if(inst.type == TYPE_OP.DO_WHILE){
            _output.push('#begin do_while')
            gen3D_Do_While(inst);
            _output.push('#end do_while');
        }
        else if(inst.type == TYPE_OP.SWITCH){
            _output.push('#begin switch')
            gen3D_Switch(inst);
            _output.push('#end switch');
        }
        //TODO pending implementation
        else if(inst.type == TYPE_OP.CALL_JS){
        }
        else if(inst.type == TYPE_OP.THROW){
        }
        else if(inst.type == TYPE_OP.TRY){
        }
        else{
            //TODO
            console.error(inst.type + " aun no ha sido implementado");
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
        if(inst.exp != null){
            inst.id = {type: TYPE_OP.ID, val: inst.id}
            gen3D_Assign(inst);
        }
        //else default initialize
        else {
            var sym = _currentScope.getSymbol(_symbolTable, inst.id, true);

            var tmpPos = genTmp();
            _output.push(`${tmpPos} = p + ${sym.pos};`)
            _output.push(`stack[${tmpPos}] = ${isPrimType(sym.jType) ? '0' : '-1'};`);
        }
    }
}

function gen3D_DeclarList(inst){
    if(inst.exp == null){
        inst.l_id.forEach(id => {
            inst.id = {type: TYPE_OP.ID, val: inst.id}
            gen3D_Assign(inst);
        })
    }
    else{
        var expInfo = gen3D_Exp(inst.exp);

        if(inst.exp.jType == TYPE_VAL.BOOLEAN){
            var lbl = genLabel(3)
            backpatch(expInfo.l_true, lbl[0])
            backpatch(expInfo.l_false, lbl[1])
    
            expInfo.val = 1;
            _output.push(`${lbl[0]}:`);
            gen3D_Assign_Aux(targetInfo, expInfo)
            _output.push(`goto ${lbl[2]};`)
            expInfo.val = 0;
            _output.push(`${lbl[1]}:`);
            gen3D_Assign_Aux(targetInfo, expInfo)
            _output.push(`goto ${lbl[2]};`)
            _output.push(`${lbl[2]}:`)
            return;
        }

        inst.l_id.forEach(id => {
            var targetInfo = gen3D_Exp({type: TYPE_OP.ID, val:id});
            //remove statements as there is no backpatch
            if(targetInfo.sym.jType == TYPE_VAL.BOOLEAN){
                _output.splice(targetInfo.l_true[0], 2);
            }
            gen3D_Assign_Aux(targetInfo, expInfo);
        })
    }
}

function gen3D_Assign(inst){
    var targetInfo = gen3D_Exp(inst.id);
    //remove statements as there is no backpatch
    if(targetInfo.sym.jType == TYPE_VAL.BOOLEAN){
        _output.splice(targetInfo.l_true[0], 2);
    }

    var expInfo = gen3D_Exp(inst.exp);

    if(inst.exp.jType == TYPE_VAL.BOOLEAN){
        var lbl = genLabel(3)
        backpatch(expInfo.l_true, lbl[0])
        backpatch(expInfo.l_false, lbl[1])

        expInfo.val = 1;
        _output.push(`${lbl[0]}:`);
        gen3D_Assign_Aux(targetInfo, expInfo)
        _output.push(`goto ${lbl[2]};`)
        expInfo.val = 0;
        _output.push(`${lbl[1]}:`);
        gen3D_Assign_Aux(targetInfo, expInfo)
        _output.push(`goto ${lbl[2]};`)
        _output.push(`${lbl[2]}:`)
        return;
    }

    gen3D_Assign_Aux(targetInfo, expInfo);
}

function gen3D_Assign_Aux(targetInfo, expInfo){
    if(targetInfo.sym.type == "_global_prim"){
        _output.push(`heap[${targetInfo.ref}] = ${expInfo.val};`)
    }
    else if(targetInfo.sym.type == "_global_obj"){
        _output.push(`heap[${targetInfo.ref}] = ${expInfo.val};`)
    }
    else if (targetInfo.sym.type == "_local_prim"){
        _output.push(`stack[${targetInfo.ref}] = ${expInfo.val};`)
    }
    else if (targetInfo.sym.type == "_local_obj"){
        _output.push(`stack[${targetInfo.ref}] = ${expInfo.val};`)
    }
}

function gen3D_If(inst, labelSalidaIf){
    if(inst.cond){
        var cond = gen3D_Exp(inst.cond)

        var labelIfTrue = genLabel();
        var labelIfFalse = genLabel();
        backpatch(cond.l_true, labelIfTrue);
        backpatch(cond.l_false, labelIfFalse);
        
        _output.push(`${labelIfTrue}:`)
        //set scope
        addDisplay("_if", null, null, _symbolTable.find(scope => scope.id == "_if_" + _localScopeCount))
        _localScopeCount++;

        //execute block
        gen3D_LocalBlock(inst.ifTrue);

        //goto salida
        _output.push(`goto ${labelSalidaIf};`)

        removeDisplay();
        _output.push(`${labelIfFalse}:`)
        
        //execute another if
        if(inst.ifFalse != null){
            gen3D_If(inst.ifFalse, labelSalidaIf);
        }
    }
    //We're dealing with an else
    else{
        //set scope
        addDisplay("_if", null, null, _symbolTable.find(scope => scope.id == "_if_" + _localScopeCount))
        _localScopeCount++;

        //execute block
        gen3D_LocalBlock(inst.ifTrue);

        removeDisplay();
    }
}

function gen3D_Switch(inst){
    var lbl = genLabel(inst.cases.length);
    var lblSwitch = genLabel();
    var lblSalida = genLabel();

    addDisplay("_switch", null, lblSalida, _symbolTable.find(scope => scope.id == "_switch_" + _localScopeCount));
    _localScopeCount++;
    
    _output.push(`goto ${lblSwitch};`)
    inst.cases.forEach((caseInst, index) => {
        if(!caseInst.cond){
            _output.push(`goto ${lblSalida};`)//ensure default is not cascaded
        }
        _output.push(`${lbl[index]}:`)
        gen3D_LocalBlock(caseInst.ifTrue);
    })

    removeDisplay();

    _output.push(`goto ${lblSalida};`)
    _output.push(`${lblSwitch}:`)
    var expInfo = gen3D_Exp(inst.switch);
    inst.cases.forEach((caseInst, index) => {
        if(caseInst.cond){
            var caseInfo = gen3D_Exp(caseInst.cond);
            _output.push(`if(${expInfo.val} == ${caseInfo.val}) goto ${lbl[index]};`)
        }else{
            _output.push(`goto ${lbl[index]};`)
        }
    })
    _output.push(`${lblSalida}:`)

}

function gen3D_For(inst){
    var updateLabel = genLabel();
    var condLabel = genLabel();
    var endLabel = genLabel();
    var bodyLabel = genLabel();

    //set scope
    addDisplay("_cycle", updateLabel, endLabel, _symbolTable.find(scope => scope.id == "_for_" + _localScopeCount))
    _localScopeCount++;

    //for_init
    if(inst.init)
        gen3D_LocalBlock([inst.init]);

    //for_cond
    _output.push(`${condLabel}:`);
    if(inst.cond){
        var cond = gen3D_Exp(inst.cond)
        backpatch(cond.l_true, bodyLabel);
        backpatch(cond.l_false, endLabel);
    }
    
    _output.push(`${bodyLabel}:`)
    gen3D_LocalBlock(inst.block);

    //update
    _output.push(`${updateLabel}:`)
    if(inst.update){
        gen3D_LocalBlock([inst.update]);
    }
    removeDisplay();

    //loop
    _output.push(`goto ${condLabel};`)
    _output.push(`${endLabel}:`)
}

function gen3D_While(inst){
    var condLabel = genLabel();
    var endLabel = genLabel();
    var bodyLabel = genLabel();

    //cond
    _output.push(`${condLabel}:`);
    var cond = gen3D_Exp(inst.cond)
    backpatch(cond.l_true, bodyLabel);
    backpatch(cond.l_false, endLabel);
    
    //set scope and execute block
    _output.push(`${bodyLabel}:`)
    addDisplay("_cycle", condLabel, endLabel, _symbolTable.find(scope => scope.id == "_while_" + _localScopeCount))
    _localScopeCount++;
    gen3D_LocalBlock(inst.block);
    removeDisplay();

    //loop
    _output.push(`goto ${condLabel};`)

    _output.push(`${endLabel}:`)
}

function gen3D_Do_While(inst){
    var bodyLabel = genLabel();
    var endLabel = genLabel();
    var condLabel = genLabel();

    //set scope and execute block
    _output.push(`${bodyLabel}:`);
    addDisplay("_cycle", condLabel, endLabel, _symbolTable.find(scope => scope.id == "_do_while_" + _localScopeCount))
    _localScopeCount++;
    gen3D_LocalBlock(inst.block);
    removeDisplay();

    _output.push(`${condLabel}:`);
    var cond = gen3D_Exp(inst.cond)
    backpatch(cond.l_true, bodyLabel);
    backpatch(cond.l_false, endLabel);

    _output.push(`${endLabel}:`)
}

function gen3D_Exp(exp){
    switch(exp.type){
        case TYPE_OP.CALL_JS:
            return gen3D_CallJs(exp);
        case TYPE_OP.ARRAY_DEF:
            return gen3D_ArrayDef(exp);
        case TYPE_OP.ACCESS:
            return gen3D_Access(exp);
        case TYPE_OP.DOLLAR:
            return gen3D_Dollar(exp);
        case TYPE_OP.TERNARY:
            return gen3D_Ternary(exp);
        //already implemented
        case TYPE_OP.DOT:
            return gen3D_Dot(exp);
        case TYPE_OP.STRC:
            return gen3D_Strc(exp);
        case TYPE_OP.XOR:
            return gen3D_Xor(exp);
        case TYPE_OP.EQUALEQUALEQUAL:
            return gen3D_EqualRef(exp);
        case TYPE_OP.NOTEQUAL:
        case TYPE_OP.EQUALEQUAL:
        case TYPE_OP.LESS:
        case TYPE_OP.LESSEQUAL:
        case TYPE_OP.GREATER:
        case TYPE_OP.GREATEREQUAL:
            return gen3D_Relational(exp);
        case TYPE_OP.OR:
            return gen3D_Or(exp);
        case TYPE_OP.AND:
            return gen3D_And(exp);
        case TYPE_OP.NOT:
            return gen3D_Not(exp);
        case TYPE_OP.PLUSPLUS:
        case TYPE_OP.MINUSMINUS:
            return gen3D_Update(exp);
        case TYPE_OP.ID:
            return gen3D_Id(exp);
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

function gen3D_Dot(exp){
    //change scope to objects scope
    var result;
    var baseInfo = gen3D_Exp(exp.base);

    previousScope = _currentScope;
    _currentScope = _symbolTable.find((scope) => scope.id == "_obj_" + exp.base.jType)

    var sym = _currentScope.getSymbol(_symbolTable, exp.next.val, true);

    if(sym.type == "_property_prim"){
        var tmp = genTmp(2);
        _output.push(`${tmp[0]} = ${baseInfo.val} + ${sym.pos};`);
        _output.push(`${tmp[1]} = heap[${tmp[0]}];`)

        if(sym.jType == TYPE_VAL.BOOLEAN){
            _output.push(`if(${tmp[1]} == 1) goto $;`, 'goto $;');
            result = {ref: tmp[0], val: tmp[1], sym: sym, l_true: [_output.length - 2], l_false: [_output.length - 1]}
        }
        else{
            result = {ref: tmp[0], val: tmp[1], sym: sym}
        }
    }
    else if(sym.type == "_property_obj"){
        var tmp = genTmp(2);

        _output.push(`${tmp[0]} = ${baseInfo.val} + ${sym.pos};`);
        _output.push(`${tmp[1]} = heap[${tmp[0]}];`)

        result = {ref: tmp[0], val: tmp[1], sym: sym}
    }

    _currentScope = previousScope;
    return result;
}

function gen3D_Xor(exp){
    var tmp = genTmp();
    var lbl = genLabel(4);

    _output.push(`${tmp} = 0;`)
    
    var op1 = gen3D_Exp(exp.op1);
    
    backpatch(op1.l_true, lbl[0]);
    backpatch(op1.l_false, lbl[1])
    _output.push(`${lbl[0]}:`, `${tmp} = ${tmp} + 1;`);
    _output.push(`${lbl[1]}:`)

    var op2 = gen3D_Exp(exp.op2);
    backpatch(op2.l_true, lbl[2]);
    backpatch(op2.l_false, lbl[3])
    _output.push(`${lbl[2]}:`, `${tmp} = ${tmp} + 1;`);
    _output.push(`${lbl[3]}:`)

    _output.push(`if(${tmp} == 1) goto $;`, `goto $;`)
    
    return {
        l_true: [_output.length - 2],
        l_false: [_output.length - 1]
    }
}

function gen3D_EqualRef(exp){
    var op1 = gen3D_Exp(exp.op1);
    var op2 = gen3D_Exp(exp.op2);

    _output.push(`if(${op1.val} == ${op2.val}) goto $;`)
    _output.push('goto $;')

    return {
        l_true: [_output.length - 2],
        l_false: [_output.length - 1]
    }
}

function gen3D_Relational(exp){
    var op1 = gen3D_Exp(exp.op1);
    var op2 = gen3D_Exp(exp.op2);

    if(exp.op1.jType == "STRING" && exp.op2.jType == "STRING"){
        return gen3D_Call({resolvedCall: "_func_equal_STRING_STRING", params: [exp.op1, exp.op2], resolvedReturn: TYPE_VAL.BOOLEAN})
    }

    _output.push(`if(${op1.val} ${exp.op} ${op2.val}) goto $;`)
    _output.push('goto $;')

    return {
        l_true: [_output.length - 2],
        l_false: [_output.length - 1]
    }
}

function gen3D_Not(exp){
    var exp1 = gen3D_Exp(exp.op1);

    return {
        l_true: exp1.l_false,
        l_false: exp1.l_true
    }
}

function gen3D_Or(exp){
    var exp1 = gen3D_Exp(exp.op1);
    
    var lbl = genLabel();
    backpatch(exp1.l_false, lbl);
    _output.push(`${lbl}:`)

    var exp2 = gen3D_Exp(exp.op2);
    return {
        l_true: exp1.l_true.concat(exp2.l_true),
        l_false: exp2.l_false
    }
}

function gen3D_And(exp){
    var exp1 = gen3D_Exp(exp.op1);
    
    var lbl = genLabel();
    backpatch(exp1.l_true, lbl);
    _output.push(`${lbl}:`)

    var exp2 = gen3D_Exp(exp.op2);
    return {
        l_true: exp2.l_true,
        l_false: exp1.l_false.concat(exp2.l_false)
    }
}

function gen3D_Update(exp){
    var targetInfo = gen3D_Id(exp.op1);

    var tmp = genTmp();
    _output.push(`${tmp} = ${targetInfo.val} ${exp.type == TYPE_OP.PLUSPLUS ? "+" : "-"} 1;`)

    if(targetInfo.sym.type == "_global_prim"){
        _output.push(`heap[${targetInfo.ref}] = ${tmp};`)
    }
    else if (targetInfo.sym.type == "_local_prim"){
        _output.push(`stack[${targetInfo.ref}] = ${tmp};`)
    }

    return {val: targetInfo.val}
}

function gen3D_Id(exp){
    var sym = _currentScope.getSymbol(_symbolTable, exp.val, _currentScope.id.startsWith("_obj_") ? true : false);

    if(sym.type == "_global_prim"){
        var tmp = genTmp(2);
        _output.push(`${tmp[0]} = ${sym.pos};`);
        _output.push(`${tmp[1]} = heap[${tmp[0]}];`)

        if(sym.jType == TYPE_VAL.BOOLEAN){
            _output.push(`if(${tmp[1]} == 1) goto $;`, 'goto $;');
            return {ref: tmp[0], val: tmp[1], sym: sym, l_true: [_output.length - 2], l_false: [_output.length - 1]}
        }

        return {ref: tmp[0], val: tmp[1], sym: sym}
    }
    else if(sym.type == "_global_obj"){
        var tmp = genTmp(3);

        _output.push(`${tmp[0]} = ${sym.pos};`);
        _output.push(`${tmp[1]} = heap[${tmp[0]}];`)

        return {ref: tmp[0], val: tmp[1], sym: sym}
    }
    else if (sym.type == "_local_prim"){
        var tmp = genTmp(2);

        _output.push(`${tmp[0]} = p + ${sym.pos};`)
        _output.push(`${tmp[1]} = stack[${tmp[0]}];`)

        if(sym.jType == TYPE_VAL.BOOLEAN){
            _output.push(`if(${tmp[1]} == 1) goto $;`, 'goto $;');
            return {ref: tmp[0], val: tmp[1], sym: sym, l_true: [_output.length - 2], l_false: [_output.length - 1]}
        }

        return {ref: tmp[0], val: tmp[1], sym: sym}
    }
    else if (sym.type == "_local_obj"){
        var tmp = genTmp(2);

        _output.push(`${tmp[0]} = p + ${sym.pos};`)
        _output.push(`${tmp[1]} = stack[${tmp[0]}];`)
        return {ref: tmp[0], val: tmp[1], sym: sym}
    }
}

function gen3D_Strc(exp){
    //one object
    if(exp.exp == null){
        //get obj scope
        var objScope = _symbolTable.find(scope => scope.id == exp.objDefSymbol.id);

        var tmp = genTmp(5);
        var lbl = genLabel(2);

        _output.push(`${tmp[0]} = heap[${exp.objDefSymbol.pos}];`);
        _output.push(`${tmp[1]} = h;`)
        _output.push(`${tmp[2]} = ${tmp[1]};`)
        _output.push(`${tmp[3]} = 0;`)

        _output.push(`${lbl[0]}:`)
        _output.push(`if (${tmp[3]} >= ${objScope.size}) goto ${lbl[1]};`)
        _output.push(`${tmp[4]} = heap[${tmp[0]}];`)
        _output.push(`heap[${tmp[2]}] = ${tmp[4]};`)
        _output.push(`${tmp[0]} = ${tmp[0]} + 1;`)
        _output.push(`${tmp[2]} = ${tmp[2]} + 1;`)
        _output.push(`${tmp[3]} = ${tmp[3]} + 1;`)
        _output.push(`goto ${lbl[0]};`);
        _output.push(`${lbl[1]}:`)

        return {val: tmp[1]};
    }


    //s_output.push(exp.jType)
}

function gen3D_Cast(exp){
    if(exp.endType != TYPE_VAL.DOUBLE)
        return gen3D_Call({resolvedCall: "_func_trunk_any", params: [exp.exp], resolvedReturn: exp.endType})
    else
        return gen3D_Exp(exp.exp);
}

function gen3D_Call(exp){
    var tmp1 = genTmp();
    _output.push(`#begin call`)
    _output.push(`${tmp1} = p + ${_currentFuncSize};`)

    //pass params
    exp.params.forEach((paramExp, index) => {

        var tmp2 = genTmp();
        _output.push(`${tmp2} = ${tmp1} + ${index + 1};`)

        var expInfo = gen3D_Exp(paramExp);

        //If a boolean returned labels then use those
        if(expInfo.l_true){
            var lbl = genLabel(3)
            backpatch(expInfo.l_true, lbl[0])
            backpatch(expInfo.l_false, lbl[1])

            _output.push(`${lbl[0]}:`);
            _output.push(`stack[${tmp2}] = 1;`)
            _output.push(`goto ${lbl[2]};`)

            _output.push(`${lbl[1]}:`);
            _output.push(`stack[${tmp2}] = 0;`)
            _output.push(`goto ${lbl[2]};`)
            _output.push(`${lbl[2]}:`)
            return;
        }

        _output.push(`stack[${tmp2}] = ${expInfo.val};`)
    })

    //call
    _output.push(`p = p + ${_currentFuncSize};`);
    _output.push(`call ${exp.resolvedCall};`);

    //capture return value
    var tmp3 = genTmp();
    _output.push(`${tmp3} = stack[p];`);

    //return
    _output.push(`p = p - ${_currentFuncSize};`);
    _output.push(`#end call`)

    return {val: tmp3};
}

function gen3D_Atomic(exp){
    if(exp.jType == TYPE_VAL.BOOLEAN){
        _output.push(`goto $;`)

        if(exp.val == 1)
            return {l_true: [_output.length - 1], l_false: []};
        else
            return {l_true: [], l_false: [_output.length - 1]};
    }

    if(isPrimType(exp.jType)){
        return {val: exp.val};
    }

    //String
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
            return gen3D_Call({resolvedCall: "_func_CONCAT_STRING_STRING", params: [exp.op1, exp.op2], resolvedReturn: "STRING"})
        
        if(exp.op1.jType == TYPE_VAL.STRING && exp.op2.jType == TYPE_VAL.BOOLEAN)
            return gen3D_Call({resolvedCall: "_func_CONCAT_STRING_BOOLEAN", params: [exp.op1, exp.op2], resolvedReturn: "STRING"})
        if(exp.op1.jType == TYPE_VAL.BOOLEAN && exp.op2.jType == TYPE_VAL.STRING)
            return gen3D_Call({resolvedCall: "_func_CONCAT_BOOLEAN_STRING", params: [exp.op1, exp.op2], resolvedReturn: "STRING"})
        
        if(exp.op1.jType == TYPE_VAL.STRING && exp.op2.jType == TYPE_VAL.CHAR)
            return gen3D_Call({resolvedCall: "_func_CONCAT_STRING_CHAR", params: [exp.op1, exp.op2], resolvedReturn: "STRING"})
        if(exp.op1.jType == TYPE_VAL.CHAR && exp.op2.jType == TYPE_VAL.STRING)
            return gen3D_Call({resolvedCall: "_func_CONCAT_CHAR_STRING", params: [exp.op1, exp.op2], resolvedReturn: "STRING"})
        
        if(exp.op1.jType == TYPE_VAL.STRING && exp.op2.jType == TYPE_VAL.INTEGER)
            return gen3D_Call({resolvedCall: "_func_CONCAT_STRING_INTEGER", params: [exp.op1, exp.op2], resolvedReturn: "STRING"})
        if(exp.op1.jType == TYPE_VAL.INTEGER && exp.op2.jType == TYPE_VAL.STRING)
            return gen3D_Call({resolvedCall: "_func_CONCAT_INTEGER_STRING", params: [exp.op1, exp.op2], resolvedReturn: "STRING"})

        if(exp.op1.jType == TYPE_VAL.STRING && exp.op2.jType == TYPE_VAL.DOUBLE)
            return gen3D_Call({resolvedCall: "_func_CONCAT_STRING_DOUBLE", params: [exp.op1, exp.op2], resolvedReturn: "STRING"})
        if(exp.op1.jType == TYPE_VAL.DOUBLE && exp.op2.jType == TYPE_VAL.STRING)
            return gen3D_Call({resolvedCall: "_func_CONCAT_DOUBLE_STRING", params: [exp.op1, exp.op2], resolvedReturn: "STRING"})
    }

    var exp1 = gen3D_Exp(exp.op1);
    var exp2 = gen3D_Exp(exp.op2);

    var tmp = genTmp();
    _output.push(`${tmp} = ${exp1.val} ${exp.op} ${exp2.val};`)

    return {val: tmp};
}

function gen3D_Pow(exp){
    return gen3D_Call({resolvedCall: "_func_POW_INTEGER_INTEGER", params: [exp.op1, exp.op2], resolvedReturn: "INTEGER"})
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