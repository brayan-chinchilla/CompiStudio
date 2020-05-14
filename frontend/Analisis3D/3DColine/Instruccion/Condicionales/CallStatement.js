var CallStatement = (function () {
    function CallStatement(id, fila, columna) {
        this.id = id.toLocaleLowerCase();
        this.fila = fila;
        this.columna = columna;
    }
    CallStatement.prototype.setOriginalPos = function (valor) {
        this.posicionOriginal = valor;
    };
    CallStatement.prototype.ejecutar = function (ent, mensajes) {
        if (ent.isErrorEnabled()) {
            return;
        }
        var tmpFunction = ent.getFuncion(this.id);
        if (tmpFunction != -1) {
            ent.setInstructionPointer(tmpFunction);
            ent.putReturnValue(this.posicionOriginal);
        }
        else {
            mensajes.push(new NodoError("No existe la funcion con el id " + this.id, this.fila, this.columna));
        }
    };
    return CallStatement;
}());
