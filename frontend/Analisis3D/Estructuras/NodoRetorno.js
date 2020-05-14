var NodoRetorno = (function () {
    function NodoRetorno(salida, stackAsTable, heapAsTable) {
        this.salida = salida;
        this.stackAsTable = stackAsTable;
        this.heapAsTable = heapAsTable;
    }
    NodoRetorno.prototype.getSalida = function () {
        return this.salida;
    };
    NodoRetorno.prototype.getStackAsTable = function () {
        return this.stackAsTable;
    };
    NodoRetorno.prototype.getHeapAsTable = function () {
        return this.heapAsTable;
    };
    return NodoRetorno;
}());
