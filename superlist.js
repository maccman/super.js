//= require <superconnect>

var SuperList = new SuperClass;
SuperList.include(SuperEvent);

(function($){

SuperList.include({
  init: function(element, klass, options) {
    this.element = $(element);
    this.klass   = klass;
    this.options = options;
    this.keys    = false;
    this.filterQuery = "";
    this.item    = null;
    
    this.binder = this.element.connect(klass, this.options);
    this.binder.filter = this.proxy(this.filterFunc);
    this.bindKeys();
    
    this.element.delegate("*", "click", this.proxy(function(e){
      this.change($(e.target).item());
    }));
    
    this.element.render(this.proxy(function(){
      this.setItem();
    }));
    
    this.change(this.proxy(function(item){
      this.setItem(item);
    }))
  },
  
  focus: function(){
    this.keys = true;
  },
  
  unfocus: function(){
    this.keys = false;
  },
  
  render: function(){
    this.binder.render();
  },
  
  filter: function(query){
    if (this.filterQuery == query) return;
    this.filterQuery = query;
    this.render();
  },
  
  setItem: function(item){
    if (item) this.item = item;
    this.element.children().removeClass("current");
    this.element.findItem(this.item).addClass("current");
    
    // Select first item if nothing else is selected
    if (this.current().length == 0) {
      var item = this.element.find(">*:first").item();
      if (item) this.change(item);
    }
  },
  
  current: function(item){
    return(this.element.find(".current"));
  },
  
  prev: function(){
    var item = this.current().prev().item();
    if ( !item ) return;
    this.change(item);
  },
  
  next: function(){
    var item = this.current().next().item();
    if ( !item ) return;
    this.change(item);
  },
  
  // Private
  
  filterFunc: function(item){
    if ( !this.filterQuery || this.filterQuery == "")
      return true;
    return item.filter(this.filterQuery);
  },
  
  bindKeys: function(){
    $("body").keydown(this.proxy(function(e){
      if ( !this.keys ) return;
      this.element.focus();
      switch (e.which) {
        case 38: // Up
        this.prev();
        break;
        case 40: // Down
        this.next();
        break;
      }
    }));
  }
});

SuperList.fn.setupEvents("change");

$.fn.superlist = function(klass, options){
  return(new SuperList(this, klass, options));
};

})(jQuery);