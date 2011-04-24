squares = {};

squares.Function = function (definition, interpreted) {
    
    
    
};


squares.Function.parse = function (definition) {
    var char;
    var types = {
        EMPTY: 0,
        NAME: 1,
        FUNCTION: 2,
        ENDFUNCTION: 3,
        STRING: 4,
        NUMBER: 5,
        OPERATOR: 6
    };
    var nest = 0;
    var token = "";
    var tokens = [];
    var str_re = /^"[^"\\]*(?:\\.[^"\\]*)*"|^'[^'\\]*(?:\\.[^'\\]*)*'/;
    var num_re = /^(?:[0-9]+|[0-9]*\.[0-9]+)(?:e[\+\-]?[0-9]*(?:\.[0-9]+)?)?/i;
    var oper_re = /^[\+\-\*\/\%\^\&\;\, ]|={1,3}|[<>]=?|<>/;
    var id_re = /^[a-z_][a-z0-9_\-]+/i;
    var sp_re = /^\s*/;
    //var q_re = /^'[^'\\]*(?:\\.[^'\\]*)*'/;
 
    var grab = function (i, regexp) {
        var result;

        if ((result = regexp.exec(definition.substr(i))) !== null)
            return result[0];

        return null;
    };
    var clear_space = function (i) {
        var space;
        if ((space = grab(i, sp_re)) !== null) {
            return i + space.length;
        }
        return i;
    };
    var error = function (i, msg) {
        return "Parse: at " + i + ", " + msg;
    };
    
    for (var i = 0; i < definition.length; ) {
        i = clear_space(i);
        char = definition[i];
        console.log("loop start: ", i, char);
        
        if ((token = grab(i, oper_re)) !== null) {
            console.log("match op: ", token);
            tokens.push({type: types.OPERATOR, content: token});
            i = clear_space(i + token.length);
            token = "";
        } else if ((token = grab(i, str_re)) !== null) {
            console.log("match string: ", token);
            tokens.push({type: types.STRING, content: token});
            i = clear_space(i + token.length);
            token = "";
        } else if ((token = grab(i, num_re)) !== null) {
            console.log("match number: ", token);
            tokens.push({type: types.NUMBER, content: token});
            i = clear_space(i + token.length);
            token = "";
        } else if ((token = grab(i, id_re)) !== null) {
            console.log("match name: ", token);
            i = clear_space(i + token.length);
            if (definition[i] == '(') {
                nest++;
                i = clear_space(i + 1);
                tokens.push({type: types.FUNCTION, content: token});
                token = "";
                if (definition[i] == ')') {
                    nest++;
                    i = clear_space(i + 1);
                    tokens.push({type: types.EMPTY, content: null});
                    tokens.push({type: types.ENDFUNCTION, content: null});
                }
                continue;
            } else {
                tokens.push({type: types.NAME, content: token});
                token = "";
            }
        } else {
            throw error (i, "Syntax error");
        }
        if (nest > 0) {
            char = definition[i];
            if (char == ')') {
                nest--;
                i = clear_space(i + 1);
                tokens.push({type: types.ENDFUNCTION, content: null});
            } else if (char == ',') {
                i = clear_space(i + 1);
            } else {
                throw error(i, "Expected ) or ,");
            }
        }
    }
    
    return tokens;
};

//console.log(squares.Function.parse("PI + 1"));
console.log(squares.Function.parse("SQRT(2 * 2)"));
//console.log(squares.Function.parse("TEST(2,3,\"hello, there\")"));
//console.log(squares.Function.parse("1.0"));
