var NodoError = (function () {
    function NodoError(descripcion, fila, columna, tipoError) {
        if (tipoError === void 0) { tipoError = "Semantico"; }
        this.tipoError = tipoError;
        this.descripcion = descripcion;
        this.fila = fila;
        this.columna = columna;
    }
    NodoError.prototype.toString = function () {
        return "Error " + this.tipoError + ", " + this.descripcion + ". En fila: [" + this.fila + "], columna: [" + this.columna + "]\n";
    };
    return NodoError;
}());
