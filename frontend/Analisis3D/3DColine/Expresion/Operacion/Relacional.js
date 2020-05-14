var Relacional = (function () {
    function Relacional(opIzq, opDer, tipo, fila, columna) {
        this.opIzq = opIzq;
        this.opDer = opDer;
        this.tipo = tipo;
        this.fila = fila;
        this.columna = columna;
    }
    Relacional.prototype.getValor = function (ent, mensajes) {
        var val1 = this.opIzq.getValor(ent, mensajes);
        var val2 = this.opDer.getValor(ent, mensajes);
        if (val1 instanceof ErrorResult) {
            return val1;
        }
        if (val2 instanceof ErrorResult) {
            return val2;
        }
        if (this.tipo == TipoOperacionRelacional.IGUAL) {
            return val1 == val2;
        }
        else if (this.tipo == TipoOperacionRelacional.NOIGUAL) {
            return val1 != val2;
        }
        else if (typeof val1 === "number" && typeof val2 === "number") {
            switch (this.tipo) {
                case TipoOperacionRelacional.MAYOR:
                    return val1 > val2;
                case TipoOperacionRelacional.MENOR:
                    return val1 < val2;
                case TipoOperacionRelacional.MAYORIGUAL:
                    return val1 >= val2;
                case TipoOperacionRelacional.MENORIGUAL:
                    return val1 <= val2;
            }
        }
        else {
            mensajes.push(new NodoError("Null Pointer Exception. (R) Las Operaciones Relacionales deben contener valores numericos", this.fila, this.columna));
            return new ErrorResult();
        }
    };
    return Relacional;
}());
var TipoOperacionRelacional;
(function (TipoOperacionRelacional) {
    TipoOperacionRelacional[TipoOperacionRelacional["MAYOR"] = 0] = "MAYOR";
    TipoOperacionRelacional[TipoOperacionRelacional["MENOR"] = 1] = "MENOR";
    TipoOperacionRelacional[TipoOperacionRelacional["MAYORIGUAL"] = 2] = "MAYORIGUAL";
    TipoOperacionRelacional[TipoOperacionRelacional["MENORIGUAL"] = 3] = "MENORIGUAL";
    TipoOperacionRelacional[TipoOperacionRelacional["IGUAL"] = 4] = "IGUAL";
    TipoOperacionRelacional[TipoOperacionRelacional["NOIGUAL"] = 5] = "NOIGUAL";
})(TipoOperacionRelacional || (TipoOperacionRelacional = {}));
