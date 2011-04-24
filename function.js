squares = {};

squares.Function = function (definition, interpreted) {
    
    
    
};

squares.Function.Expr = function (tokens) {
    this.toString = function () {
        var a = [];
        for (var j = 0; j < tokens.length; j++) {
            a.push(tokens[j].toString());
        }
        return "(" + a.join(" ") + ")";
    };
    
    this.toJS = function () {
        return tokens;
    };
};

squares.Function.Primitive = function (value, type) {
    this.toString = function () {
        return value;
    };
    
    this.toJS = function () {
        return value;
    };
};

squares.Function.Operator = function (operator) {
    if (operator == '==' || operator == '===') {
        operator = '=';
    } else if (operator == '&') {
        operator = '+';
    }
    
    this.toString = function () {
        return operator;
    };
    
    this.toJS = function () {
        return operator;
    };
};

squares.Function.Name = function (name) {
    name = name.toUpperCase();
    
    this.toString = function () {
        return name;
    };
    
    this.toJS = function () {
        return "v:" + name;
    };
};

squares.Function.Function = function (name, args) {
    name = name.toUpperCase();
    
    this.toString = function () {
        var a = [];
        for (var j = 0; j < args.length; j++) {
            a.push(args[j].toString());
        }
        return name + "(" + a.join(", ") + ")";
    };
    
    this.toJS = function () {
        return "f:" + name;
    };
};

squares.Function.parse = function (definition) {
    var types = {
        NAME: 1,
        PRIMITIVE: 2,
        OPERATOR: 3
    };
    var i = 0;
    var nest = 0;
    var tokens = [];
    var str_re = /^"[^"\\]*(?:\\.[^"\\]*)*"|^'[^'\\]*(?:\\.[^'\\]*)*'/;
    var num_re = /^(?:[0-9]+|[0-9]*\.[0-9]+)(?:e[\+\-]?[0-9]*(?:\.[0-9]+)?)?/i;
    var oper_re = /^[\+\-\*\/\%\^\&\;\, \(\)]|={1,3}|[<>]=?|<>/;
    var id_re = /^[a-z_][a-z0-9_\-]+/i;
    var sp_re = /^\s*/;
 
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
    
    var get_args = function (num_args, multi_expr) {
        var args = [];
        var expr = [];
        var tokens = [];
        var nest = 0;
        var token = "";
        var expect = [types.NAME, types.PRIMITIVE, types.OPERATOR];
        
        while (i < definition.length) {
            i = clear_space(i);
            
            if ((token = grab(i, oper_re)) !== null) {
                if (expect.indexOf(types.OPERATOR) === null) {
                    throw error(i, "Unexpected " + token);
                }
                console.log("match op: ", token);
                i = clear_space(i + token.length);
 
                if (token == '(') {
                    tokens.push(new squares.Function.Expr(get_args(1, false)));
                    expect = [types.OPERATOR];
                    continue;
                    
                } else if (token == ')') {
                    if (multi_expr) {
                        expr.push(tokens);
                        tokens = [];
                        args.push(expr);
                        expr = [];
                    } else {
                        args.push(tokens);
                        expr = [];
                    }
                    
                    break;
                    
                } else if (token == ',') {
                    if (num_args && args.length >= num_args) {
                        throw error(i, "Too many arguments");
                    }
                    
                    if (multi_expr) {
                        expr.push(tokens);
                        tokens = [];
                        args.push(expr);
                        expr = [];
                    } else {
                        args.push(tokens);
                        expr = [];
                    }
                    
                    continue;
                    
                } else if (token == ';') {
                    if (!multi_expr) {
                        throw error(i, "Only one expression allowed");
                    }
                    
                    expr.push(tokens);
                    tokens = [];
                    expect = [types.NAME, types.PRIMITIVE, types.OPERATOR];
                    
                    continue;
                    
                } else if (token == '%') {
                    if (tokens.length === 0) {
                        throw error (i, "Syntax error");
                    }
                    
                    var last_token = tokens.pop();
                    tokens.push(new squares.Function.Expr([
                        token,
                        new squares.Function.Operator('*'),
                        new squares.Function.Primitive(0.01, "number")
                    ]));
                    
                    expect = [types.OPERATOR];
                    
                    continue;
                    
                } else if (token == '+' || token == '-') {
                    if (tokens.length === 0) {
                        tokens.push(new squares.Function.Primitive(0, "number"));
                    }
                }
                
                tokens.push(new squares.Function.Operator(token));
                expect = [types.NAME, types.PRIMITIVE];
                
            } else if ((token = grab(i, str_re)) !== null) {
                if (expect.indexOf(types.PRIMITIVE) === null) {
                    throw error(i, "Unexpected String");
                }
                console.log("match string: ", token);
                i = clear_space(i + token.length);
                
                tokens.push(new squares.Function.Primitive(token, "string"));
                expect = [types.OPERATOR];
                
            } else if ((token = grab(i, num_re)) !== null) {
                if (expect.indexOf(types.PRIMITIVE) === null) {
                    throw error(i, "Unexpected Number");
                }
                console.log("match number: ", token);
                i = clear_space(i + token.length);
                
                tokens.push(new squares.Function.Primitive(token, "number"));
                expect = [types.OPERATOR];
                
            } else if ((token = grab(i, id_re)) !== null) {
                if (expect.indexOf(types.NAME) === null) {
                    throw error(i, "Unexpected " + token);
                }
 
                console.log("match name: ", token);
                i = clear_space(i + token.length);
                
                if (definition[i] == '(') {
                    i = clear_space(i + 1);
                    tokens.push(new squares.Function.Function(token, get_args(false, true)));
                } else {
                    name_lc = token.toLowerCase();
                    if (name_lc == "true") {
                        tokens.push(new squares.Function.Primitive("true", "boolean"));
                    } else if (name_lc == "false") {
                        tokens.push(new squares.Function.Primitive("false", "boolean"));
                    }
                    tokens.push(new squares.Function.Name(token));
                }
                
                expect = [types.OPERATOR];
                
            } else {
                throw error (i, "Syntax error");
            }
        }
        
        if (multi_expr) {
            if (tokens.length)
                expr.push(tokens);
            if (expr.length)
                args.push(expr);
        } else {
            if (tokens.length)
                args.push(tokens);
        }

        if (num_args && num_args == 1) {
            return args[0];
        } else {
            return args;
        }
    };
    
    return get_args(1, true);
};

//console.log(squares.Function.parse("PI + 1"));
console.log(squares.Function.parse("SQRT(2 * 2)").toString());
//console.log(squares.Function.parse("TEST(2,3,\"hello, there\")"));
//console.log(squares.Function.parse("1.0"));
