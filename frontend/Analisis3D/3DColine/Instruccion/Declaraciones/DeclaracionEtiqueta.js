var DeclaracionEtiqueta = (function () {
    function DeclaracionEtiqueta(id, fila, columna) {
        this.id = id;
        this.fila = fila;
        this.columna = columna;
        this.yaEjecutado = false;
    }
    DeclaracionEtiqueta.prototype.setValorSalto = function (valor) {
        this.valorSalto = valor;
    };
    DeclaracionEtiqueta.prototype.ejecutar = function (ent, mensajes) {
        if (!this.yaEjecutado) {
            if (!ent.labelExists(this.id)) {
                ent.put(new S_Etiqueta(this.id, this.valorSalto));
            }
            else {
                mensajes.push(new NodoError("La etiqueta " + this.id + " ya fue declarada previamente.", this.fila, this.columna));
            }
            this.yaEjecutado = true;
        }
    };
    return DeclaracionEtiqueta;
}());
