let TYPE_OP = require('./util').TYPE_OP
let TYPE_VAL = require('./util').TYPE_VAL
let isPrimType = require('./util').isPrimType

var _symbolTable;
var _currentScope;

module.exports.getExpType = (exp, symbolTable, currentScope) => {
    _symbolTable = symbolTable;
    _currentScope = currentScope;
    return getExpType(exp);
}

function throwError(detail, exp){
    throw {type:"SEMANTIC", detail:detail, line: exp.line, column:exp.column}
}

function throwErrorOp(type1, type2, exp){
    if(type2 != null)
        throwError(`Invalid op\n${type1} ${exp.op} ${type2}`, exp)
    
    else
        throwError(`Invalid op\n${exp.op} ${type1}`, exp)
}

function isNumeric(type){
    switch(type){
        case TYPE_VAL.CHAR:
        case TYPE_VAL.INTEGER:
        case TYPE_VAL.DOUBLE:
            return true;
        default:
            return false;
    }
}

function maxType(type1, type2){
    if(type1 == "STRING" || type2 == "STRING")
        return "STRING";
    else if(type1 == TYPE_VAL.DOUBLE || type2 == TYPE_VAL.DOUBLE)
        return TYPE_VAL.DOUBLE;
    else if(type1 == TYPE_VAL.INTEGER || type2 == TYPE_VAL.INTEGER)
        return TYPE_VAL.INTEGER;
    else if(type1 == TYPE_VAL.CHAR && type2 == TYPE_VAL.CHAR)
        return TYPE_VAL.INTEGER;

    console.error("Unexpected");
}

function getExpType(exp){
    switch(exp.type){
        case TYPE_OP.CALL:
            return getType_Call(exp);
        case TYPE_OP.CALL_JS:
            return getType_CallJs(exp);
        //already implemented
        case TYPE_OP.ARRAY_DEF:
            return getType_ArrayDef(exp);
        case TYPE_OP.DOT:
            return getType_Dot(exp);
        case TYPE_OP.ACCESS:
            return getType_Access(exp);
        case TYPE_OP.PLUSPLUS:
        case TYPE_OP.MINUSMINUS:
            return getType_Update(exp);
        case TYPE_OP.ID:
            return getType_Id(exp);
        case TYPE_OP.STRC:
            return getType_Strc(exp);
        case TYPE_OP.DOLLAR:
            return getType_Dollar(exp);
        case TYPE_OP.TERNARY:
            return getType_Ternary(exp);
        case TYPE_OP.CAST:
            return getType_Cast(exp);
        case TYPE_OP.ATOMIC:
            return getType_Atomic(exp);
        case TYPE_OP.UMINUS:
            return getType_Uminus(exp);
        case TYPE_OP.PLUS:
            return getType_Plus(exp);
        case TYPE_OP.MINUS:
        case TYPE_OP.TIMES:
            return getType_Arithmetic(exp);
        case TYPE_OP.DIVIDE:
            return getType_Divide(exp);
        case TYPE_OP.MODULE:
        case TYPE_OP.POW:
            return getType_Arithmetic_StrictInteger(exp);
        case TYPE_OP.LESS:
        case TYPE_OP.LESSEQUAL:
        case TYPE_OP.GREATER:
        case TYPE_OP.GREATEREQUAL:
            return getType_Relational(exp);
        case TYPE_OP.NOTEQUAL:
        case TYPE_OP.EQUALEQUAL:
            return getType_EqualVal(exp);
        case TYPE_OP.EQUALEQUALEQUAL:
            return getType_EqualRef(exp);
        case TYPE_OP.AND:
        case TYPE_OP.OR:
        case TYPE_OP.XOR:
            return getType_Logic(exp);
        case TYPE_OP.NOT:
            return getType_Not(exp);
    }
}

function getType_ArrayDef(exp){
    var expList = exp.val;
    if(expList.length == 0)
        throwError(`Expected: {l_exp}\nFound: {}`, exp);

    return getExpType(expList[0]);
}

function getType_Dot(exp){
    var typeBase = getExpType(exp.base);

    //change scope to objects scope
    _currentScope = _symbolTable.find((scope) => scope.id == "_obj_" + typeBase)
    return getExpType(exp.next);
}

function getType_Access(exp){
    var typeBase = getExpType(exp.base);
    var typeIndex = getExpType(exp.index);

    if(!typeBase.includes("[]"))
        throwError(`Expected: <T>[]\nFound: ${typeBase}`, exp);

    if(typeIndex != TYPE_VAL.INTEGER)
        throwError(`Expected: [${TYPE_VAL.INTEGER}]\nFound: [${typeIndex}]`, exp);

    return typeBase.replace("[]", "");
}

function getType_Update(exp){
    var typeId = getExpType(exp.op1);

    if(typeId != TYPE_VAL.INTEGER && typeId != TYPE_VAL.DOUBLE)
        throwError(`Invalid op\n${typeId} ${exp.type == TYPE_OP.PLUSPLUS ? '++' : '--'}`, exp);

    return typeId;
}

function getType_Id(exp){
    var sym = currentScope.getSymbol(symbolTable, exp.val, false);
    return sym.jType;

    //TODO error if ID does not exist
}

function getType_Strc(exp){
    var type = exp.jType.replace("[]", "");
    
    if(!isPrimType(type) && ! _symbolTable[0].getSymbol(_symbolTable, "_obj_" + type, true))
        throwError(`Unknown type ${exp.jType}`, exp);

    return exp.jType;
}

function getType_Atomic(exp){
    return exp.jType;
}

function getType_Plus(exp){
    var type1 = getExpType(exp.op1);
    var type2 = getExpType(exp.op2);

    //If there is a string + anyPrim || char + char
    if(type1.toUpperCase() == "STRING" && isPrimType(type2) || type2.toUpperCase() == "STRING" && isPrimType(type1) || type1 == TYPE_VAL.CHAR && type2 == TYPE_VAL.CHAR)
        return "STRING";

    //If numeric + numeric
    else if(isNumeric(type1) && isNumeric(type2))
        return maxType(type1, type2);

    throwErrorOp(type1, type2, exp);
}

//minus and times
function getType_Arithmetic(exp){
    var type1 = getExpType(exp.op1);
    var type2 = getExpType(exp.op2);

    if(! isNumeric(type1) || !isNumeric(type2))
        throwErrorOp(type1, type2, exp);

    return maxType(type1, type2);
}

function getType_Divide(exp){
    var type1 = getExpType(exp.op1);
    var type2 = getExpType(exp.op2);

    if(! isNumeric(type1) || !isNumeric(type2))
        throwErrorOp(type1, type2, exp);

    return TYPE_VAL.DOUBLE;
}

//pow and module
function getType_Arithmetic_StrictInteger(exp){
    var type1 = getExpType(exp.op1);
    var type2 = getExpType(exp.op2);

    if(type1 != TYPE_VAL.INTEGER || type2 != TYPE_VAL.INTEGER)
        throwErrorOp(type1, type2, exp);
    
    return TYPE_VAL.INTEGER;
}

function getType_Uminus(exp){
    var type1 = getExpType(exp.op1);
    if(type1 != TYPE_VAL.INTEGER || type1 != TYPE_VAL.DOUBLE)
        throwErrorOp(type1, null, exp);
    
    return type1;
}

function getType_Relational(exp){
    var type1 = getExpType(exp.op1);
    var type2 = getExpType(exp.op2);

    if(! isNumeric(type1) || !isNumeric(type2))
        throwErrorOp(type1, type2, exp);

    return TYPE_VAL.BOOLEAN;
}

//and, or, xor
function getType_Logic(exp){
    var type1 = getExpType(exp.op1);
    var type2 = getExpType(exp.op2);

    if(type1 != TYPE_VAL.BOOLEAN || type2 != TYPE_VAL.BOOLEAN)
        throwErrorOp(type1, type2, exp);
    
    return TYPE_VAL.BOOLEAN;
}

function getType_Not(exp){
    var type1 = getExpType(exp.op1);
    if(type1 != TYPE_VAL.BOOLEAN)
        throwErrorOp(type1, null, exp);
    
    return type1;
}

function getType_EqualVal(exp){
    var type1 = getExpType(exp.op1);
    var type2 = getExpType(exp.op2);

    //String == String || boolean == boolean || numeric == numeric
    if(type1 == "STRING" && type1 != "STRING" || type1 == TYPE_VAL.BOOLEAN && type2 == TYPE_VAL.BOOLEAN || isNumeric(type1) && isNumeric(type2))
        return TYPE_VAL.BOOLEAN;

    throwErrorOp(type1, type2, exp);
}

function getType_EqualRef(exp){
    var type1 = getExpType(exp.op1);
    var type2 = getExpType(exp.op2);

    //fail if prim or types are not the same
    if(isPrimType(type1) || isPrimType(type2) || type1 != type2)
        throwErrorOp(type1, type2, exp);

    return TYPE_VAL.BOOLEAN;
}

function getType_Cast(exp){
    var type1 = getExpType(exp.exp);
    if(! isNumeric(exp.endType) || ! isNumeric(type1))
        throwError(`Invalid cast\n(${endType})${type1}`, exp)

    return exp.endType;
}

function getType_Ternary(exp){
    var condType = getExpType(exp.cond);
    var expType1 = getExpType(exp.ifTrue);
    var expType2 = getExpType(exp.ifFalse);

    if(condType != TYPE_VAL.BOOLEAN)
        throwError(`Expected: cond\nFound: ${condType}`, exp)
    else if(expType1 != expType2)
        throwError(`Invalid op\n${condType} ? ${expType1} : ${expType2}`, exp)

    return expType1;
}

function getType_Dollar(exp){
    var expType = getExpType(expType);
    if(isPrimType(expType))
        throwError(`Invalid op\n$ ${expType}`, exp)

    return expType;
}