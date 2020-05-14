var AsignacionHeap = (function () {
    function AsignacionHeap(valor, posision, fila, columna) {
        this.valor = valor;
        this.posision = posision;
        this.fila = fila;
        this.columna = columna;
    }
    AsignacionHeap.prototype.ejecutar = function (ent, mensajes) {
        if (ent.isErrorEnabled()) {
            return;
        }
        if (ent.heapInitialized()) {
            var res = this.valor.getValor(ent, mensajes);
            if (res != null && res instanceof ErrorResult) {
                mensajes.push(new NodoError("No se pueden ingresar valores de error al Heap", this.fila, this.columna));
                return;
            }
            var pos = this.posision.getValor(ent, mensajes);
            if (pos == null) {
                mensajes.push(new NodoError("Null Pointer Exception in Heap", this.fila, this.columna));
                return;
            }
            else if (pos instanceof ErrorResult) {
                mensajes.push(new NodoError("La posicion ingresada no es valida para el Heap (resultado de error)", this.fila, this.columna));
                return;
            }
            ent.putOnHeap(pos, res);
        }
        else {
            mensajes.push(new NodoError("El Heap aun no ha sido creado", this.fila, this.columna));
        }
    };
    return AsignacionHeap;
}());
