var S_Stack = (function () {
    function S_Stack() {
        this.valores = new TablaLineal();
        this.valores.increaseSize(25);
    }
    S_Stack.prototype.getID = function () {
        return "Stack";
    };
    S_Stack.prototype.putValue = function (position, value) {
        if (position >= this.valores.getContador()) {
            var tmp = position - this.valores.getContador() + 25;
            this.valores.increaseSize(tmp);
        }
        this.valores.put(position, value);
    };
    S_Stack.prototype.getValue = function (position) {
        return this.valores.get(position);
    };
    S_Stack.prototype.reduceStack = function (value) {
        return this.valores.decreaseSize(value);
    };
    S_Stack.prototype.printStack = function () {
        this.valores.showData();
    };
    S_Stack.prototype.getStackAsTable = function () {
        var tmp = "<thead>\n            <tr class=\"w3-black w3-hover-gray\">\n                <th>Posicion</th>\n                <th>Valor</th>\n            </tr>\n        </thead>";
        var aux;
        var cont = 0;
        for (; cont < this.valores.valores.length; cont++) {
            tmp += "<tr class=\"w3-hover-green\"><td align=\"center\">" + cont + "</td><td align=\"center\">" + this.valores.get(cont) + "</td></tr>\n";
        }
        return tmp;
    };
    return S_Stack;
}());
