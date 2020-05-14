var DeclaracionFuncion = (function () {
    function DeclaracionFuncion(id, fila, columna) {
        this.id = id.toLocaleLowerCase();
        this.fila = fila;
        this.columna = columna;
        this.yaEjecutado = false;
    }
    DeclaracionFuncion.prototype.setValorSalto = function (valor) {
        this.valorSalto = valor;
    };
    DeclaracionFuncion.prototype.ejecutar = function (ent, mensajes) {
        if (!this.yaEjecutado) {
            if (!ent.functionExists(this.id)) {
                ent.put(new S_Funcion(this.id, this.valorSalto));
            }
            else {
                mensajes.push(new NodoError("La funcion " + this.id + " ya fue declarada previamente.", this.fila, this.columna));
            }
            this.yaEjecutado = true;
        }
    };
    return DeclaracionFuncion;
}());
