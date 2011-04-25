
squares.Cell = function (parent, formula, value) {
    var changed = value !== null;
    var dependents = [];
    
    this.formula = function (set) {
        if (set) {
            var temp = formula;
            formula = set;
            changed = true;
            return temp;
        } else {
            return formula;
        }
    }; 
    
    this.value = function () {
        if (changed) {
            this.update();
        }

        return value;
    };
    
    this.parent = function () {
        return parent;
    };
    
    this.update = function () {
        value = squares.Cell.compute(this);
        return this;
    };
    
    this.addDependent = function (cell) {
        if (dependents.indexOf(cell) === -1) {
            if (cell.parent() !== parent) {
                return;
            }
            
            dependents.push(cell);
        }
        
        return this;
    };
    
    this.removeDependent = function (cell) {
        var index = dependents.indexOf(cell);
        
        if (index !== -1)
            dependents.splice(index, 1);
        
        return this;
    };
};

squares.Cell.compute = function (cell) {
    var parent = cell.parent();
    var formula = cell.formula();
    
    // keep track of dependencies
    if (formula[0] === '=') {
        // TODO: lexer...
        
        // parent.hasChild("A2");
        // parent.getChild("A2");
        // parent.hasChild("weight");
    } else {
        return formula;
    }
};

