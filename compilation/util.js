const TYPE_VAL = require('./instructions').TYPE_VAL

class Scope {
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

    getSymbol(id){
        //TODO error if var does not exist
        return this.symbols.find(s => s.id == id)
    }
}

class Symbol {
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

class Error {
    constructor(detail, line, column){
        this.detail = detail;
        this.line = line;
        this.column = column;
    }
}

module.exports = {
    Scope: Scope,
    Symbol: Symbol,
    Error: Error
}