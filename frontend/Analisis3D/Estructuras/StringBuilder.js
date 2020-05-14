var StringBuilder = (function () {
    function StringBuilder() {
        this.cadena = [];
    }
    StringBuilder.prototype.append = function (cadena) {
        this.cadena.push(cadena);
    };
    StringBuilder.prototype.toString = function () {
        var tmp = "";
        this.cadena.forEach(function (value) {
            tmp += value + "\r\n";
        });
        return tmp;
    };
    StringBuilder.prototype.getStringBuilder = function () {
        return this.cadena;
    };
    return StringBuilder;
}());
