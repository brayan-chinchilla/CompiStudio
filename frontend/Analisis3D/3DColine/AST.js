var AST = (function () {
    function AST(lista) {
        this.list = lista;
    }
    AST.prototype.execute = function () {
        var ent = new Entorno();
        var mensajes = new Lista();
        var val;
        for (var cont = 0; cont < this.list.getContador(); cont++) {
            val = this.list.get(cont);
            if (val instanceof DeclaracionEtiqueta) {
                val.setValorSalto(cont);
                val.ejecutar(ent, mensajes);
            }
            else if (val instanceof DeclaracionFuncion) {
                val.setValorSalto(cont);
                val.ejecutar(ent, mensajes);
            }
            else if (val instanceof CallStatement) {
                val.setOriginalPos(cont + 1);
            }
            else if (val instanceof DeclaracionTemporal) {
                val.ejecutar(ent, mensajes);
            }
        }
        var auxCount;
        for (ent.setInstructionPointer(0); ent.getInstructionPointer() < this.list.getContador();) {
            auxCount = ent.getInstructionPointer();
            val = this.list.get(auxCount);
            val.ejecutar(ent, mensajes);
            if (ent.getInstructionPointer() == auxCount) {
                ent.setInstructionPointer(ent.getInstructionPointer() + 1);
            }
        }
        var cadenaResultante = "";
        var aux;
        for (aux = mensajes.getCabeza(); aux != null; aux = aux.getSiguiente()) {
            cadenaResultante += aux.getData().toString();
        }
        var tmp1 = ent.getStackAsTable();
        var tmp2 = ent.getHeapAsTable();
        return new NodoRetorno(cadenaResultante, tmp1, tmp2);
    };
    return AST;
}());
