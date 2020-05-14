var GoToStatement = (function () {
    function GoToStatement(etiquetaSalto, fila, columna) {
        this.etiquetaSalto = etiquetaSalto;
        this.fila = fila;
        this.columna = columna;
    }
    GoToStatement.prototype.isEndOfProgram = function () {
        return this.etiquetaSalto == "L1";
    };
    GoToStatement.prototype.ejecutar = function (ent, mensajes) {
        var valorSalto = ent.getLabelPos(this.etiquetaSalto);
        if (valorSalto != -1) {
            ent.setInstructionPointer(valorSalto);
        }
        else {
            mensajes.push(new NodoError("No se encontro la etiqueta " + this.etiquetaSalto, this.fila, this.columna));
        }
    };
    return GoToStatement;
}());
