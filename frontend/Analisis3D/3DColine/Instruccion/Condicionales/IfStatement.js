var IfStatement = (function () {
    function IfStatement(condicion, etiquetaSalto, fila, columna) {
        this.condicion = condicion;
        this.etiquetaSalto = etiquetaSalto;
        this.fila = fila;
        this.columna = columna;
    }
    IfStatement.prototype.ejecutar = function (ent, mensajes) {
        var val = this.condicion.getValor(ent, mensajes);
        if (typeof val === "boolean") {
            if (val) {
                var valorSalto = ent.getLabelPos(this.etiquetaSalto);
                if (valorSalto != -1) {
                    ent.setInstructionPointer(valorSalto);
                }
                else {
                    mensajes.push(new NodoError("No se encontro la etiqueta " + this.etiquetaSalto, this.fila, this.columna));
                }
            }
            else
                ;
        }
        else {
            mensajes.push(new NodoError("booleano esperado en condicion If Then, encontrado " + typeof val, this.fila, this.columna));
        }
    };
    return IfStatement;
}());
