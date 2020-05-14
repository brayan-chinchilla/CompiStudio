var DeclaracionEstructuras = (function () {
    function DeclaracionEstructuras(nombre, fila, columna) {
        this.nombre = nombre.toLocaleLowerCase();
        this.fila = fila;
        this.columna = columna;
    }
    DeclaracionEstructuras.prototype.ejecutar = function (ent, mensajes) {
        if (this.nombre.localeCompare("heap") == 0) {
            ent.startHeap();
        }
        else if (this.nombre.localeCompare("stack") == 0) {
            ent.startStack();
        }
        else {
            mensajes.push(new NodoError("El arreglo " + this.nombre + " no esta permitido en el lenguaje", this.fila, this.columna));
        }
    };
    return DeclaracionEstructuras;
}());
