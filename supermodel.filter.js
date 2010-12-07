//= require <supermodel>

SuperModel.Filter = {
  filterAttributes: function(){
    var result = {};
    var attributes = this.filter_attributes;
    if ( !attributes ) attributes = this._class.attributes;
    
    for(var i in attributes) {
      var attr = attributes[i];
      result[attr] = this[attr];
    }
    return result;
  },
  
  filter: function(query){
    query = query.toLowerCase();    
    var attributes = this.filterAttributes();

    for (var key in attributes) {
      if ( !attributes[key] ) continue;
      var value = (attributes[key] + "").toLowerCase();
      if (value.indexOf(query) != -1) return true;
    };
    return false;
  }
};