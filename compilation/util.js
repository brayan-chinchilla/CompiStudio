module.exports.Scope =  class Scope {
    constructor(id, type, padre_id){
        this.id = id;
        this.type = type;
        this.padre_id = padre_id;
        this.size = 0;
        this.symbols = []
    }

    addSymbol(symbol){
        //TODO error if var exists
        this.symbols.push(symbol);
    }

    getSymbol(symbolTable, id, strict = false){
        if(this.symbols.some(s => s.id == id))
            return this.symbols.find(s => s.id == id)
        else if(this.padre_id != null && !strict)
            return symbolTable.find(scope => scope.id == this.padre_id).getSymbol(symbolTable, id);
        
        //TODO error symbol does not exist
    }
}

module.exports.Symbol = class Symbol {
    constructor(id, type, jType, scope, size, pos){
        this.id = id;
        this.type = type;
        this.jType = jType;
        this.scope = scope;
        this.size = size;
        this.pos = pos;

        if(this.type == "var_local" || this.type == "var_global" || this.type == "return"){
            switch(jType){
                case TYPE_VAL.INTEGER:
                case TYPE_VAL.DOUBLE:
                case TYPE_VAL.CHAR:
                case TYPE_VAL.BOOLEAN:
                    break;
                default:
                    this.type += "_obj"
                    break;
            }
        }
    }
}

module.exports.Error = class Error {
    constructor(detail, line, column){
        this.detail = detail;
        this.line = line;
        this.column = column;
    }
}

const TYPE_OP = {
    IMPORT:         'IMPORT',
    FUNC_DEF:       'FUNC_DEF',

    DECLAR:	        'DECLAR',               //
    ASSIGN:		    'ASSIGN',
    CALL:           'CALL',
    CALL_JS:        'CALL_JS',
    IF:				'IF',                   //
    SWITCH:         'SWITCH',               //
    CASE:           'CASE',                 //
    FOR:            'FOR',                  //
    WHILE:          'WHILE',                //
    DO_WHILE:       'DO_WHILE',             //
    CONTINUE:       'CONTINUE',             //
    BREAK:          'BREAK',                //
    RETURN:         'RETURN',
    DEFINE_STRC:    'DEFINE_STRC',
    TRY:            'TRY',
    THROW:          'THROW',


    ATOMIC:         'ATOMIC',

    DOLLAR:         'OP_DOLLAR',
    ACCESS:         'OP_ACCESS',
    TERNARY:        'OP_TERNARY',
    UMINUS:         'OP_UMINUS',            //
	PLUS:           'OP_PLUS',              //
	MINUS:          'OP_MINUS',             //
	TIMES:          'OP_TIMES',             //
    DIVIDE:         'OP_DIVIDE',            //
    MODULE:         'OP_MODULE',            //
    POW:            'OP_POW',
    LESS:           'OP_LESS',              //
    LESSEQUAL:      'OP_LESSEQUAL',         //
    GREATER:        'OP_GREATER',           //
    GREATEREQUAL:   'OP_GREATEREQAL',       //
    NOTEQUAL:       'OP_NOTEQUAL',          //
    EQUALEQUAL:     'OP_EQUALEQUAL',        //
    EQUALEQUALEQUAL:'OP_EQUALEQUALEQUAL',        //
    AND:            'OP_AND',               //
    OR:             'OP_OR',                //
    NOT:            'OP_NOT',               //
    XOR:            'OP_XOR',
    PLUSPLUS:       'OP_PLUSPLUS',
    MINUSMINUS:     'OP_MINUSMINUS',

    DOT:            'DOT',
    CAST:           'CAST',
    ARRAY_DEF:      'ARRAY_DEF',
    STRC:           'STRC',    
    ID:              'OP_ID',
};

const AST_API = {
    newVal: function(type, val, line, column){
        return {
            type: TYPE_OP.ATOMIC,
            jType: type, 
            val: val,
            line: line,
            column: column
        };
    },
}

const TYPE_VAL = {
    INTEGER:        'INTEGER',                  //
    DOUBLE:         'DOUBLE',               //
    CHAR:           'CHAR',                 //
    BOOLEAN:        'BOOLEAN',              //
    STRING:         'STRING',
    VOID:           'VOID',
    NULL:           'NULL'
}

module.exports.isPrimType = function isPrimType(type){
    switch(type){
        case TYPE_VAL.INTEGER:
        case TYPE_VAL.DOUBLE:
        case TYPE_VAL.CHAR:
        case TYPE_VAL.BOOLEAN:
            return true;
        default:
            return false;
    }
}

module.exports.isImplicitCast = function isImplicitCast(endType, type){
    if(endType == TYPE_VAL.DOUBLE && (type == TYPE_VAL.INTEGER || type == TYPE_VAL.CHAR))
        return true;
    else if(endType == TYPE_VAL.INTEGER && type == TYPE_VAL.CHAR)
        return true;
    
    return false;
}

module.exports.TYPE_OP = TYPE_OP;
module.exports.TYPE_VAL = TYPE_VAL;
module.exports.AST_API = AST_API;