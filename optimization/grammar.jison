%{
    const TYPE_OP = require('./util').TYPE_OP;
    var _report = [];
%}

%lex
%options case-insensitive

%%

\s+											// se ignoran espacios en blanco
"#".*										// comentario simple línea
[#][*][^*]*[*]+([^#*][^*]*[*]+)*[#]         // comentario multi linea

"-"[0-9]+("."[0-9]*)?     	                return 'NEG_LITERAL_NUM';
\"\%d\"|\"\%i\"|\"\%c\"                     return 'R_PRINTF';

","                                         return "COMMA";
":"                                         return "COLON";
";"                                         return "SEMICOLON";
"+"	                        				return 'PLUS';
"-"	                        				return 'MINUS';
"*"			                        		return 'TIMES';
"/"			                        		return 'DIVIDE';
"%"			                        		return 'MODULE';
"<>"                                        return 'NOTEQUAL';
"<="                    					return 'LESSEQUAL';
"<"                                         return "LESS";
">="				                        return 'GREATEREQUAL';
">"					                        return 'GREATER';
"=="                                        return 'EQUALEQUAL';
"="                                         return "EQUAL";
"["                                         return 'BRACKET_L';
"]"                                         return 'BRACKET_R';
"("                                         return 'PAR_L';
")"                                         return 'PAR_R';

"var"                                       return 'R_VAR';
"begin"                                     return 'R_BEGIN';
"goto"                                      return 'R_GOTO';
"stack"                                     return 'R_STACK';
"heap"                                      return 'R_HEAP';
"end"                                       return 'R_END';
"call"                                      return 'R_CALL';
"if"                                        return 'R_IF';
"proc"                                      return 'R_PROC';
"print"                                     return 'R_PRINT';


[0-9]+("."[0-9]*)?     	                    return 'LITERAL_NUM';
L[0-9]+	                                    return 'LABEL';
([a-zA-Z_])[a-zA-ZñÑ0-9_]*	                return 'ID';

<<EOF>>				                        return 'EOF';

.       { console.error('Error léxico: ' + yytext + ', en la linea: ' + yylloc.first_line + ', en la columna: ' + yylloc.first_column); }

/lex

/* Asociación de operadores y precedencia */
%left 'LESS' 'LESSEQUAL', 'GREATER', 'GREATEREQUAL', 'NOTEQUAL', 'EQUALEQUAL'
%left 'PLUS' 'MINUS'
%left 'TIMES' 'DIVIDE' 'MODULE'
%left  UMINUS

%start ini

%% /* Definición de la gramática */

ini
    : l_statement EOF
        { var result = {instructions: $1, report: _report}; _report = []; return result; }
;

l_statement
    : l_statement statement
        { if($2 != null) $1.push($2); $$ = $1; }
    | 
        { $$ = []; }
;

l_id
    : l_id COMMA ID
        { $1.push($3.toLowerCase()); $$ = $1; }
    | l_id COMMA R_HEAP BRACKET_L BRACKET_R
        { $1.push("heap[]"); $$ = $1; }
    | l_id COMMA R_STACK BRACKET_L BRACKET_R
        { $1.push("stack[]"); $$ = $1; }
    | ID
        { $$ = [$1.toLowerCase()]}
    | R_HEAP BRACKET_L BRACKET_R
        { $$ = ["heap[]"]}
    | R_STACK BRACKET_L BRACKET_R
        { $$ = ["stack[]"]}
;

statement
    : R_VAR l_id SEMICOLON
        { $$ = {type: TYPE_OP.DECLAR, l_id: $2, line: @$.first_line}}
    | R_PROC ID R_BEGIN
        { $$ = {type: TYPE_OP.PROC_DEF, id: $2, line: @$.first_line}}
    | R_END
        { $$ = {type: TYPE_OP.PROC_END, line: @$.first_line}}
    | R_IF PAR_L cond PAR_R R_GOTO LABEL SEMICOLON
        { $$ = {type: TYPE_OP.IF, cond: $3, label: $6, line: @$.first_line}}
    | R_GOTO LABEL SEMICOLON
        { $$ =  {type: TYPE_OP.GOTO, label: $2, line: @$.first_line}}
    | R_CALL ID SEMICOLON
        { $$ = {type: TYPE_OP.CALL, id: $2, line: @$.first_line}}
    | R_PRINT PAR_L R_PRINTF COMMA atomic PAR_R SEMICOLON
        { $$ = {type: TYPE_OP.PRINT, format: $3, atomic: $5, line: @$.first_line}}
    | LABEL COLON
        { $$ = {type: TYPE_OP.LABEL, label: $1, line: @$.first_line}}
    | assign SEMICOLON
        { if($1 != null) $1.line = @$.first_line; $$ = $1 }
;

atomic
    : ID
        { $$ = {type: TYPE_OP.ID, val: $1.toLowerCase()} }
    | LITERAL_NUM
        { $$ = {type: TYPE_OP.NUM, val: $1} }
    | NEG_LITERAL_NUM
        { $$ = {type: TYPE_OP.NUM, val: $1} }
    | R_STACK BRACKET_L atomic BRACKET_R
        { $$ = {type: TYPE_OP.DS, val: "stack[" + $3.val + "]"}; }
    | R_HEAP BRACKET_L atomic BRACKET_R
        { $$ = {type: TYPE_OP.DS, val: "heap[" + $3.val + "]"}; }
;

cond
    : atomic LESS atomic
        { $$ = {op1: $1, op: $2, op2: $3}; }
    | atomic LESSEQUAL atomic
        { $$ = {op1: $1, op: $2, op2: $3}; }
    | atomic GREATER atomic
        { $$ = {op1: $1, op: $2, op2: $3}; }
    | atomic GREATEREQUAL atomic
        { $$ = {op1: $1, op: $2, op2: $3}; }
    | atomic NOTEQUAL atomic
        { $$ = {op1: $1, op: $2, op2: $3}; }
    | atomic EQUALEQUAL atomic
        { $$ = {op1: $1, op: $2, op2: $3}; }
;

assign
    : atomic EQUAL MINUS atomic %prec UMENOS
        {
            //x = - 0
            if($atomic2.val == '0'){
                _report.push({
                    original: [$1.val, $2, $3, $4.val].join(" "),
                    optimized: `${$1.val} = 0;`,
                    rule: 13, line: @$.first_line})
                $$ = {type: TYPE_OP.ASSIGN, target: $1, op1: $4, op: null, op2: null};
            }
            else
                $$ = {type: TYPE_OP.ASSIGN, target: $1, op1: $4, op: $3, op2: null}
        }
    | atomic EQUAL atomic PLUS atomic
        {
            //x = x + 0 || x = 0 + x
            if($atomic2.val == '0' && $atomic1.val == $atomic3.val || $atomic3.val == '0' && $atomic1.val == $atomic2.val){
                _report.push({
                    original: [$1.val, $2, $3.val, $4, $5.val].join(" "),
                    optimized: "#eliminated",
                    rule: 8, line: @$.first_line})
                $$ = null;
            }
            //x = 0 + y
            else if($atomic2.val == '0'){
                _report.push({
                    original: [$1.val, $2, $3.val, $4, $5.val].join(" "),
                    optimized: [$1.val, $2, $5.val].join(" "),
                    rule: 12, line: @$.first_line})
                $$ = {type: TYPE_OP.ASSIGN, target:$1, op1:$5, op:null, op2:null};
            }
            //x = y + 0
            else if($atomic3.val == '0'){
                _report.push({
                    original: [$1.val, $2, $3.val, $4, $5.val].join(" "),
                    optimized: [$1.val, $2, $3.val].join(" "),
                    rule: 12, line: @$.first_line})
                $$ = {type: TYPE_OP.ASSIGN, target:$1, op1:$3, op:null, op2:null};
            }
            else
                $$ = {type: TYPE_OP.ASSIGN, target:$1, op1:$3, op:$4, op2:$5};
        }
    | atomic EQUAL atomic MINUS atomic
        {
            //x = x - 0
            if($atomic3.val == '0' && $atomic1.val == $atomic2.val){
                _report.push({
                    original: [$1.val, $2, $3.val, $4, $5.val].join(" "),
                    optimized: "#eliminated",
                    rule: 9, line: @$.first_line})
                $$ = null;
            }
            //x = 0 - x
            else if($atomic2.val == '0'){
                _report.push({
                    original: [$1.val, $2, $3.val, $4, $5.val].join(" "),
                    optimized: [$1.val, $2, $4, $5.val].join(" "),
                    rule: -1, line: @$.first_line})
                $$ = {type: TYPE_OP.ASSIGN, target:$1, op1:$5, op:$4, op2:null};
            }
            //x = y - 0
            else if($atomic3.val == '0'){
                _report.push({
                    original: [$1.val, $2, $3.val, $4, $5.val].join(" "),
                    optimized: [$1.val, $2, $3.val].join(" "),
                    rule: 13, line: @$.first_line})
                $$ = {type: TYPE_OP.ASSIGN, target:$1, op1:$3, op:null, op2:null};
            }
            else
                $$ = {type: TYPE_OP.ASSIGN, target:$1, op1:$3, op:$4, op2:$5};
        }
    | atomic EQUAL atomic TIMES atomic
        {
            //x = x * 1 || x = 1 * x
            if($atomic2.val == '1' && $atomic1.val == $atomic3.val || $atomic3.val == '1' && $atomic1.val == $atomic2.val){
                _report.push({
                    original: [$1.val, $2, $3.val, $4, $5.val].join(" "),
                    optimized: "#eliminated",
                    rule: 10, line: @$.first_line})
                $$ = null;
            }
            //x = 1 * y
            else if($atomic2.val == '1'){
                _report.push({
                    original: [$1.val, $2, $3.val, $4, $5.val].join(" "),
                    optimized: [$1.val, $2, $5.val].join(" "),
                    rule: 14, line: @$.first_line})
                $$ = {type: TYPE_OP.ASSIGN, target:$1, op1:$5, op:null, op2:null};
            }
            //x = y * 1
            else if($atomic3.val == '1'){
                _report.push({
                    original: [$1.val, $2, $3.val, $4, $5.val].join(" "),
                    optimized: [$1.val, $2, $3.val].join(" "),
                    rule: 14, line: @$.first_line})
                $$ = {type: TYPE_OP.ASSIGN, target:$1, op1:$3, op:null, op2:null};
            }
            //x = x * 0 || x = 0 * x
            else if($atomic2.val == '0' || $atomic3.val == '0'){
                _report.push({
                    original: [$1.val, $2, $3.val, $4, $5.val].join(" "),
                    optimized: [$1.val, $2, "0"].join(" "),
                    rule: 17, line: @$.first_line})
                $$ = {type: TYPE_OP.ASSIGN, target:$1, op1:{type: TYPE_OP.NUM, val: "0"}, op:null, op2:null};
            }
            //x = 2 * y
            else if($atomic2.val == '2'){
                _report.push({
                    original: [$1.val, $2, $3.val, $4, $5.val].join(" "),
                    optimized: [$1.val, $2, $5.val, "+", $5.val].join(" "),
                    rule: 16, line: @$.first_line})
                $$ = {type: TYPE_OP.ASSIGN, target:$1, op1:$5, op:"+", op2:$5};
            }
            //x = 2 * y
            else if($atomic3.val == '2'){
                _report.push({
                    original: [$1.val, $2, $3.val, $4, $5.val].join(" "),
                    optimized: [$1.val, $2, $3.val, "+", $3.val].join(" "),
                    rule: 16, line: @$.first_line})
                $$ = {type: TYPE_OP.ASSIGN, target:$1, op1:$3, op:"+", op2:$3};
            }
            else
                $$ = {type: TYPE_OP.ASSIGN, target:$1, op1:$3, op:$4, op2:$5};
        }
    | atomic EQUAL atomic DIVIDE atomic
        {
            //x = x / 1
            if($atomic3.val == '1' && $atomic1.val == $atomic2.val){
                _report.push({
                    original: [$1.val, $2, $3.val, $4, $5.val].join(" "),
                    optimized: "#eliminated",
                    rule: 11, line: @$.first_line})
                $$ = null;
            }
            //x = y / 1
            else if($atomic3.val == '1'){
                _report.push({
                    original: [$1.val, $2, $3.val, $4, $5.val].join(" "),
                    optimized: [$1.val, $2, $3.val].join(" "),
                    rule: 15, line: @$.first_line})
                $$ = {type: TYPE_OP.ASSIGN, target:$1, op1:$3, op:null, op2:null};
            }
            //x = 0 / y
            else if($atomic2.val == '0'){
                _report.push({
                    original: [$1.val, $2, $3.val, $4, $5.val].join(" "),
                    optimized: [$1.val, $2, "0"].join(" "),
                    rule: 18, line: @$.first_line})
                $$ = {type: TYPE_OP.ASSIGN, target:$1, op1:{type: TYPE_OP.NUM, val: "0"}, op:null, op2:null};
            }
            else
                $$ = {type: TYPE_OP.ASSIGN, target:$1, op1:$3, op:$4, op2:$5};
        }
    | atomic EQUAL atomic MODULE atomic
        {
            //x = y % y
            if($atomic2.val == $atomic3.val){
                _report.push({
                    original: [$1.val, $2, $3.val, $4, $5.val].join(" "),
                    optimized: [$1.val, $2, "0"].join(" "),
                    rule: -2, line: @$.first_line})
                $$ = {type: TYPE_OP.ASSIGN, target:$1, op1:{type: TYPE_OP.NUM, val: "0"}, op:null, op2:null};
            }
            else
                $$ = {type: TYPE_OP.ASSIGN, target:$1, op1:$3, op:$4, op2:$5};
        }
    | atomic EQUAL atomic
        {
            $$ = {type: TYPE_OP.ASSIGN, target: $1, op1: $3, op:null, op2:null};
        }
;