var S_Etiqueta = (function () {
    function S_Etiqueta(id, position) {
        this.id = id;
        this.position = position;
    }
    S_Etiqueta.prototype.getPosition = function () {
        return this.position;
    };
    S_Etiqueta.prototype.getID = function () {
        return this.id;
    };
    return S_Etiqueta;
}());
