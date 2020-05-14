var S_Funcion = (function () {
    function S_Funcion(id, position) {
        this.id = id;
        this.position = position;
    }
    S_Funcion.prototype.getPosition = function () {
        return this.position;
    };
    S_Funcion.prototype.getID = function () {
        return this.id;
    };
    return S_Funcion;
}());
