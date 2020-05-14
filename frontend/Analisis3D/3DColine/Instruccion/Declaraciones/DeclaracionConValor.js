var DeclaracionConValor = (function () {
    function DeclaracionConValor(nombre, valor, fila, columna) {
        this.nombre = nombre.toLocaleLowerCase();
        this.valor = valor;
        this.fila = fila;
        this.columna = columna;
    }
    DeclaracionConValor.prototype.ejecutar = function (ent, mensajes) {
        var val = this.valor.getValor(ent, mensajes);
        if (val instanceof ErrorResult) {
            mensajes.push(new NodoError("Valor de inicializacion invalido para " + this.nombre + " no se creara la variable.", this.fila, this.columna));
            return;
        }
        if (!ent.tmpExists(this.nombre)) {
            ent.put(new S_Variable(this.nombre, val));
        }
        else {
            mensajes.push(new NodoError("La variable con el nombre " + this.nombre + " ya existe.", this.fila, this.columna));
        }
    };
    return DeclaracionConValor;
}());
