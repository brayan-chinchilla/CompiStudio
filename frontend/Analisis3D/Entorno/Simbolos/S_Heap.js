var S_Heap = (function () {
    function S_Heap() {
        this.valores = new TablaLineal();
        this.valores.increaseSize(25);
    }
    S_Heap.prototype.getID = function () {
        return "Heap";
    };
    S_Heap.prototype.putValue = function (position, value) {
        if (position >= this.valores.getContador()) {
            var tmp = position - this.valores.getContador() + 25;
            this.valores.increaseSize(tmp);
        }
        this.valores.put(position, value);
    };
    S_Heap.prototype.getValue = function (position) {
        return this.valores.get(position);
    };
    S_Heap.prototype.printHeap = function () {
        this.valores.showData();
    };
    S_Heap.prototype.getHeapAsTable = function () {
        var tmp = "<thead>\n            <tr class=\"w3-black w3-hover-gray\">\n                <th>Posicion</th>\n                <th>Valor</th>\n            </tr>\n        </thead>";
        var cont = 0;
        for (; cont < this.valores.valores.length; cont++) {
            tmp += "<tr class=\"w3-hover-green\"><td align=\"center\">" + cont + "</td><td align=\"center\">" + this.valores.get(cont) + "</td></tr>\n";
        }
        return tmp;
    };
    return S_Heap;
}());
