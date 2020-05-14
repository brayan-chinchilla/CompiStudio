var AccesoVariable = (function () {
    function AccesoVariable(id, fila, columna) {
        this.id = id.toLocaleLowerCase();
        this.fila = fila;
        this.columna = columna;
    }
    AccesoVariable.prototype.getValor = function (ent, mensajes) {
        var variable = ent.getTmpValue(this.id);
        if (!(variable instanceof S_Variable)) {
            mensajes.push(new NodoError("La variable con el id " + this.id + " no existe", this.fila, this.columna));
            return new ErrorResult();
        }
        return variable.getValor();
    };
    return AccesoVariable;
}());
