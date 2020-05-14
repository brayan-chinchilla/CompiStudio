var Asignacion = (function () {
    function Asignacion(valor, nombre, fila, columna) {
        this.valor = valor;
        this.nombre = nombre.toLocaleLowerCase();
        this.fila = fila;
        this.columna = columna;
    }
    Asignacion.prototype.ejecutar = function (ent, mensajes) {
        if (ent.isErrorEnabled()) {
            if (this.nombre.toUpperCase() != "E") {
                return;
            }
        }
        var val = this.valor.getValor(ent, mensajes);
        if (val != null && val instanceof ErrorResult) {
            mensajes.push(new NodoError("No se puede asignar un valor de error a la variable " + this.nombre, this.fila, this.columna));
        }
        else {
            if (this.nombre.toUpperCase() == "E") {
                if (val == 0) {
                    mensajes.push("Excepcion " + getErrorType(ent.getErrorFlag()) + " capturada en fila " + this.fila + "\n");
                    ent.setErrorFlag(0);
                }
                else {
                    mensajes.push("Excepcion " + getErrorType(val) + " ocurrida en fila " + this.fila + "\n");
                    ent.setErrorFlag(val);
                }
            }
            else {
                if (!(ent.setValor(this.nombre, val))) {
                    mensajes.push(new NodoError("No se encontro la variable " + this.nombre, this.fila, this.columna));
                }
            }
        }
    };
    return Asignacion;
}());
function getErrorType(error) {
    switch (error) {
        case 1:
            return "ArithmeticException";
        case 2:
            return "IndexOutOfBoundException";
        case 3:
            return "UncaughtException";
        case 4:
            return "NullPointerException";
        case 5:
            return "InvalidCastingException";
        case 6:
            return "HeapOverflowError";
        case 7:
            return "StackOverflowError";
        default:
            return "Invalida";
    }
}
