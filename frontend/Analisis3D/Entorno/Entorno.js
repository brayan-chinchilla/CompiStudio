var Entorno = (function () {
    function Entorno() {
        this.etiquetas = new TablaLineal();
        this.variables = new TablaLineal();
        this.funciones = new Lista();
        this.retornos = new Lista();
        this.heap = null;
        this.stack = null;
        this.instructionPointer = 0;
        this.erroFlag = new S_Variable("E", 0);
        this.limpiezaActivada = false;
    }
    Entorno.prototype.putReturnValue = function (value) {
        this.retornos.pushFront(value);
    };
    Entorno.prototype.getLastReturn = function () {
        return this.retornos.pop();
    };
    Entorno.prototype.setErrorFlag = function (error) {
        this.erroFlag.setValor(error);
    };
    Entorno.prototype.getErrorFlag = function () {
        return this.erroFlag.getValor();
    };
    Entorno.prototype.isErrorEnabled = function () {
        return this.erroFlag.getValor() != 0;
    };
    Entorno.prototype.startHeap = function () {
        this.heap = new S_Heap();
    };
    Entorno.prototype.startStack = function () {
        this.stack = new S_Stack();
    };
    Entorno.prototype.getLabelPos = function (id) {
        var val = this.etiquetas.get(parseInt(id.replace("L", '').replace('l', '')));
        if (!(val instanceof S_Etiqueta)) {
            return -1;
        }
        return val.getPosition();
    };
    Entorno.prototype.getTmpValue = function (id) {
        return this.variables.get(this.getHashCode(id));
    };
    Entorno.prototype.getFuncion = function (id) {
        var aux;
        for (aux = this.funciones.getCabeza(); aux != null; aux = aux.getSiguiente()) {
            if (aux.getData().getID().localeCompare(id) == 0) {
                return aux.getData().getPosition();
            }
        }
        return -1;
    };
    Entorno.prototype.heapInitialized = function () {
        return this.heap != null;
    };
    Entorno.prototype.StackInitialized = function () {
        return this.stack != null;
    };
    Entorno.prototype.getHeap = function (pos) {
        return this.heap.getValue(pos);
    };
    Entorno.prototype.getStack = function (pos) {
        return this.stack.getValue(pos);
    };
    Entorno.prototype.putOnStack = function (pos, value) {
        this.stack.putValue(pos, value);
    };
    Entorno.prototype.putOnHeap = function (pos, value) {
        this.heap.putValue(pos, value);
    };
    Entorno.prototype.put = function (simbolo) {
        if (simbolo instanceof S_Etiqueta) {
            this.etiquetas.put(parseInt(simbolo.getID().replace("L", '').replace('l', '')), simbolo);
        }
        else if (simbolo instanceof S_Funcion) {
            this.funciones.push(simbolo);
        }
        else if (simbolo instanceof S_Variable) {
            if (simbolo.getID() == "E") {
                this.erroFlag = simbolo;
            }
            this.variables.put(this.getHashCode(simbolo.getID()), simbolo);
        }
        else if (simbolo instanceof S_Heap) {
            this.heap = simbolo;
        }
        else if (simbolo instanceof S_Stack) {
            this.stack = simbolo;
        }
    };
    Entorno.prototype.labelExists = function (id) {
        return this.etiquetas.get(parseInt(id.replace("L", '').replace('l', ''))) instanceof S_Etiqueta;
    };
    Entorno.prototype.functionExists = function (id) {
        var aux;
        for (aux = this.funciones.getCabeza(); aux != null; aux = aux.getSiguiente()) {
            if (aux.getData().getID().localeCompare(id) == 0) {
                return true;
            }
        }
        return false;
    };
    Entorno.prototype.tmpExists = function (id) {
        return this.variables.get(this.getHashCode(id)) instanceof S_Variable;
    };
    Entorno.prototype.setInstructionPointer = function (value) {
        this.instructionPointer = value;
    };
    Entorno.prototype.getInstructionPointer = function () {
        return this.instructionPointer;
    };
    Entorno.prototype.setValor = function (id, value) {
        var tmp = this.variables.get(this.getHashCode(id));
        if (tmp instanceof S_Variable) {
            tmp.setValor(value);
            return true;
        }
        return false;
    };
    Entorno.prototype.printHeap = function () {
        this.heap.printHeap();
    };
    Entorno.prototype.printStack = function () {
        this.stack.printStack();
    };
    Entorno.prototype.getStackAsTable = function () {
        if (this.stack != null) {
            return this.stack.getStackAsTable();
        }
        var tmp = "<thead>\n            <tr class=\"w3-black w3-hover-gray\">\n                <th>Posicion</th>\n                <th>Valor</th>\n            </tr>\n        </thead>";
        return tmp;
    };
    Entorno.prototype.getHeapAsTable = function () {
        if (this.heap != null) {
            return this.heap.getHeapAsTable();
        }
        var tmp = "<thead>\n            <tr class=\"w3-black w3-hover-gray\">\n                <th>Posicion</th>\n                <th>Valor</th>\n            </tr>\n        </thead>";
        return tmp;
    };
    Entorno.prototype.getHashCode = function (name) {
        var val = 0;
        for (var cont = 0; cont < name.length; cont++) {
            val += name.charCodeAt(cont);
            if (val == 116) {
                val += parseInt(name.replace("t", ''));
                break;
            }
            else if (val == 84) {
                val = 116 + parseInt(name.replace("T", ''));
                break;
            }
        }
        return val;
    };
    return Entorno;
}());
