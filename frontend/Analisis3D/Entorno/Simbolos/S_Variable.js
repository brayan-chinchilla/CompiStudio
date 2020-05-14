var S_Variable = (function () {
    function S_Variable(id, valor) {
        this.id = id;
        if (valor) {
            this.valor = valor;
        }
        else {
            this.valor = 0;
        }
    }
    S_Variable.prototype.getID = function () {
        return this.id;
    };
    S_Variable.prototype.getValor = function () {
        return this.valor;
    };
    S_Variable.prototype.setValor = function (valor) {
        this.valor = valor;
    };
    return S_Variable;
}());
