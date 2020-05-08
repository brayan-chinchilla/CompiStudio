const TYPE_OP = {
    IMPORT:         'IMPORT',
    FUNC_DEF:       'FUNC_DEF',

    DECLAR:	        'DECLAR',               //
    ASSIGN:		    'ASSIGN',
    CALL:           'CALL',
    IF:				'IF',                   //
    SWITCH:         'SWITCH',               //
    CASE:           'CASE',                 //
    FOR:            'FOR',                  //
    WHILE:          'WHILE',                //
    DO_WHILE:       'DO_WHILE',             //
    CONTINUE:       'CONTINUE',             //
    BREAK:          'BREAK',                //
    RETURN:         'RETURN',

    ATOMIC:         'ATOMIC',

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
    AND:            'OP_AND',               //
    OR:             'OP_OR',                //
    NOT:            'OP_NOT',               //
    XOR:            'OP_XOR',

    PLUSPLUS:        'OP_PLUSPLUS',
    MINUSMINUS:      'OP_MINUSMINUS',
    
    ID:              'OP_ID',
};

const TYPE_VAL = {
    INTEGER:        'INTEGER',                  //
    DOUBLE:         'DOUBLE',               //
    CHAR:           'CHAR',                 //
    BOOLEAN:        'BOOLEAN',              //
    STRING:         'STRING',
    VOID:           'VOID',
    NULL:           'NULL',
    ARRAY:          'ARRAY',
    ID:             'ID'
}

const AST_API = {
    newVal: function(type, val){
        return {
            type: TYPE_OP.ATOMIC,
            jType: type, 
            val: val
        };
    },

}

module.exports.TYPE_OP = TYPE_OP;
module.exports.TYPE_VAL = TYPE_VAL;
module.exports.AST_API = AST_API;
