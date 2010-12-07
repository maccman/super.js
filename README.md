The Super.js libraries are a collection of classes that were originally written for building [Ruby/JS desktop apps](http://bowlineapp.com). However, they've evolved beyond that and are at a stage when you can build a fully fledged  JavaScript application framework using them. The Super.js libraries are much closer to jQuery than say, Sproutcore or Cappuccino. The aim is a simple, modular set of libraries that you can use independently and don't completely abstract away the DOM. 

##Example Application

I've ported Jerome Gravel-Niquet's excellent Backbone.js [LocalTodo's](https://github.com/jeromegn/localtodos) application to Super.js. Checkout the [code on Github](https://github.com/maccman/super.todos), especially the [tasks state](https://github.com/maccman/super.todos/blob/master/app/states/tasks.js).

##SuperClass

SuperClass adds class abstraction and inheritance to JavaScript, something I think is sorely lacking natively. 
To create a new class, just initialize SuperClass:

    //= require <superclass>
    var User = new SuperClass;
    
You can pass an argument to SuperClass, which will be the class User inherits from.
Then, call __include__ to add instance methods.

    User.include({
      init: function(id){
        // called on instantiation
        this.id = id;
      },
      
      name: function(){
        return "bar";
      }
    });
    
    var u = new User(1);
    alert(u.name());

And call __extend__ to add class (static) methods.

    User.extend({
      records: [],
      
      first: function(){
        return this.records[0];
      }
    });
    
As in Ruby, callbacks are triggered when an object is included or extended.

    var module = {
      extended: function(base){
        console.log("Was extended by", base);
      }
    }

    User.extend(module);
    
SuperClass exposes an instances class, with the ___class__ attribute. Unfortunately, we need to use a underscore as class is a reserved keyword.

    var u = new User;
    u._class //=> User;
    
The only other thing SuperClass includes is the __proxy__ function, which saves context. This is useful whenever you're using something that changes the context, like event handers. jQuery, for example, changes the context in event handlers to point to the target element. The instance's context is wrapped by the proxy function, making sure that any functions called are in the right context.

    Item.include({
      init: function(element){
        this.element = jQuery(element);
        this.element.click(this.proxy(this.click));
      },
      
      click: function(){
        // element was clicked
      }
    });

##SuperApp

SuperApp is a state machine that you can bind and trigger events from. State machines are a great way of building UI's, and by making sure your application's  logic is neatly encapsulated in each state you'll reap the rewards in maintainability and future development. Often too little thought is given to the structure of JavaScript applications, and you can end up with quite a mess. SuperApp is a lightweight and flexible solution to that problem.

###States

So, to create a state we first need a global application object - we'll call it __App__.

    //= require <superapp>
    
    var App = new SuperClass;
    App.extend({
      state: new SuperApp,
    });

And then in a separate state file, we can create a state called __activity__. Notice we're wrapping it in a anonymous function to keep variables from polluting the global namespace.

    (function($){
      var state = App.state.add("activity");
    })(jQuery);

Now we need to add some events to our state machine.

    state.setup(function(){ /* ... */ });
    state.beforeEnter(function(){ /* ... */ });
    
The different events you can bind to are:

* load - triggers on page load
* setup - triggers when the state is first entered
* beforeEnter
* afterEnter
* beforeExit
* afterExit

And lastly, to change states we call the __change__ function, passing the name of the state we want to change to. Any additional arguments given will be sent to the __beforeEnter__ function. 

    App.state.change("activity")

###Views

Often it's useful to tie views into the application's state, i.e. changes in state will cause changes in the UI.  __superapp.view.js__ is here to help you do just that.

You can tie a state machine and view together by simply setting the view attribute on your state, with a __SuperApp.View__ instance. When instantiating SuperApp.View you'll need to pass in an element, which will be the one that wraps your view states. You'll have to do that after the page loads - otherwise the element won't exist.
    
    //= require <superapp.view>
    jQuery(function($){
      App.state.view = new SuperApp.View($("#views"));
    });
    
And then, we define our states in HTML.
    
    <div id="views">
      <div data-view="activity"></div>
      <div data-view="settings"></div>
    </div>
    
All SuperApp.View does is add and remove a CSS class called __current__ when swapping out the states. It doesn't show or hide them, so we'll have to do that in CSS - making sure the states that aren't current, are hidden.

    #views > *:not(.current) {
      display: none !important;
    }

Unfortunately, that's fairly advanced CSS not supported by legacy browsers. For better backwards compatibility, we could style it slightly differently. 

    #views div {
      display: none;
    }
    
    #views div.current {
      display: block;
    }
    
Now, we have to tell SuperApp that the specific states have a view element associated with them. We can do this by setting the __hasView__ attribute to true.

    var state = App.state.add("activity");
    state.hasView = true;
    
Now, whenever the state changes the relevant parts of the UI will be hidden and shown. Don't forget to set a default state when the page loads.

    jQuery(function(){
      App.state.change("dashboard");
    });
    
###View variables
    
One neat piece of functionality in SuperApp.View is automatically populating element variables. What I mean by that, is that if you have an element inside a state with a data-name attribute, a variable named after that attribute's value will be available on the state, pointing to that jQuery element instance.

So, if we have a div with a data-name inside our state, like so:

    <div id="views">
      <div data-view="activity">
        <div data-name="firstName">Donna Moss</div>
      </div>
    </div>
    
We can access the __firstName__ variable inside the state, which will point to a jQuery instance of the element.
    
    state.beforeEnter(function(){
      this.firstName.text(); //=> "Donna Moss"
    });
    
This is a really useful feature, and cuts down on a lot of jQuery selectors.

##SuperModel

SuperModel is a ORM for JavaScript, based on its [Ruby sister](http://github.com/maccman/supermodel). SuperModel lets you create models, specify attributes and add custom functions. Once you save a SuperModel instance, it's stored in memory - where you can access it via an ActiveRecord like interface. 

Let's create a class.

    //= require <supermodel>

    var Asset = SuperModel.setup("Asset");
    Asset.attributes = ["name", "size"];

    Asset.include({
      getExt: function(){
        return(this.name.substr(this.name.lastIndexOf(".")));
      }
    });
    
Now we can play around with Asset instances.

    var asset  = new Asset;
    asset.name = "Paul.png";
    asset.size = 50000;
    asset.save();
    
    Asset.find(asset.id); //=> <asset>
    Asset.first();        //=> <asset>
    Asset.all();          //=> [<asset>]
    Asset.count();        //=> 1
    
    Asset.exists(asset.id) //=> true
    Asset.findByAttribute("name", "Paul.png"); //=> <asset>

    asset.getExt();       //=> ".png"    
    asset.destroy();
    
###Callbacks

When an Model is changed, it's callback is triggered.
You can bind to callbacks like this:

    Asset.beforeSave(function(record){ /* ... */ });
    
Available callbacks are:

* beforeSave
* afterSave
* beforeCreate
* afterCreate
* beforeUpdate
* afterUpdate
* beforeDestroy
* afterDestroy

You can also achieve a basic form of validation by throwing an exception in a "before" callback.
    
###Timestamps

We can use a callback to set a timestamp on a model when it's saved.

    SuperModel.Timestamp = {
      extended: function(base){
        base.attributes.push("created_at");
        base.attributes.push("updated_at");
    
        base.on("beforeSave", function(item){
          var date = (new Date).toISOString();
          if ( !item.created_at ) item.created_at = date;
          if ( item.updated_at)   item.updated_at = date;
        });
      }
    };
    
    Asset.extend(SuperModel.Timestamp);

We're adding two new attributes, __created_at__ and __updated_at__. Then, before the record is saved, we're setting those two columns to the current time.

###Relations

SuperModel has basic relationship support between models, namely __hasMany__ and __belongsTo__.

    //= require <supermodel.relation>
    
    Asset.belongsTo("user");
    User.hasMany("assets");
    
    // Then we can do:
    User.first().getAssets();

    var asset = Asset.first();
    asset.getUser();
    asset.setUser(User.first());
    
###Marshal

We can use HTML5's __localStorage__ feature to automatically save any records we create between page reloads.

    //= require <supermodel.marshal>
    Asset.extend(SuperModel.Marshal);
    
When the page closes, all the Asset records will be serialized and stored in the browser's local storage. When the page loads, those records will be deserialized and created in-memory again.

##SuperConnect

So we've got states, views and models - now we just need to tie them all together. You can use SuperConnect to bind a model and view together, updating the view whenever the model changes.

For example, let's create a list of assets. First, the HTML markup - notice the dollar templating syntax:

    <div id="assets">
      <div class="item">${name}</div>
    </div>
    
And now, when the page loads, let's connect that __#assets__ div to the __Asset__ model.

    //= require <superconnect>   
    
    jQuery(function($){
      $("#assets").connect(Asset);
      
      for (var i=0; i < 10; i++)
        Asset.create({
          name: "Big Ben - " + i,
          size: 10000
        });
    });
    
You should see a list of Asset names in the page. If an Asset record is update or destroyed, the list will be changed to reflect that. Binding is a simple enough idea, but a great way of making sure the UI stays in sync with model changes.

###Singletons

The above example uses a collection of assets; but what if we want to bind a specific record, for example the current User, so you can display their name. You can do that easily enough by passing a __singleton__ option to connect. 

    var binder = $("#user").connect(User, {
      singleton: true
    });
    
    binder.setItem(current_user);
    binder.render();
    
Now, whenever that current_user record is changed, the UI will be updated.

###Filtering

Sometimes you don't every record in a model to be shown. For example, perhaps we only want published Post's to be shown. To achieve this, just set the binder's filter attribute to a function that returns a boolean. 

    var binder = $("#posts").connect(Post);
    binder.filter = function(post){ return post.published };
    binder.render();

###Builders

Templates often aren't enough, so SuperConnect lets you set a custom builder. This gets called every time an item is rendered and is passed the jQuery element and the record.

    var binder = $("#posts").connect(Post);
    binder.builder = function(element, data){ 
      element.find(".name").attr("title", data.name);
    };
    binder.render();

##Creating a contacts manager

So lets take what we've learnt and create a basic contacts manager. We're going to add <abbr title="Create, Read, Update, Destroy">CRUD</abbr> support - you can follow along with the source snippets below, and see a full example on in the assets folder.

###Requiring files

So let's require all the JavaScript libs we're going to need. Ideally you'd do this with something like [Sprockets](http://getsprockets.org). However, as this is just a short example, we'll do it manually.

    <script src="javascripts/jquery.js" type="text/javascript" charset="utf-8"></script>
    <script src="javascripts/jquery.utils.js" type="text/javascript" charset="utf-8"></script>
    <script src="javascripts/superclass.js" type="text/javascript" charset="utf-8"></script>
    <script src="javascripts/superevent.js" type="text/javascript" charset="utf-8"></script>
    <script src="javascripts/superapp.js" type="text/javascript" charset="utf-8"></script>
    <script src="javascripts/superapp.view.js" type="text/javascript" charset="utf-8"></script>
    <script src="javascripts/supermodel.js" type="text/javascript" charset="utf-8"></script>
    <script src="javascripts/supermodel.marshal.js" type="text/javascript" charset="utf-8"></script>
    <script src="javascripts/superconnect.js" type="text/javascript" charset="utf-8"></script>

###Setting up the application

So the first step is to setup a global object called __App__ that'll hold our application's state and variables. 

    var App = new SuperClass;
    App.extend({
      state: new SuperApp
    });

###Tying in the views

Let's create a __views__ div containing two states, __index__ and __edit__. These will serve as the two main application states, viewing a list of contacts, and editing one.

    <div id="views">
      <div data-view="index">
      </div>

      <div data-view="edit">
      </div>
    </div>

To tie the __views__ div up to our application's state machine, we need to do something like this.

    // Tie up App state to views on page load
    jQuery(function($){
      App.state.view = new SuperApp.View($("#views"));
    });
    
###Creating the models

Next step is to create our application's models. In this example, we've only got one, namely __Contact__. 

    var Contact = SuperModel.setup("Contact");
    Contact.attributes = ["name", "email"];
    
###Index state

Our first state, __index__, will list all the contacts; displaying their name and email. We need to create a div within the __index__ view state with a data-name of __contacts__. This will contain a list of child divs, the contacts. 

    <div data-view="index">
      <div data-name="contacts">
        <div>
          <span>${name} - ${email}</span>
        </div>
      </div>
    </div>

Now we need to create the JS state that's associated with our __index__ view.
Let's bind that list up to the Contact model, so when new contacts are created they'll be displayed in the list.

    (function(){
      var state = App.state.add("index")
      state.hasView = true;
  
      state.setup(function(){
        this.binder = this.contacts.connect(Contact);        
        this.binder.render();    
      });
    })();
    
###Displaying a list of contacts

Now we can test our rudimentary application out. Before that though, let's make sure there's a default state and some test data.

    jQuery(function(){
      // Load default state
      App.state.change("index");
  
      // Test data
      Contact.create({
        name: "Donna Moss",
        email: "donn@whitehouse.gov"
      });

      Contact.create({
        name: "Donna Moss2",
        email: "donn@whitehouse.gov"
      });
    });

Now if you open the page, if everything's working correctly you should see a list of contacts.
    
###Edit state

Seeing our contacts list is all very well, but what if we want to edit one?
Let's implement the __edit__ state view, containing a form which we'll use to update the contacts.

    <div data-view="edit">
      <div data-name="contact">
        <form data-name="form">
          <input type="text" name="name" value="${name}" placeholder="Name" autofocus>
          <input type="text" name="email" value="${email}" placeholder="Email">
          <button>Update</button>
        </form>
      </div>
    </div>
    
And here's the JavaScript state for that view. When we're changing to the __edit__ state, we'll specify a contact that is to be edited. Since this state only displays one record, it's a singleton. We therefore need to call __setItem__ every time the state is entered, changing the displayed contact.

    (function(){
  
      var state = App.state.add("edit")
      state.hasView = true;
  
      state.setup(function(){
        this.binder = this.contact.connect(Contact, {
          singleton: true
        });
      });
  
      state.beforeEnter(function(contact){
        this.current = contact;
        this.binder.setItem(this.current);
        this.binder.render();
      });
  
    })();
        
###Connecting the states

Now we want to be able to navigate between the states. Let's add an edit button in the __index__ state list of contacts.

    <a class="edit">Edit</a> 

And, when we setup the __index__ state, we need to listen to click events on that edit button. __jQuery.fn.item__ returns the record that's associated with that element - in this case the clicked contact.

    this.contacts.delegate("a.edit", "click", function(){
      App.state.change("edit", $(this).item());
    });
        
###Tying up the update button

Now we can click edit on a contact, and see a populated form. However the update button doesn't do anything at the moment. Let's rectify that by listening to __submit__ events on the form, updating the current contact with the form input values.

We're calling __jQuery.fn.reload__ since when the view is updated, the __this.form__ variable points to a non-existent element, and therefore is invalid.

    this.form.live("submit", this.proxy(function(){
      this.current.updateAttributes(
        this.form.reload().serializeForm()
      );
      App.state.change("index");	        
      return false;
    }));

###Creating a new contact

Right, now we've got the read and update parts of CRUD, but what about creating? Let's add a form to the bottom of the __index__  view state. 

    <form data-name="form">
      <h2>New contact</h2>
      <input type="text" name="name" placeholder="Name">
      <input type="text" name="email" placeholder="Email">
      <button>Create</button>
    </form>
    
And let's listen to the submit event on this form when setting up the __index__ state, creating a new Contact record when the __update__ button is pressed.

    this.form.submit(this.proxy(function(){
      Contact.create(this.form.serializeForm());
      this.form.find("input").val("");
  
      return false;
    }));
    
###Deleting contacts

Letting the user delete contacts is trivially easy. Let's add a delete link after the edit one (on the __index__ view).

    <a class="delete">Delete</a>
    
Now, when setting up the __index__ state, lets listen to click events on the delete link, destroying the appropriate contact.
    
    this.contacts.delegate("a.delete", "click", function(){
      $(this).item().destroy();
    });
    
###Saving the contacts

This is a one liner, we just need to extend the __Contact__ model with __SuperModel.Marshal__.

    Contact.extend(SuperModel.Marshal);

Take out the example data, as otherwise we'll get new contacts created every page reload.
    
That's all there is to creating a contacts manager. Hopefully you can now see how easy it is to make JavaScript applications with Super.js.