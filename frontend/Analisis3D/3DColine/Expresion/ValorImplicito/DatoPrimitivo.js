var DatoPrimitivo = (function () {
    function DatoPrimitivo(valor) {
        this.valor = valor;
    }
    DatoPrimitivo.prototype.getValor = function (ent, mensajes) {
        return this.valor;
    };
    return DatoPrimitivo;
}());
