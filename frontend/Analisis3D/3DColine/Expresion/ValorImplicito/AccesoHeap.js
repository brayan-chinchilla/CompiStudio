var AccesoHeap = (function () {
    function AccesoHeap(posicion, fila, columna) {
        this.posicion = posicion;
        this.fila = fila;
        this.columna = columna;
    }
    AccesoHeap.prototype.getValor = function (ent, mensajes) {
        if (ent.heapInitialized()) {
            var pos = this.posicion.getValor(ent, mensajes);
            if (pos instanceof ErrorResult) {
                mensajes.push(new NodoError("No se ingreso una posicion valida del Heap (resultado de error)", this.fila, this.columna));
                return pos;
            }
            else if (pos == null) {
                mensajes.push(new NodoError("Null Pointer Exception in Heap", this.fila, this.columna));
                return new ErrorResult();
            }
            var res = ent.getHeap(pos);
            return res;
        }
        else {
            mensajes.push(new NodoError("El Heap aun no ha sido creado", this.fila, this.columna));
            return new ErrorResult();
        }
    };
    return AccesoHeap;
}());
