var TablaLineal = (function () {
    function TablaLineal() {
        this.valores = [];
        this.cabeza = 0;
    }
    TablaLineal.prototype.getContador = function () {
        return this.valores.length;
    };
    TablaLineal.prototype.peek = function () {
        return this.valores[this.cabeza];
    };
    TablaLineal.prototype.get = function (index) {
        return this.valores[index];
    };
    TablaLineal.prototype.put = function (index, value) {
        this.valores[index] = value;
    };
    TablaLineal.prototype.pop = function () {
        if (this.cabeza != -1) {
            var val = this.valores[this.cabeza];
            this.cabeza = this.cabeza - 1;
            return val;
        }
    };
    TablaLineal.prototype.push = function (data) {
        this.valores[this.cabeza++] = data;
    };
    TablaLineal.prototype.getCabeza = function () {
        return this.cabeza;
    };
    TablaLineal.prototype.increaseSize = function (value) {
        this.valores.length = this.valores.length + value;
    };
    TablaLineal.prototype.decreaseSize = function (value) {
        if (value < this.valores.length) {
            this.valores.length = this.valores.length - value;
            return true;
        }
        return false;
    };
    TablaLineal.prototype.showData = function () {
        var cont = 0;
        for (; cont < this.valores.length; cont++) {
            console.log(cont++ + ") " + this.valores[cont]);
        }
    };
    return TablaLineal;
}());
