
/*
Data has properties (cells), with names
Each Dimension has a new set of [Data]
Cells can only communicate with siblings
*/

squares.DataDefinition = function (fields) {
    if (!fields) fields = [];
    var behaviours = {};
    
    var subscribers = [];
    this.register = function (object) {
        if (subscribers.indexOf(object) === -1)
            subscribers.push(object);
        
        return this;
    };
    
    this.unregister = function (object) {
        var index = subscribers.indexOf(object);
        
        if (index !== -1)
            subscribers.remove(index);
        
        return this;
    };
    
    this.addField = function (field, index) {
        if (!field instanceof squares.DataDefinition.Field) 
            throw "field must be a squares.DataDefinition.Field";
        
        if (index)
            fields.insert(field, index);
        else
            fields.push(field);
        
        for (var i = 0; i < subscribers.length; ++i)
            subscribers[i].addField(field);
        
        return this;
    };
    
    this.getField = function (name) {
        for (var i = 0; i < fields.length; ++i)
            if (fields[i].name() == name)
                return fields[i];
        
        return null;
    };
    
    this.removeField = function (field) {
        var index = fields.indexOf(field);
        
        if (index !== -1)
            fields.remove(index);
        
        for (var i = 0; i < subscribers.length; ++i)
            subscribers[i].removeField(field);
        
        return this;
    };
};

squares.DataDefinition.Field = function (name, defaultValue) {
    this.name = function () {
        return name;
    };
    
    this.defaultValue = function () {
        return defaultValue;
    };
};

squares.Data = function (parent, definition, data) {
    var fields     = {};
    
    this.hasChild = function (name) {
        return name in fields;
    };
    
    this.getChild = function (name) {
        return fields[name];
    };
    
    this.addField = function (field) {
        var name = field.name();
        
        if (!this.hasChild(name))
            fields[name] = new squares.Cell(this, field.defaultValue());
        
        return this;
    };
    
    this.removeField = function (field) {
        var name = field.name();
        
        if (this.hasChild(name))
            delete fields[name];
        
        return this;
    };
    
    if (!definition instanceof squares.DataDefinition) {
        throw "definition should be a squares.DataDefinition";
    }
    definition.register(this);
    
    var definedFields = definition.fields();
    for (var i = 0; i < definedFields.length; ++i) {
        this.addField(definedFields[i]);
    }
    
    if (data && data instanceof Object)
        for (var name in data)
            if (fields[name])
                fields[name].formula(data[name]);
    
    
};

