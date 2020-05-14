var Nodo = (function () {
    function Nodo(data) {
        this.data = data;
        this.anterior = this.siguiente = null;
    }
    Nodo.prototype.setSiguiente = function (siguiente) {
        this.siguiente = siguiente;
    };
    Nodo.prototype.getSiguiente = function () {
        return this.siguiente;
    };
    Nodo.prototype.setAnterior = function (anterior) {
        this.anterior = anterior;
    };
    Nodo.prototype.getAnterior = function () {
        return this.anterior;
    };
    Nodo.prototype.setData = function (value) {
        this.data = value;
    };
    Nodo.prototype.getData = function () {
        return this.data;
    };
    Nodo.prototype.toString = function () {
        if (this.data == null) {
            return "null";
        }
        return this.data.toString();
    };
    return Nodo;
}());
