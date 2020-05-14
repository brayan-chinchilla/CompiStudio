var AccesoStack = (function () {
    function AccesoStack(posicion, fila, columna) {
        this.posicion = posicion;
        this.fila = fila;
        this.columna = columna;
    }
    AccesoStack.prototype.getValor = function (ent, mensajes) {
        if (ent.StackInitialized()) {
            var pos = this.posicion.getValor(ent, mensajes);
            if (pos instanceof ErrorResult) {
                mensajes.push(new NodoError("Se ingreso una posicion invalida del Stack (resultado de error)", this.fila, this.columna));
                return pos;
            }
            else if (pos == null) {
                mensajes.push(new NodoError("Null Pointer Exception in Stack", this.fila, this.columna));
                return new ErrorResult();
            }
            var res = ent.getStack(pos);
            return res;
        }
        else {
            mensajes.push(new NodoError("El Stack aun no ha sido creado", this.fila, this.columna));
            return new ErrorResult();
        }
    };
    return AccesoStack;
}());
