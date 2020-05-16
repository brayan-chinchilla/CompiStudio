let parser = require('./grammar')
const TYPE_OP = require('./util').TYPE_OP;

function optimize(source, sizeMirilla){
    let ast = [];

    // invocamos a nuestro parser con el contendio del archivo de entradas
    parsedSource = parser.parse(source);
    ast = parsedSource.instructions;
    _report = _report.concat(parsedSource.report);

    var result = []
    for(var i = 0; i < ast.length; i = i + sizeMirilla){
        var mirilla = ast.slice(i, i + sizeMirilla)

        optimizeRule1(mirilla);
        optimizeRule2(mirilla);
        optimizeRule4(mirilla);
        optimizeRule5(mirilla);
        optimizeRule6(mirilla);
        optimizeRule7(mirilla);
        
        result = result.concat(mirilla);
    }

    return buildString(result);
}

function buildString(result){
    var output = [];
    result.forEach((inst) => {
        switch(inst.type){
            case TYPE_OP.DECLAR:
                output.push(`var ${inst.l_id.join(", ")};`)
                break;
            case TYPE_OP.ASSIGN:
                if(inst.op != null && inst.op2 != null)
                    output.push(`${inst.target.val} = ${inst.op1.val} ${inst.op} ${inst.op2.val};`)
                else if(inst.op != null && inst.op2 == null)
                    output.push(`${inst.target.val} = ${inst.op} ${inst.op1.val};`)
                else
                    output.push(`${inst.target.val} = ${inst.op1.val};`)
                break;
            case TYPE_OP.IF:
                output.push(`if (${inst.cond.op1.val} ${inst.cond.op} ${inst.cond.op2.val}) goto ${inst.label};`)
                break;
            case TYPE_OP.GOTO:
                output.push(`goto ${inst.label};`)
                break;
            case TYPE_OP.CALL:
                output.push(`call ${inst.id};`)
                break;
            case TYPE_OP.PRINT:
                output.push(`print(${inst.format}, ${inst.atomic.val});`)
                break;
            case TYPE_OP.PROC_DEF:
                output.push(`\nproc ${inst.id} begin`);
                break;
            case TYPE_OP.PROC_END:
                output.push(`end`);
                break;
            case TYPE_OP.LABEL:
                output.push(`${inst.label}:`)
                break;
        }
    });
    return output.join("\n");
}

function optimizeRule1(mirilla){
    for(var i = 0; i < mirilla.length; i++){
        //check if current line is plain assignment x = y
        if(mirilla[i].type == TYPE_OP.ASSIGN && mirilla[i].op == null){
            var target = mirilla[i].target.val;
            var assignment = mirilla[i].op1.val;

            //loop from i to end of mirilla
            for(var lookup = i + 1; lookup < mirilla.length; lookup++){
                //if line is plain assignment y = x
                if(mirilla[lookup].type == TYPE_OP.ASSIGN && mirilla[lookup].op == null && mirilla[lookup].target.val == assignment && mirilla[lookup].op1.val == target){
                    _report.push({
                        original: [mirilla[i].target.val, '=', mirilla[i].op1.val, '\n', mirilla[lookup].target.val, '=', mirilla[lookup].op1.val].join(" "),
                        optimized: [mirilla[i].target.val, '=', mirilla[i].op1.val].join(" "),
                        rule: 1,
                        line: mirilla[lookup].line, 
                    })
                    mirilla.splice(lookup, 1);
                    break;
                }
                //if tmp is used or data_structure is modified break
                else if(mirilla[lookup].type == TYPE_OP.ASSIGN){
                    if(mirilla[lookup].target.val == target || mirilla[lookup].target.val == assignment)
                        break;
                    if(mirilla[i].target.type == TYPE_OP.DS && mirilla[lookup].target.type == TYPE_OP.DS)
                        break;
                }
                //if there is flow-interrupt break
                else if(mirilla[lookup].type == TYPE_OP.LABEL || mirilla[lookup].type == TYPE_OP.CALL){
                    break;
                }
            }
        }
    }
}

function optimizeRule2(mirilla){
    for(var i = 0; i < mirilla.length; i++){
        //check if i is goto
        if(mirilla[i].type == TYPE_OP.GOTO){
            var destinyLabel = mirilla[i].label;

            //loop from i to end of mirilla
            for(var lookup = i + 1; lookup < mirilla.length; lookup++){
                if(mirilla[lookup].type == TYPE_OP.LABEL){
                    //if different label break
                    if(mirilla[lookup].label != destinyLabel){
                        break
                    }
                    //if label is goto target
                    else {
                        _report.push({
                            original: buildString(mirilla.slice(i, lookup + 1)),
                            optimized: buildString([mirilla[lookup]]),
                            rule: 2,
                            line: mirilla[i].line
                        })
                        mirilla.splice(i, lookup - i);
                        i = lookup - i;
                        break;
                    }
                }
            }
        }
    }
}

function evaluateConstantIf(cond){
    var constant1 = Number(cond.op1.val);
    var constant2 = Number(cond.op2.val);

    //evaluate constant
    switch(cond.op){
        case "==":
            return constant1 == constant2
        case "<>":
            return constant1 != constant2
        case "<":
            return constant1 < constant2
        case "<=":
            return constant1 <= constant2
        case ">":
            return constant1 > constant2
        case ">=":
            return constant1 >= constant2
    }
}

function optimizeRule4(mirilla){
    for(var i = 0; i < mirilla.length; i++){
        //if line if IF
        if(mirilla[i].type == TYPE_OP.IF){
            //if operands are constants and result is always true
            if(mirilla[i].cond.op1.type == TYPE_OP.NUM && mirilla[i].cond.op2.type == TYPE_OP.NUM && evaluateConstantIf(mirilla[i].cond)){
                //if goto follows
                if(i < mirilla.length - 1 && mirilla[i + 1].type == TYPE_OP.GOTO){
                    _report.push({
                        original: buildString(mirilla.slice(i, i + 2)),
                        optimized: `goto ${mirilla[i].label};`,
                        rule: 4,
                        line: mirilla[i].line
                    })
                    mirilla.splice(i, 2, {type: TYPE_OP.GOTO, label: mirilla[i].label, line: mirilla[i].line})
                }
                //if goto does not follow
                else{
                    _report.push({
                        original: buildString([mirilla[i]]),
                        optimized: `goto ${mirilla[i].label};`,
                        rule: 4,
                        line: mirilla[i].line
                    })
                    mirilla.splice(i, 1, {type: TYPE_OP.GOTO, label: mirilla[i].label, line: mirilla[i].line})
                }
            }
        }
    }
}

function optimizeRule5(mirilla){
    for(var i = 0; i < mirilla.length; i++){
        //if line is IF
        if(mirilla[i].type == TYPE_OP.IF){
            //if operands are constants and result is always false
            if(mirilla[i].cond.op1.type == TYPE_OP.NUM && mirilla[i].cond.op2.type == TYPE_OP.NUM && !evaluateConstantIf(mirilla[i].cond)){
                _report.push({
                    original: buildString([mirilla[i]]),
                    optimized: `#eliminated`,
                    rule: 5,
                    line: mirilla[i].line
                })
                mirilla.splice(i, 1);
            }
        }
    }
}

function optimizeRule6(mirilla){
    for(var i = 0; i < mirilla.length; i++){
        //if line is goto
        if(mirilla[i].type == TYPE_OP.GOTO){
            var destinyLabel = mirilla[i].label;

            //loop from i to end of mirilla
            for(var lookup = i + 1; lookup < mirilla.length; lookup++){
                //if destinyLabel is found
                if(lookup < mirilla.length - 1 && mirilla[lookup].type == TYPE_OP.LABEL && mirilla[lookup].label == destinyLabel){
                    //see if next statement is a jump
                    if(mirilla[lookup + 1].type == TYPE_OP.GOTO){
                        _report.push({
                            original: buildString([mirilla[i]]),
                            optimized: `goto ${mirilla[lookup + 1].label}`,
                            rule: 6,
                            line: mirilla[i].line
                        })
                        mirilla.splice(i, 1, {type: TYPE_OP.GOTO, label: mirilla[lookup + 1].label, line: mirilla[i].line})
                    }
                    break;
                }
            }
        }
    }
}

function optimizeRule7(mirilla){
    for(var i = 0; i < mirilla.length; i++){
        //if line is IF
        if(mirilla[i].type == TYPE_OP.IF){
            var destinyLabel = mirilla[i].label;

            //loop from i to end of mirilla
            for(var lookup = i + 1; lookup < mirilla.length; lookup++){
                //if destiny Label is found
                if(lookup < mirilla.length - 1 && mirilla[lookup].type == TYPE_OP.LABEL && mirilla[lookup].label == destinyLabel){
                    //see if next statement is a jump
                    if(mirilla[lookup + 1].type == TYPE_OP.GOTO){
                        _report.push({
                            original: buildString([mirilla[i]]),
                            optimized: `if(${mirilla[i].cond.op1.val} ${mirilla[i].cond.op} ${mirilla[i].cond.op2.val}) goto ${mirilla[lookup + 1].label}`,
                            rule: 7,
                            line: mirilla[i].line
                        })
                        mirilla.splice(i, 1, {type: TYPE_OP.IF, cond: mirilla[i].cond, label: mirilla[lookup + 1].label, line: mirilla[i].line});
                    }
                    break;
                }
            }
        }
    }
}

var _report = [];
module.exports.optimize = (source, sizeMirilla = 15) => {
    _report = [];
    try{
        var output = optimize(source, sizeMirilla)
        return {
            C3D_Optimizado: output,
            report: _report,
            errorMessage: null
        }
    } catch(e){
        console.log(e);
        return {
            C3D_Optimizado: "",
            report: [],
            errorMessage: e
        }
    }    
}