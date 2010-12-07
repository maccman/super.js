var SuperEvent = {
  on: function(name, callback){     
    var args  = jQuery.makeArray(arguments);  
    var names = args.shift().split(" ");
    
    for (var i=0; i < names.length; i++)
      this.onEvent(names[i], callback);
  },
  
  onEvent: function(name, callback){
    if ( !name || !callback ) return;
    if ( !this.handlers ) this.handlers = {};
    if ( !this.handlers[name] ) this.handlers[name] = [];
    this.handlers[name].push(callback);
  },
  
  trigger: function(names){    
    var args  = jQuery.makeArray(arguments);  
    var names = args.shift().split(" ");
    
    for (var i=0; i < names.length; i++)
      if (this.triggerEvent(names[i], args) === false) return false;
  },
  
  triggerEvent: function(name, args){
    if ( !this.handlers ) return;
    
    var callbacks = this.handlers[name];
    if ( !callbacks ) return;
    
    for(var i=0, len = callbacks.length; i < len; i++)
      if (callbacks[i].apply(this, args) === false) return false;
  },
  
  setupEvents: function(events){
    events = jQuery.makeArray(events);
    jQuery.each(events, this.proxy(function(i, name){
      this[name] = function(){
        var args = jQuery.makeArray(arguments);

        if (typeof args[0] == "function") {
          args.unshift(name);
          this.on.apply(this, args);
        } else {
          args.unshift(name);
          this.trigger.apply(this, args);
        }
      };
    }));
  }
};

SuperEvent.bind = SuperEvent.on;