var DeclaracionTemporal = (function () {
    function DeclaracionTemporal(nombres, fila, columna) {
        this.nombres = nombres;
        this.fila = fila;
        this.columna = columna;
        this.yaEjecutado = false;
    }
    DeclaracionTemporal.prototype.ejecutar = function (ent, mensajes) {
        var _this = this;
        if (!this.yaEjecutado) {
            this.nombres.forEach(function (nombre) {
                if (!ent.tmpExists(nombre.toLocaleLowerCase())) {
                    ent.put(new S_Variable(nombre.toLocaleLowerCase()));
                }
                else {
                    mensajes.push(new NodoError("La variable con el nombre " + nombre + " ya existe.", _this.fila, _this.columna));
                }
            });
            this.yaEjecutado = true;
        }
    };
    return DeclaracionTemporal;
}());
