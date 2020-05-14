var AsignacionStack = (function () {
    function AsignacionStack(valor, posision, fila, columna) {
        this.valor = valor;
        this.posision = posision;
        this.fila = fila;
        this.columna = columna;
    }
    AsignacionStack.prototype.ejecutar = function (ent, mensajes) {
        if (ent.isErrorEnabled()) {
            return;
        }
        if (ent.StackInitialized()) {
            var res = this.valor.getValor(ent, mensajes);
            if (res != null && res instanceof ErrorResult) {
                mensajes.push(new NodoError("No se pueden ingresar valores de error al Stack", this.fila, this.columna));
                return;
            }
            var pos = this.posision.getValor(ent, mensajes);
            if (pos == null) {
                mensajes.push(new NodoError("Null Pointer Exception in Stack", this.fila, this.columna));
                return;
            }
            else if (pos instanceof ErrorResult) {
                mensajes.push(new NodoError("La posicion ingresada no es valida para el Stack (resultado de error)", this.fila, this.columna));
                return;
            }
            ent.putOnStack(pos, res);
        }
        else {
            mensajes.push(new NodoError("El Stack aun no ha sido creado", this.fila, this.columna));
        }
    };
    return AsignacionStack;
}());
