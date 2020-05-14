var Imprimir = (function () {
    function Imprimir(valor, tipo, conSalto, fila, columna) {
        this.valor = valor;
        this.fila = fila;
        this.columna = columna;
        this.tipo = tipo;
        this.conSalto = conSalto;
    }
    Imprimir.prototype.ejecutar = function (ent, mensajes) {
        if (ent.isErrorEnabled()) {
            return;
        }
        var val = this.valor.getValor(ent, mensajes);
        var res = val.toString();
        if (this.tipo == tipoImpresion.CHAR) {
            val = Math.round(val);
            res = String.fromCharCode(val);
        }
        if (this.tipo == tipoImpresion.INT) {
            res = Math.round(val).toString();
        }
        mensajes.push(res);
        if (this.conSalto) {
            mensajes.push("\n");
        }
    };
    return Imprimir;
}());
var tipoImpresion;
(function (tipoImpresion) {
    tipoImpresion[tipoImpresion["CHAR"] = 0] = "CHAR";
    tipoImpresion[tipoImpresion["INT"] = 1] = "INT";
    tipoImpresion[tipoImpresion["DOUBLE"] = 2] = "DOUBLE";
})(tipoImpresion || (tipoImpresion = {}));
