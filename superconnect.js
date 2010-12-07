//= require <jquery.tmpl>
//= require <superclass>
//= require <superevent>

/*
 * jQuery data chaining plugin
 * Copyright 2010, Alex MacCaw
 * Licensed under the MIT license.
 */
var SuperConnect = new SuperClass;

SuperConnect.include({
  init: function(element, klass, options){
    this.options    = options || {};
    this.singleton  = this.options.singleton || false;
    this.collection = !this.singleton;
    this.filter     = function(){ return true; };
    
    // Builders are now deprecated in favour of events
    this.builder    = this.options.builder;
    
    this.setKlass(klass);
    this.setElement(element);
  },
  
  setKlass: function(klass){
    if ( !klass ) return;
    
    this.klass = klass;
    if (this.collection)
      this.klass.on("populate", this.proxy(function(item){ this.onPopulate() }));
      
    // Not passing function instances so we can easily override
    this.klass.on("create",  this.proxy(function(item){ this.onCreate(item) }));
    this.klass.on("update",  this.proxy(function(item){ this.onUpdate(item) }));
    this.klass.on("destroy", this.proxy(function(item){ this.onDestroy(item) }));    
  },
  
  setElement: function(element){
    if ( !element ) return;    
    
    this.element  = jQuery(element);
        
    if (this.options.custom) return;
    this.template = this.element.template(null);
    this.element.empty();
  },
  
  setItem: function(item){
    if ( !this.singleton ) throw "Must be singleton";
    if ( !item ) return;
    this.item   = item;
    this.filter = function(i){ return(i === item); }
    this.render();
  },
  
  paginate: function(index, length){
    if ( !this.collection ) throw "Must be collection";
    this._paginate = [index, length];
  },
  
  render: function(data){
    if ( !this.klass )   throw "Klass not set";
    if ( !this.element ) throw "Element not set";
    if ( !data ) data = this.allItems();
    
    // Generate and append elements
    var elements = this.renderTemplate(data);
    
    this.element.trigger("beforeRender");
    
    if ( !this.options.custom ) {
      this.element.empty();
      this.element.append(elements);
            
      for (var i=0; i < elements.length; i++)
        jQuery(elements[i]).trigger("render", data[i]);
    }
    
    this.element.trigger("render");
  },

  // Private functions
  
  allItems: function(){    
    // Fetch data
    var data = this.collection ? this.klass.all() : [this.item];
        
    // Apply filter
    data = jQuery.grep(data, this.filter);
        
    // Sort array
    if (this.sort)
      data = data.sort(this.sort);

    // Paginate
    if (this._paginate) 
      data = data.splice(this._paginate[0], this._paginate[1]);

    return data;
  },
  
  renderTemplate: function(data){
    data = jQuery.makeArray(data);
    var result = jQuery();
    
    jQuery.each( data, this.proxy(function( i, data ) {
      var element;
      
      if (this.template)
  		  element = jQuery.tmpl(this.template, data);
		  else
        element = jQuery();

      if (this.builder) this.builder.call(element, element, data);
      
      element.attr({"data-id": data.id, "data-klass": this.klass.className});
      element.data({id: data.id, klass: this.klass.className});
      element.addClass("connect-item");
  		
  		result = result.add(element);
  	}));
  	
  	return result;
  },
    
  findItem: function(item){
    return(this.element.findItem(item));
  },
  
  onPopulate: function(){
    this.render();
  },
  
  onCreate: function(item){ 
    if ( !this.filter(item) ) return;
    var elements = this.renderTemplate(item);
    if (this.options.prepend)
      this.element.prepend(elements);
    else
      this.element.append(elements);
    elements.trigger("render", item);
    this.element.trigger("render");
  },
  
  onUpdate: function(item){
    if ( !this.filter(item) ) return;
    if (item.id) {
      this.findItem(item).replaceWith(this.renderTemplate(item));
      this.findItem(item).trigger("render", item);
      this.element.trigger("render");
    } else {
      this.render();
    }
  },
  
  onDestroy: function(item){
    if ( !this.filter(item) ) return;
    if (item.id) {
      this.findItem(item).remove();
      this.element.trigger("render");
    } else {
      this.render();
    }
  }
});

(function($){

$.fn.item = function(){
  var element = this.hasClass("connect-item") ? 
                this : this.parents(".connect-item");
  
  var id = element.data("id"),
      klass = element.data("klass");
  
  if ( id == undefined || klass == undefined ) return;
  return(eval(klass).find(id));
};

$.fn.findItem = function(item){
  if ( !item ) return $();
  return(this.find("> [data-id='" + (item.id || item) + "']"));
};

$.fn.connect = function(klass, options){
  return(new SuperConnect($(this), klass, options));
};

$.fn.render = function(cb){
  return($(this).bind("render", cb));
};

$.fn.renderItem = function(cb){
  return($(this).delegate(".connect-item", "render", cb));
};

})(jQuery);