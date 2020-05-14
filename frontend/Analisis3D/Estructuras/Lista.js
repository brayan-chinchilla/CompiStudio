var Lista = (function () {
    function Lista() {
        this.cabeza = this.cola = null;
        this.contador = 0;
    }
    Lista.prototype.pushFront = function (data) {
        var nuevo = new Nodo(data);
        nuevo.setSiguiente(this.cabeza);
        if (this.cabeza == null) {
            this.cola = nuevo;
        }
        else {
            this.cabeza.setAnterior(nuevo);
        }
        this.cabeza = nuevo;
        this.contador++;
    };
    Lista.prototype.peek = function () {
        return this.cabeza;
    };
    Lista.prototype.get = function (index) {
        var aux;
        var cont = 0;
        for (aux = this.getCabeza(); aux != null; aux = aux.getSiguiente()) {
            if (cont == index) {
                return aux;
            }
            cont++;
        }
        console.log('Encontre un valor nulo en ' + index);
        return null;
    };
    Lista.prototype.pop = function () {
        if (this.cabeza != null) {
            var tmp = this.cabeza;
            this.cabeza = this.cabeza.getSiguiente();
            this.contador--;
            return tmp;
        }
        return null;
    };
    Lista.prototype.push = function (data) {
        var nuevo = new Nodo(data);
        if (this.cabeza == null) {
            this.cabeza = nuevo;
        }
        else {
            this.cola.setSiguiente(nuevo);
            nuevo.setAnterior(this.cola);
        }
        this.cola = nuevo;
        this.contador++;
    };
    Lista.prototype.getCabeza = function () {
        return this.cabeza;
    };
    Lista.prototype.getCola = function () {
        return this.cola;
    };
    Lista.prototype.getContador = function () {
        return this.contador;
    };
    Lista.prototype.increaseSize = function (value) {
        var cont = 0;
        while (cont < value) {
            this.push(null);
            cont++;
        }
    };
    Lista.prototype.decreaseSize = function (value) {
        if (value > this.contador) {
            return false;
        }
        var cont = 0;
        while (cont < value) {
            this.cola = this.cola.getAnterior();
            this.cola.siguiente = null;
            this.contador--;
            cont++;
        }
        return true;
    };
    Lista.prototype.showData = function () {
        var aux;
        var cont = 0;
        for (aux = this.getCabeza(); aux != null; aux = aux.getSiguiente()) {
            console.log(cont++ + ") " + aux.getData());
        }
    };
    return Lista;
}());
