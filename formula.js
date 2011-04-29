squares = {};

squares.Function = function (definition, interpreted) {
    
    
    
};

squares.Function.types = {
    NAME: 1,
    PRIMITIVE: 2,
    OPERATOR: 3
};

squares.Function.Block = function (expressions) {
    
    this.push = function (expr) {
        return expressions.push(expr);
    };
    
    this.pop = function () {
        return expressions.pop();
    };
    
    this.toString = function () {
        var a = [];
        for (var j = 0; j < expressions.length; j++) {
            a.push(expressions[j].toString());
        }
        return a.join("; ");
    };
    
    this.toJS = function () {
        var 
        j,
        buffer = ["((function () {"], 
        max = expressions.length - 1;
        
        for (j = 0; j < max; j++) {
            buffer.push(expressions[j].toString(), ";");
        }
        
        buffer.push("return", expressions[max].toString(), ";", "})())");
        return buffer.join(" ");
    };
};

squares.Function.Expr = function (tokens, paren) {
    
    this.tokens = tokens;
    this.paren  = paren;
    
    this.toString = function () {
        var j, buffer = [], max = this.tokens.length, paren = ['', ''];
        
        if (this.paren == '(') paren = ['(', ')'];
        if (this.paren == '{') paren = ['{', '}'];
        if (this.paren == '[') paren = ['[', ']'];

        buffer.push(paren[0]);
        for (j = 0; j < max; j++) {
            buffer.push(this.tokens[j].toString());
        }
        buffer.push(paren[1]);
       
        return buffer.join(" ");
    };
    
    this.toJS = function () {
        return tokens;
    };
    
    this.type = squares.Function.types.PRIMITIVE;
    this.expect = [squares.Function.types.OPERATOR];
};

squares.Function.Primitive = function (value, type) {
    this.toString = function () {
        return value;
    };
    
    this.toJS = function () {
        return value;
    };

    this.type = squares.Function.types.PRIMITIVE;
    this.expect = [squares.Function.types.OPERATOR];
};

squares.Function.Operator = function (operator) {
    if (operator == '=' || operator == '===') {
        operator = '==';
    } else if (operator == '&') {
        operator = '+';
    }
    
    this.toString = function () {
        return operator;
    };
    
    this.toJS = function () {
        return operator;
    };

    this.type = squares.Function.types.OPERATOR;
    this.expect = [squares.Function.types.PRIMITIVE, squares.Function.types.NAME];
};

squares.Function.Name = function (name) {
    name = name.toUpperCase();
    
    this.toString = function () {
        return name;
    };
    
    this.toJS = function () {
        return "v:" + name;
    };

    this.type = squares.Function.types.NAME;
    this.expect = [squares.Function.types.OPERATOR];
};

squares.Function.Function = function (name, args) {
    name = name.toUpperCase();
    
    this.toString = function () {
        var buffer = [], max = args.length;
        
        for (var j = 0; j < max; j++) {
            buffer.push(args[j].toString());
        }
        
        return name + "(" + buffer.join(", ") + ")";
    };
    
    this.toJS = function () {
        return "f:" + name;
    };

    this.type = squares.Function.types.NAME;
    this.expect = [squares.Function.types.OPERATOR];
};

squares.Function.parse = function (definition) {

    var i = 0;
    var str_re = /^"[^"\\]*(?:\\.[^"\\]*)*"|^'[^'\\]*(?:\\.[^'\\]*)*'/;
    var num_re = /^(?:[0-9]*\.[0-9]+|[0-9]+\.?)(?:e[\+\-]?(?:[0-9]*\.[0-9]+|[0-9]+\.?))?/i;
    var oper_re = /^(?:[\+\-\*\/\%\^\&\;\,\(\)\{\}\[\]]|={1,3}|<>|[<>]=?)/;
    var id_re = /^[a-z_][a-z0-9_\-]*/i;
    var sp_re = /^\s*/;
 
    var peek = function (start, length) {
        if (!start) 
            start = i;
        
        if (!length || length == 1)
            return definition[start];
            
        return definition.substr(start, length);
    };
    var grab = function (i, regexp) {
        var result;

        //console.log("test", regexp, "against", definition.substr(i));
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
        
    var process_operator = function (token, tokens) {
        var op = token.toString();
        
        if (op == '(' || op == '{' || op == '[') {
            return get_paren(op);
            
        } else if (op == '%') {
            if (tokens.length === 0) {
                throw error (i, "Unexpected " + op);
            }
            
            var last_token = tokens.pop();
            return new squares.Function.Expr([
                last_token,
                new squares.Function.Operator('*'),
                new squares.Function.Primitive(0.01, "number")
            ], '(');   
        }
 
        return token;
    };
    
    var get_args = function () {
        return get(')', ';', ',');
    };
    
    var get_expr = function () {
        return get(false, ';');
    };
    
    var get_paren = function (open) {
        var close, expr;
        if (open == '(') close = ')';
        if (open == '{') close = '}';
        if (open == '[') close = ']';
        
        expr = get(close, ';');
        expr.paren = open;
        
        return expr;
    };
    
    var get = function (terminator, sep, arg_sep) {
      
        var
        op,
        token, 
        expect = [squares.Function.types.NAME, squares.Function.types.PRIMITIVE, squares.Function.types.OPERATOR],
        args   = [],
        block  = [],
        tokens = [];
        
        do {
            token = get_token();
            
            if (token === null) {
                if (terminator) 
                    throw error(i, "Expected " + terminator);
                else
                    break;
            }
            
            if (expect.indexOf(token.type) === null) {
                throw error(i, "Unexpected " + token.type);
            }
            
            if (token.type == squares.Function.types.OPERATOR) {
                token = process_operator(token, tokens);
                
                if (token.type == squares.Function.types.OPERATOR) {
                    op = token.toString();
                    
                    if (op == terminator) {
                        break;
                        
                    } else if (sep && op == sep) {
                        block.push(new squares.Function.Expr(tokens));
                        tokens = [];
                        continue;
                        
                    } else if (arg_sep && op == arg_sep) {
                        if (block.length > 0) {
                            block.push(new squares.Function.Expr(tokens));
                            args.push(new squares.Function.Block(block));
                            tokens = [];
                            block  = [];
                        } else {
                            args.push(new squares.Function.Expr(tokens));
                            tokens = [];
                        }
                        continue;
                        
                    } else if (op == ')' || op == ';' || op == ',') {
                        throw error (i, "Unexpected " + op);
                    }
                } 
            }
            
            expect = token.expect;
            tokens.push(token);
            
        } while (1);
        
        // If we've had expressions prior to this one...
        if (block.length > 0) {
            if (tokens.length > 0)
                block.push(new squares.Function.Expr(tokens));
            
            // i.e. the final and second expr was empty and hence not pushed
            if (block.length == 1)
                tokens = block.pop().tokens;
        }
        
        // Now there is either an array of more than one expression (block)
        // or an array of tokens constituting one expression (tokens)
        
        // If an array of arguments was requested, add current block / expr
        // then return that array.
        if (arg_sep) {
            if (block.length > 0) {
                args.push(new squares.Function.Block(block));
            } else {
                args.push(new squares.Function.Expr(tokens));
            }
            
            return args;
        }
        
        // Or, return either the block or the tokens
        if (block.length > 0)
            return new squares.Function.Block(block);
        
        return new squares.Function.Expr(tokens);
    };
        
    var get_token = function () {
        var token;
        
        if (i >= definition.length) {
            return null;
        }
                
        // Operators
        if ((token = grab(i, oper_re)) !== null) {
            //console.log("match op:     ", token);
            i = clear_space(i + token.length);

            return new squares.Function.Operator(token);
        
        // Strings
        } else if ((token = grab(i, str_re)) !== null) {
            //console.log("match string: ", token);
            i = clear_space(i + token.length);
            
            return new squares.Function.Primitive(token, "string");

        // Numbers
        } else if ((token = grab(i, num_re)) !== null) {
            //console.log("match number: ", token);
            i = clear_space(i + token.length);
            
            return new squares.Function.Primitive(token, "number");
                
        // Variable / Function
        } else if ((token = grab(i, id_re)) !== null) {
            //console.log("match name:   ", token);
            i = clear_space(i + token.length);
            
            if (peek() == '(') {
                i = clear_space(i + 1);
                return new squares.Function.Function(token, get_args());
                
            } else {
                name_lc = token.toLowerCase();
                if (name_lc == "true") {
                    return new squares.Function.Primitive("TRUE", "boolean");
                } else if (name_lc == "false") {
                    return new squares.Function.Primitive("FALSE", "boolean");
                }
                
                return new squares.Function.Name(token);
            }
            
        // Nothing matches
        } else {
            throw error (i, "Unexpected " + peek());
        }
    };
        
    i = clear_space(i);
    return get_expr();
};

var tests = [
"( SET(myVar, 2); SET(moles, myVar * fw); )",
"FN(1);",
"IF(EXP(I * PI) == -.03E-3., 'true', false)",
"POW(2 * 2, 3)",
"TEST((myVar + 2) / 4,3,\"\\\"hello, there\\\"\")",
"1.0"
];
for (var k = 0; k < tests.length; k++) 
    console.log(squares.Function.parse(tests[k]).toString());
