const TYPE_OP = require('./util').TYPE_OP

var _output;
var _nodeNumber;

/**
 * 
 * @param {*} label label of generated node
 * @param {*} parentId parent node id if it exists
 * @returns generated node id
 */
function genNode(label, parentId = null){
    var id = _nodeNumber;
    _output.push(`${_nodeNumber++}[label="${label}"]`)
    if(parentId != null)
        _output.push(`${parentId} -> ${id}`);

    return id;
}

function genTerminal(label, parentId){
    var id = _nodeNumber;
    _output.push(`${_nodeNumber++}[label="${label}" color="blue"]`)
    if(parentId != null)
        _output.push(`${parentId} -> ${id}`);

    return id;
}

module.exports.genDOT_AST = (ast) => {
    _output = [];
    _nodeNumber = 0;
    _output.push("digraph AST{");

    genDOT_AST(ast, genNode("AST"))

    _output.push("}");
    return _output.join("\n");
}

function genDOT_AST(instructions, parentId){
    instructions.forEach(inst => {
        var id = genNode(inst.type, parentId)

        switch(inst.type){
            case TYPE_OP.IMPORT:
                inst.imports.forEach(importId => {
                    genTerminal(importId, id);
                })
                break;
            case TYPE_OP.FUNC_DEF:
                genTerminal(inst.returnType, id);
                genTerminal(inst.name, id);
                genDOT_AST(inst.params, genNode("L_PARAM", id))
                genDOT_AST(inst.block, genNode("L_STATEMENT", id));
                break;
            case TYPE_OP.DECLAR:
                genTerminal(inst.jType, id);
                genTerminal(inst.id, id);
                if(inst.exp) genDOT_Exp(inst.exp, id);
                break;
            case TYPE_OP.ASSIGN:
                genDOT_Exp(inst.id, id);
                genDOT_Exp(inst.exp, id);
                break;
            case TYPE_OP.CALL:
                genDOT_Exp(inst.call, id);
                var paramsId = genNode("L_EXP", id);
                inst.params.forEach(param => {genDOT_EXP(param, paramsId)})
                break;
            case TYPE_OP.CALL_JS:
                genDOT_Exp(inst.call, id);
                genDOT_AST(inst.params, genNode("L_ASSIGN", id))
                break;
            case TYPE_OP.IF:
                genDOT_Exp(inst.cond, id);
                genDOT_AST(inst.ifTrue, genNode("L_STATEMENT", id));
                if(inst.ifFalse) genDOT_AST([inst.ifFalse], id)
                break;
            case TYPE_OP.SWITCH:
                genDOT_Exp(inst.switch, id);
                genDOT_AST(inst.cases, genNode("L_CASE", id))
                break;
            case TYPE_OP.CASE:
                if(inst.cond) genDOT_Exp(inst.cond, id);
                genDOT_AST(inst.ifTrue, genNode("L_STATEMENT", id));
                break;
            case TYPE_OP.FOR:
                if(inst.init) genDOT_AST([inst.init], genNode("FOR_INIT", id))
                if(inst.cond) genDOT_AST([inst.cond], genNode("FOR_COND", id))
                if(inst.update && inst.update == TYPE_OP.DECLAR) genDOT_AST([inst.update], genNode("FOR_UPDATE", id))
                else if(inst.update) genDOT_AST([inst.update], genNode("FOR_UPDATE", id))
                genDOT_AST(inst.block, genNode("L_STATEMENT", id))
                break;
            case TYPE_OP.WHILE:
                genDOT_AST([inst.cond], id)
                genDOT_AST(inst.block, genNode("L_STATEMENT", id))
                break;
            case TYPE_OP.DO_WHILE:
                genDOT_AST(inst.block, genNode("L_STATEMENT", id))
                genDOT_AST([inst.cond], id)
                break;
            case TYPE_OP.CONTINUE:
            case TYPE_OP.BREAK:                
            case TYPE_OP.RETURN:
                if(inst.exp) genDOT_Exp(inst.exp, genNode(inst.type, id))
                else genNode(inst.type, id);
                break;
            case TYPE_OP.DEFINE_STRC:
                genTerminal(inst.id, id);
                genDOT_AST(inst.l_declar, genNode("L_DECLAR", id));
                break;
            case TYPE_OP.TRY:
                genDOT_AST(inst.tryBlock, genNode("L_STATEMENT", id));
                genTerminal(inst.exceptionType, id);
                genDOT_AST(inst.catchBlock, genNode("L_STATEMENT", id));
                break;
            case TYPE_OP.THROW:
                genDOT_Exp(inst.exp, id);
                break;
        }
    })
}

function genDOT_Exp(exp, parentId){
    var expNodeId = genNode("EXP." + exp.type, parentId);
    switch(exp.type){
        case TYPE_OP.ATOMIC:
            genTerminal(exp.val, expNodeId);
            break;
        case TYPE_OP.ACCESS:
            genDOT_Exp(exp.base, expNodeId);
            genDOT_Exp(exp.index, expNodeId);
            break;
        case TYPE_OP.TERNARY:
            genDOT_Exp(exp.cond, expNodeId);
            genDOT_Exp(exp.ifTrue, expNodeId);
            genDOT_Exp(exp.ifFalse, expNodeId);
            break;
        case TYPE_OP.DOLLAR:
            genDOT_Exp(exp.exp, expNodeId);
            break;
        case TYPE_OP.UMINUS:
        case TYPE_OP.NOT:
            genTerminal(exp.op, expNodeId);
            genDOT_Exp(exp.op1, expNodeId);
            break;
        case TYPE_OP.PLUSPLUS:
        case TYPE_OP.MINUSMINUS:
            genDOT_Exp(exp.op1, expNodeId);
            genTerminal(exp.op, expNodeId);
            break;
        case TYPE_OP.DOT:
            genDOT_Exp(exp.base, expNodeId);   
            genDOT_Exp(exp.next, expNodeId);   
            break;      
        case TYPE_OP.CAST:
            genTerminal(exp.endType, expNodeId);
            genDOT_Exp(exp.exp, expNodeId);
            break;
        case TYPE_OP.ARRAY_DEF:
            exp.val.forEach(e => {genDOT_Exp(e, expNodeId)})
            break;
        case TYPE_OP.STRC:
            genTerminal(exp.jType, expNodeId);
            if(exp.exp) genDOT_Exp(exp.exp, expNodeId);
            break;
        case TYPE_OP.ID:
            genTerminal(exp.val, expNodeId)
            break;
        default:
            genDOT_Exp(exp.op1, expNodeId);
            genTerminal(exp.op, expNodeId);
            genDOT_Exp(exp.op2, expNodeId);
            break;
    }

    return expNodeId;
}