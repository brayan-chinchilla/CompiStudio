var Aritmetico = (function () {
    function Aritmetico(opIzq, opDer, tipo, fila, columna) {
        this.opIzq = opIzq;
        this.opDer = opDer;
        this.tipo = tipo;
        this.fila = fila;
        this.columna = columna;
    }
    Aritmetico.prototype.getValor = function (ent, mensajes) {
        var val1 = this.opIzq.getValor(ent, mensajes);
        var val2 = this.opDer.getValor(ent, mensajes);
        if (val1 instanceof ErrorResult) {
            return val1;
        }
        if (val2 instanceof ErrorResult) {
            return val2;
        }
        if (typeof val1 === 'number' && typeof val1 === 'number') {
            switch (this.tipo) {
                case TipoOperacionAritmetica.SUMA:
                    return val1 + val2;
                case TipoOperacionAritmetica.RESTA:
                    return val1 - val2;
                case TipoOperacionAritmetica.MULTIPLICACION:
                    return val1 * val2;
                case TipoOperacionAritmetica.DIVISION:
                    if (val2 == 0) {
                        mensajes.push(new NodoError("Division por 0 no permitida", this.fila, this.columna));
                        return new ErrorResult();
                    }
                    return val1 / val2;
                case TipoOperacionAritmetica.MODULO:
                    if (val2 == 0) {
                        mensajes.push(new NodoError("Modulo 0 no permitido", this.fila, this.columna));
                        return new ErrorResult();
                    }
                    return val1 % val2;
            }
        }
        else {
            mensajes.push(new NodoError("Null Pointer Exception. (A) Las Operaciones aritmeticas deben contener valores numericos", this.fila, this.columna));
            return new ErrorResult();
        }
    };
    return Aritmetico;
}());
var TipoOperacionAritmetica;
(function (TipoOperacionAritmetica) {
    TipoOperacionAritmetica[TipoOperacionAritmetica["SUMA"] = 0] = "SUMA";
    TipoOperacionAritmetica[TipoOperacionAritmetica["RESTA"] = 1] = "RESTA";
    TipoOperacionAritmetica[TipoOperacionAritmetica["MULTIPLICACION"] = 2] = "MULTIPLICACION";
    TipoOperacionAritmetica[TipoOperacionAritmetica["DIVISION"] = 3] = "DIVISION";
    TipoOperacionAritmetica[TipoOperacionAritmetica["MODULO"] = 4] = "MODULO";
})(TipoOperacionAritmetica || (TipoOperacionAritmetica = {}));
