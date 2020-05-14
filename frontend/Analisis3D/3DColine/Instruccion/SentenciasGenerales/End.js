var End = (function () {
    function End() {
    }
    End.prototype.ejecutar = function (ent, mensajes) {
        var val = ent.getLastReturn();
        if (val != null)
            ent.setInstructionPointer(val.getData());
    };
    return End;
}());
