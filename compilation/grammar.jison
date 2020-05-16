%{
    var strBuffer = "";
    var _errores = []
	const TYPE_OP = require('./util').TYPE_OP;
	const TYPE_VAL = require('./util').TYPE_VAL;
	const AST_API = require('./util').AST_API;

    /**
        parser.parseError = (str, hash) => {
            _errores.push({type:"SINTAX", detail:`Found: ${hash.token}\nExpected: ${hash.expected}`, line: hash.loc.first_line, column: hash.loc.first_column})
            if (hash.recoverable) {
                this.trace(str);
            } else {
                var error = new Error(str);
                error.hash = hash;
                throw error;
            }
        };
    */
%}


%lex
%x STRING
%x CHAR

%options case-insensitive

%%


\s+											// se ignoran espacios en blanco
"//".*                                      /* IGNORE */
[/][*][^*]*[*]+([^/*][^*]*[*]+)*[/]         /* IGNORE */

"."                                         return 'DOT';
";"										    return 'SEMICOLON';
","                                         return "COMMA";
":="                                        return "COLONEQUAL"
"?"                                         return 'TERNARY';
":"                                         return "COLON";
"++"                                        return 'PLUSPLUS';
"--"                                        return 'MINUSMINUS';
"+"	                        				return 'PLUS';
"-"	                        				return 'MINUS';
"*"			                        		return 'TIMES';
"/"			                        		return 'DIVIDE';
"%"			                        		return 'MODULE';
"^^"                                        return "POW"
"<="                    					return 'LESSEQUAL';
"<"                                         return "LESS";
">="				                        return 'GREATEREQUAL';
">"					                        return 'GREATER';
"==="                                       return 'EQUALEQUALEQUAL';
"=="                                        return 'EQUALEQUAL';
"!="                                        return 'NOTEQUAL';
"="                                         return "EQUAL";
"["                                         return 'BRACKET_L';
"]"                                         return 'BRACKET_R';
"("                                         return 'PAR_L';
")"                                         return 'PAR_R';
"{"					                        return 'BRACE_L';
"}"					                        return 'BRACE_R';
"&&"                                        return 'AND';
"||"                                        return 'OR';
"^"                                         return 'XOR';
"!"                                         return 'NOT';
"$"                                         return 'DOLLAR';

"null"                                      return 'R_NULL';
"integer"                                   return 'R_INTEGER';
"double"                                    return 'R_DOUBLE';
"char"                                      return 'R_CHAR';
"boolean"                                   return 'R_BOOLEAN';

"import"                                    return 'R_IMPORT';
"var"                                       return 'R_VAR';
"const"                                     return "R_CONST";
"global"                                    return "R_GLOBAL";

"if"                                        return 'R_IF';
"else"                                      return 'R_ELSE';
"switch"                                    return 'R_SWITCH';
"case"                                      return 'R_CASE';

"continue"                                  return 'R_CONTINUE';
"break"                                     return 'R_BREAK';
"return"                                    return 'R_RETURN';

"for"                                       return 'R_FOR';
"while"                                     return 'R_WHILE';
"do"                                        return 'R_DO';

"void"                                      return 'R_VOID';

"define"                                    return "R_DEFINE";
"as"                                        return "R_AS";
"strc"                                      return "R_STRC";

"try"                                       return "R_TRY";
"catch"                                     return "R_CATCH";
"throw"                                     return "R_THROW";

"false"                                     return 'LITERAL_BOOLEAN';
"true"                                      return 'LITERAL_BOOLEAN';
[0-9]+"."[0-9]*     	                    return 'LITERAL_DOUBLE';
[0-9]+  				                    return 'LITERAL_INT';

\"                                          { strBuffer = ""; this.begin('STRING'); }
\'                                          { this.begin('CHAR'); }
([a-zA-Z])[a-zA-ZñÑ0-9_.]*".j"	            return 'FILENAME';
([a-zA-Z])[a-zA-ZñÑ0-9_]*	                return 'ID';


<STRING>\"                              { this.popState(); yytext = strBuffer; return 'LITERAL_STRING'; }
<STRING>\\\"                            { strBuffer += "\""; }
<STRING>\\\\                            { strBuffer += "\\"; }
<STRING>\\n                             { strBuffer += "\n"; }
<STRING>\\r                             { strBuffer += "\r"; }
<STRING>\\t                             { strBuffer += "\t"; }
<STRING>.                               { strBuffer += yytext; }
<STRING><<EOF>>                         { console.log("TODO error unclosed String"); }

<CHAR>\\\'\'                            { yytext = "'"; this.popState(); return 'LITERAL_CHAR'; };
<CHAR>\\\\\'                            { yytext = "\\"; this.popState(); return 'LITERAL_CHAR'; };
<CHAR>\\n\'                             { yytext = "\n"; this.popState(); return 'LITERAL_CHAR'; };
<CHAR>\\r\'                             { yytext = "\t"; this.popState(); return 'LITERAL_CHAR'; };
<CHAR>\\t\'                             { yytext = "\t"; this.popState(); return 'LITERAL_CHAR'; };
<CHAR>\\0\'                             { yytext = "\0"; this.popState(); return 'LITERAL_CHAR'; };
<CHAR>[^']\'                            { yytext = yytext.slice(0, -1);  this.popState(); return 'LITERAL_CHAR'; };
<CHAR>\'                                { yytext = "\0"; this.popState(); return 'LITERAL_CHAR'; }
<CHAR>.                                 { console.log("TODO error invalid Char... skipping"); this.popState(); }

<<EOF>>				                    return 'EOF';

.   { 
        _errores.push({type:"LEXICO", detail:`Unknown token '${yytext}'`, line: yylloc.first_line, column: yylloc.first_column});
    }

/lex

/* Asociación de operadores y precedencia */
%right  'EQUAL' 'COLONEQUAL'
%left   'R_THROW'
%right  'TERNARY' 'COLON'
%left   'MINUSMINUS' 'PLUSPLUS'
%left   'XOR'
%left   'OR'
%left   'AND'
%left   'NOTEQUAL' 'EQUALEQUAL' 'EQUALEQUALEQUAL'
%left   'GREATER' 'GREATEREQUAL' 'LESS' 'LESSEQUAL'  
%left   'PLUS' 'MINUS'
%left   'TIMES' 'DIVIDE' 'MODULE'
%right  'POW'
%right  'NOT' 'DOLLAR' UMINUS
%left   'PAR_L' 'PAR_R' 'BRACKET_L' 'BRACKET_R'
%left   'DOT'
%left   ID

%start ini

%% /* Definición de la gramática */

ini
    : l_global EOF
        { var result = {ast:$1, errores:_errores}; _errores = []; return result; }
;

l_global
    : l_global global
        { $1.push($2); $$ = $1; }
    | global
        { $$ = [$1]; }
    | l_global global SEMICOLON
        { $1.push($2); $$ = $1; }
    | global SEMICOLON
        { $$ = [$1]; }
    | error SEMICOLON
        { $$ = []; }
    | l_global error SEMICOLON
        { /*nothing*/ }
;

global
    : R_IMPORT import_list
        { $$ = {type: TYPE_OP.IMPORT, imports: $2, line: @$.first_line, column: @$.first_column}; }
    | funcDeclar
        { $$ = $1; }
    | varDeclar
        { $$ = $1; }
    | defineStruct
        { $$ = $1; }
;

defineStruct
    : R_DEFINE ID R_AS BRACKET_L l_declar BRACKET_R
        { $$ = { type: TYPE_OP.DEFINE_STRC, id: $2.toUpperCase(), l_declar: $5, line: @$.first_line, column: @$.first_column}; }
;

l_declar
    : l_declar COMMA varDeclar
        { $1.push($3); $$ = $1}
    | varDeclar
        { $$ = [$1] }
;

import_list
    : import_list COMMA FILENAME
        { $1.push($3); $$ = $1; }
    | FILENAME
        { $$ = [$1]; }
;

funcDeclar
    : type ID PAR_L l_param PAR_R BRACE_L l_statement BRACE_R
        { $$ = {type: TYPE_OP.FUNC_DEF, returnType: $1, name: $2.toUpperCase(), params: $4, block: $7, line: @$.first_line, column: @$.first_column}; }
    | R_PUBLIC type ID PAR_L l_param PAR_R BRACE_L l_statement BRACE_R
        { $$ = {type: TYPE_OP.FUNC_DEF, returnType: $2, name: $3.toUpperCase(), params: $5, block: $8, line: @$.first_line, column: @$.first_column}; }
    | ID ID PAR_L l_param PAR_R BRACE_L l_statement BRACE_R
        { $$ = {type: TYPE_OP.FUNC_DEF, returnType: $1.toUpperCase(), name: $2.toUpperCase(), params: $4, block: $7, line: @$.first_line, column: @$.first_column}; }
    | R_PUBLIC ID ID PAR_L l_param PAR_R BRACE_L l_statement BRACE_R
        { $$ = {type: TYPE_OP.FUNC_DEF, returnType: $2.toUpperCase(), name: $3.toUpperCase(), params: $5, block: $8, line: @$.first_line, column: @$.first_column}; }
;

l_param
    : l_param COMMA varDeclar
        { $1.push($3); $$ = $1; }
    | varDeclar
        { $$ = [$1]; }
    |
        { $$ = []; }
;

l_statement
    : l_statement statement
        { $1.push($2); $$ = $1; }
    | l_statement statement SEMICOLON
        { $1.push($2); $$ = $1; }
    |
        { $$ = []; }
    | l_statement error SEMICOLON
        { /*nothing*/ }
;

statement
    : varDeclar
        { $$ = $1; }
    | varAssign
        { $$ = $1; }
    | jump
        { $$ = $1; }
    | defineStruct
        { $$ = $1; }
    | if
        { $$ = $1; }
    | R_WHILE PAR_L exp PAR_R BRACE_L l_statement BRACE_R
        { $$ = {type: TYPE_OP.WHILE, cond: $3, block: $6, line: @$.first_line, column: @$.first_column}; }
    | R_DO BRACE_L l_statement BRACE_R R_WHILE PAR_L exp PAR_R
        { $$ = {type: TYPE_OP.DO_WHILE, block: $3, cond: $7, line: @$.first_line, column: @$.first_column}; }
    | R_FOR PAR_L for_init SEMICOLON exp SEMICOLON for_update PAR_R BRACE_L l_statement BRACE_R
        { $$ = {type: TYPE_OP.FOR, init: $3, cond: $5, update: $7, block: $10, line: @$.first_line, column: @$.first_column}; }
    | R_FOR PAR_L for_init SEMICOLON SEMICOLON for_update PAR_R BRACE_L l_statement BRACE_R
        { $$ = {type: TYPE_OP.FOR, init: $3, cond: null, update: $6, block: $9, line: @$.first_line, column: @$.first_column}; }
    | R_SWITCH PAR_L exp PAR_R BRACE_L l_case BRACE_R
        { $$ = {type: TYPE_OP.SWITCH, switch: $3, cases: $6, line: @$.first_line, column: @$.first_column}; }
    | R_THROW exp
        { $$ = { type: TYPE_OP.THROW, exp: $2, line: @$.first_line, column: @$.first_column}; }
    | R_TRY BRACE_L l_statement BRACE_R R_CATCH PAR_L ID ID PAR_R BRACE_L l_statement BRACE_R
        { $$ = {type: TYPE_OP.TRY, tryBlock: $3, exceptionType: $7, catchBlock: $11, line: @$.first_line, column: @$.first_column}; }
    | exp SEMICOLON
        { $$ = $1 }
;

varDeclar
    : type ID EQUAL exp
        { $$ = {type: TYPE_OP.DECLAR, jType: $1, id: $2.toUpperCase(), exp: $4, line: @$.first_line, column: @$.first_column}; }
    | ID ID EQUAL exp
        { $$ = {type: TYPE_OP.DECLAR, jType: $1.toUpperCase(), id: $2.toUpperCase(), exp: $4, line: @$.first_line, column: @$.first_column}; }
    | R_VAR ID COLONEQUAL exp  
        { $$ = {type: TYPE_OP.DECLAR, jType: $1.toUpperCase(), id: $2.toUpperCase(), exp: $4, line: @$.first_line, column: @$.first_column}; }
    | R_CONST ID COLONEQUAL exp  
        { $$ = {type: TYPE_OP.DECLAR, jType: $1.toUpperCase(), id: $2.toUpperCase(), exp: $4, line: @$.first_line, column: @$.first_column}; }
    | R_GLOBAL ID COLONEQUAL exp  
        { $$ = {type: TYPE_OP.DECLAR, jType: $1.toUpperCase(), id: $2.toUpperCase(), exp: $4, line: @$.first_line, column: @$.first_column, global: true}; }
    | type ID 
        { $$ = {type: TYPE_OP.DECLAR, jType: $1, id: $2.toUpperCase(), exp: null, line: @$.first_line, column: @$.first_column}; }
    | ID ID 
        { $$ = {type: TYPE_OP.DECLAR, jType: $1.toUpperCase(), id: $2.toUpperCase(), exp: null, line: @$.first_line, column: @$.first_column}; }
;

varAssign
    : exp EQUAL exp
        { $$ = {type: TYPE_OP.ASSIGN, id:$1, exp: $3, line: @$.first_line, column: @$.first_column}; }
;

type
    : primType
        { $$ = $1 }
    | primType BRACKET_L BRACKET_R
        { $$ = $1 + "[]"}
    | R_VOID
        { $$ = TYPE_VAL.VOID }
    | ID BRACKET_L BRACKET_R
        { $$ = $1.toUpperCase()  + "[]"}
;

primType
    : R_INTEGER
        { $$ = TYPE_VAL.INTEGER }
    | R_DOUBLE
        { $$ = TYPE_VAL.DOUBLE }
    | R_CHAR
        { $$ = TYPE_VAL.CHAR }
    | R_BOOLEAN
        { $$ = TYPE_VAL.BOOLEAN }
;

for_init
    : varDeclar
        { $$ = $1; }
    | varAssign
        { $$ = $1; }
    |
        { $$ = null; }
;

for_update
    : varAssign
        { $$ = $1; }
    | exp
        { $$ = $1; }
    |
        { $$ = null; }
;

jump
    : R_CONTINUE
        { $$ = {type: TYPE_OP.CONTINUE, line: @$.first_line, column: @$.first_column}; }
    | R_BREAK
        { $$ = {type: TYPE_OP.BREAK, line: @$.first_line, column: @$.first_column}; }
    | R_RETURN SEMICOLON
        { $$ = {type: TYPE_OP.RETURN, exp: null, line: @$.first_line, column: @$.first_column}; }
    | R_RETURN exp SEMICOLON
        { $$ = {type: TYPE_OP.RETURN, exp: $2, line: @$.first_line, column: @$.first_column}; }
;

if
    : R_IF PAR_L exp PAR_R BRACE_L l_statement BRACE_R
        { $$ = {type: TYPE_OP.IF, cond: $3, ifTrue: $6, ifFalse: null, line: @$.first_line, column: @$.first_column}; }
    | R_IF PAR_L exp PAR_R BRACE_L l_statement BRACE_R if_else
        { $$ = {type: TYPE_OP.IF, cond: $3, ifTrue: $6, ifFalse: $8, line: @$.first_line, column: @$.first_column}; }
;

if_else
    : R_ELSE if
        { $$ = $2; }
    | R_ELSE BRACE_L l_statement BRACE_R
        { $$ = {type: TYPE_OP.IF, cond: null, ifTrue: $3, ifFalse: null, line: @$.first_line, column: @$.first_column}; }
;

l_case
    : l_case case
        { $1.push($2); $$ = $1; }
    | case
        { $$ = [$1]; }
;

case
    : R_CASE exp COLON l_statement
        { $$ = {type: TYPE_OP.CASE, cond: $2, ifTrue: $4, line: @$.first_line, column: @$.first_column}; }
    | R_DEFAULT COLON l_statement
        { $$ = {type: TYPE_OP.CASE, cond: null, ifTrue: $3, line: @$.first_line, column: @$.first_column}; }
;

call
    : exp PAR_L l_exp PAR_R
        { $$ = {type:TYPE_OP.CALL, call: $1, params: $3, line: @$.first_line, column: @$.first_column}; }
    | exp PAR_L l_assign PAR_R
        { $$ = {type:TYPE_OP.CALL_JS, call: $1, params: $3, line: @$.first_line, column: @$.first_column}; }
;

l_assign
    : l_assign COMMA varAssign
        { $1.push($3); $$ = $1 }
    | varAssign
        { $$ = [$1] }
;

l_exp
    : l_exp COMMA exp
        { $1.push($3); $$ = $1; }
    | exp
        { $$ = [$1]; }
    |
        { $$ = []; }
;

access
    : exp BRACKET_L exp BRACKET_R
        { $$ = {type: TYPE_OP.ACCESS, base: $1, index: $3, line: @$.first_line, column: @$.first_column}; }
;

exp
    :  ID
        { $$ = { type: TYPE_OP.ID, val:$1.toUpperCase(), line: @$.first_line, column: @$.first_column}; }
    | atomic
        { $$ = $1; }
    | call
        { $$ = $1; }
    | exp_arithmetic
        { $$ = $1; }
    | exp_logic
        { $$ = $1; }
    | BRACE_L l_exp BRACE_R
        { $$ = {type: TYPE_OP.ARRAY_DEF, val: $2, line: @$.first_line, column: @$.first_column}; }
    | exp TERNARY exp COLON exp
        { $$ = {type: TYPE_OP.TERNARY, cond: $1, ifTrue: $3, ifFalse: $5, line: @$.first_line, column: @$.first_column}; }
    | PAR_L exp PAR_R
        { $$ = $2; }
    | access
        { $$ = $1; }
    | update
        { $$ = $1; }
    | exp DOT exp
        { $$ = {type: TYPE_OP.DOT, base: $1, next: $3, line: @$.first_line, column: @$.first_column}; }
    | PAR_L primType PAR_R exp
        { $$ = { type: TYPE_OP.CAST, endType: $2, exp: $4, line: @$.first_line, column: @$.first_column}; }
    | R_STRC ID BRACKET_L exp BRACKET_R
        { $$ = { type: TYPE_OP.STRC, jType: $2.toUpperCase() + "[]", exp: $4, line: @$.first_line, column: @$.first_column}; }
    | R_STRC primType BRACKET_L exp BRACKET_R
        { $$ = { type: TYPE_OP.STRC, jType: $2 + "[]", exp: $4, line: @$.first_line, column: @$.first_column}; }
    | R_STRC ID PAR_L PAR_R
        { $$ = { type: TYPE_OP.STRC, jType: $2.toUpperCase(), exp: null, line: @$.first_line, column: @$.first_column}; }
    | DOLLAR exp
        { $$ = {type: TYPE_OP.DOLLAR, exp: $2, line: @$.first_line, column: @$.first_column}; }
;

update
    : ID PLUSPLUS
        { $$ = {type: TYPE_OP.PLUSPLUS, op1: { type: TYPE_OP.ID, val:$1.toUpperCase(), line: @$.first_line, column: @$.first_column}, line: @$.first_line, column: @$.first_column}; }
    | ID MINUSMINUS
        { $$ = {type: TYPE_OP.MINUSMINUS, op1: { type: TYPE_OP.ID, val:$1.toUpperCase(), line: @$.first_line, column: @$.first_column}, line: @$.first_line, column: @$.first_column}; }
;

exp_arithmetic
    : MINUS exp %prec UMINUS
        { $$ = {type: TYPE_OP.UMINUS, op1: $2, op: $1, line: @$.first_line, column: @$.first_column}; }
    | exp PLUS exp
        { $$ = {type: TYPE_OP.PLUS, op1: $1, op: $2, op2: $3, line: @$.first_line, column: @$.first_column}; }
    | exp MINUS exp
        { $$ = {type: TYPE_OP.MINUS, op1: $1, op: $2, op2: $3, line: @$.first_line, column: @$.first_column}; }
    | exp TIMES exp
        { $$ = {type: TYPE_OP.TIMES, op1: $1, op: $2, op2: $3, line: @$.first_line, column: @$.first_column}; }
    | exp DIVIDE exp
        { $$ = {type: TYPE_OP.DIVIDE, op1: $1, op: $2, op2: $3, line: @$.first_line, column: @$.first_column}; }
    | exp MODULE exp
        { $$ = {type: TYPE_OP.MODULE, op1: $1, op: $2, op2: $3, line: @$.first_line, column: @$.first_column}; }
    | exp POW exp
        { $$ = {type: TYPE_OP.POW, op1: $1, op: $2, op2: $3, line: @$.first_line, column: @$.first_column}; }
;

exp_logic
    : exp EQUALEQUALEQUAL exp
        { $$ = {type: TYPE_OP.EQUALEQUALEQUAL, op1: $1, op: $2, op2: $3, line: @$.first_line, column: @$.first_column}; }
    | exp EQUALEQUAL exp
        { $$ = {type: TYPE_OP.EQUALEQUAL, op1: $1, op: $2, op2: $3, line: @$.first_line, column: @$.first_column}; }
    | exp NOTEQUAL exp
        { $$ = {type: TYPE_OP.NOTEQUAL, op1: $1, op: $2, op2: $3, line: @$.first_line, column: @$.first_column}; }
    | exp LESS exp
        { $$ = {type: TYPE_OP.LESS, op1: $1, op: $2, op2: $3, line: @$.first_line, column: @$.first_column}; }
    | exp LESSEQUAL exp
        { $$ = {type: TYPE_OP.LESSEQUAL, op1: $1, op: $2, op2: $3, line: @$.first_line, column: @$.first_column}; }
    | exp GREATER exp
        { $$ = {type: TYPE_OP.GREATER, op1: $1, op: $2, op2: $3, line: @$.first_line, column: @$.first_column}; }
    | exp GREATEREQUAL exp
        { $$ = {type: TYPE_OP.GREATEREQUAL, op1: $1, op: $2, op2: $3, line: @$.first_line, column: @$.first_column}; }
    | exp AND exp
        { $$ = {type: TYPE_OP.AND, op1: $1, op:$2, op2: $3, line: @$.first_line, column: @$.first_column}; }
    | exp OR exp
        { $$ = {type: TYPE_OP.OR, op1: $1, op:$2, op2: $3, line: @$.first_line, column: @$.first_column}; }
    | exp XOR exp
        { $$ = {type: TYPE_OP.XOR, op1: $1, op:$2, op2: $3, line: @$.first_line, column: @$.first_column}; }
    | NOT exp
        { $$ = {type: TYPE_OP.NOT, op1: $2, op: $1, line: @$.first_line, column: @$.first_column}; }
;

atomic
    : LITERAL_INT
        { $$ = AST_API.newVal(TYPE_VAL.INTEGER, Number($1), @$.first_line, @$.first_column);}
    | LITERAL_DOUBLE
        { $$ = AST_API.newVal(TYPE_VAL.DOUBLE, Number($1), @$.first_line, @$.first_column);}
    | LITERAL_BOOLEAN
        { $$ = AST_API.newVal(TYPE_VAL.BOOLEAN, $1.toUpperCase() == "TRUE" ? 1 : 0, @$.first_line, @$.first_column); }
    | LITERAL_CHAR
        { $$ = AST_API.newVal(TYPE_VAL.CHAR, $1.charCodeAt(0), @$.first_line, @$.first_column); }
    | LITERAL_STRING
        { $$ = AST_API.newVal(TYPE_VAL.STRING, $1, @$.first_line, @$.first_column); }
    | R_NULL
        { $$ = AST_API.newVal(TYPE_VAL.NULL, -1, @$.first_line, @$.first_column); }
;