//= require <superclass>
//= require <supermodel>

SuperModel.Resource = new SuperClass;

(function($){
  var Resource = SuperModel.Resource;
  
	$.put = function( url, data, callback, type ) {
    // shift arguments if data argument was omited
		if ( $.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = {};
		}

		return $.ajax({
			type: "PUT",
			url: url,
			data: data,
			success: callback,
			dataType: type
		});
  };
  
  $.ajaxDelete = function( url, callback, type ) {
		return $.ajax({
			type: "DELETE",
			url: url,
			success: callback,
			dataType: type
		});
  };
  
  Resource.get    = $.get;
  Resource.post   = $.post;
  Resource.put    = $.put;
  Resource.ajaxDelete = $.ajaxDelete;
  
  var underscore = function(str) {
    return str.replace(/::/g, "/")
              .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
              .replace(/([a-z\d])([A-Z])/g, "$1_$2")
              .replace(/-/g, "_")
              .toLowerCase();
  };
  
  var pathify = function(str) { 
    return underscore(str) + "s"; 
  };
  
  // TODO - flatten
  var join = function() { 
    return $.makeArray(arguments).join("/"); 
  };
    
  Resource.include({
    init: function(model, endpoint){      
      this.model    = model;
      this.endpoint = endpoint;
            
      if ( !this.endpoint )
        this.endpoint = join(null, pathify(this.model.className));
    },
    
    get: function(path, callback){ 
      return this._class.get(join(this.endpoint, path), callback, "json");
    },
    
    post: function(path, data, callback){ 
      return this._class.post(join(this.endpoint, path), data, callback, "json");
    },
    
    put: function(path, data, callback){ 
      return this._class.put(join(this.endpoint, path), data, callback, "json");
    },
    
    ajaxDelete: function(path, callback){ 
      return this._class.ajaxDelete(join(this.endpoint, path), callback, "json");
    },
    
    findSingle: function(path, callback){
      return this.get(
        path, 
        function(record){        
          var instance = new this.model(record);
          instance.newRecord = false;
          callback(instance)
        }
      );
    },
    
    findMultiple: function(path, callback){
      return this.get(
        path, 
        function(records){
          callback($.map(records, function(record){
            var instance = new this.model(record);
            instance.newRecord = false;
            return instance;
          }));
        }
      );
    },
    
    all: function(callback){
      return this.findMultiple(null, callback);
    },
    
    find: function(id, callback){
      return this.findSingle(id, callback);
    },
    
    create: function(instance, callback){
      return this.post(
        null,
        instance.attributes(), 
        callback
      );
    },
    
    update: function(instance, callback){
      return this.put(
        instance.id, 
        instance.attributes(), 
        callback
      );
    },
    
    destroy: function(instance, callback){
      return this.ajaxDelete(
        instance.id,
        callback
      );
    }
  });
  
  Resource.Model = {
    preload: function(){
      this.resource().get(
        null, this.proxy(this.populate)
      );
    },
        
    resource: function(){
      return(new Resource(this, this.endpoint));
    },
    
    extended: function(base){
      base.endpoint = join(null, pathify(base.className));
      
      // base.afterCreate(function(rec){
      //   base.resource().create(rec);
      // });
      // 
      // base.afterUpdate(function(rec){
      //   base.resource().update(rec);
      // });
      // 
      // base.afterDestroy(function(rec){
      //   base.resource().destroy(rec);
      // });
    }
  };
})(jQuery)