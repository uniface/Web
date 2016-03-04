/*global console*/
/*global uniface*/

var app = {

  menuInstance:   null, //The Menu DSP Instance
  urlRewriting:   null, //Is URL Rewriting switched on?
  navigationType: null, //What UI are we using?
  config:         null, //The contents of the application configuration file
  baseUrl:        null, //Base URL for the application (e.g. /WebFramework/)

  /*
  *  showScreen
  *
  *  Handles loading and displaying a page
  *
  */
  showScreen: function (resourceName, //The resource to navigate to
    action,       //The action we're opening on the resource
    param,        //Param needed to identify a record (e.g. on a "detail" action)
    options       //Object containing options that will be passed to the DSP
  ) {
    "use strict";

    var updateState,
    refreshPage,
    resource,
    dspToShow,
    instanceToShow,
    optionString,
    instance,
    stashedOptions,
    attrName,
    state;

    options     = (typeof options             === "undefined") ? {}    : options;
    updateState = (typeof options.updateState === "undefined") ? true  : options.updateState;
    refreshPage = (typeof options.refreshPage === "undefined") ? false : options.refreshPage;

    resource = app.config.getResourceByNameAndAction(resourceName, action);
    dspToShow = resource.dsp;

    //Does this resource define a DSP instance name? If not, default it to the name of the DSP;
    instanceToShow = (typeof resource.instanceName === "undefined") ? dspToShow : resource.instanceName;

    if (instanceToShow === undefined) {
      //TODO: Proper way to report errors arising from JavaScript code like this
      console.error("Menu config incorrect");
    }

    //Push the param passed in on the URL to the options object, this then gets
    //passed to the DSP we're starting
    options.param = param;

    //Convert options object in to a string so it can be passed to Uniface
    optionString = JSON.stringify(options);
    //TODO: if this errors then something dodgy was passed in, raise an appropriate exception

    //Call the menu so it can do any presentation work (like highlighting the option we just clicked)
    app.menuInstance.activate("navigationShowScreen", resourceName).then(function(){

      instance = uniface.getInstance(instanceToShow);
      if (instance === null) {
        //We don't have this DSP in the browser yet, go and create it
        p = app._showNewScreen(dspToShow, instanceToShow, resourceName, options)
      } else {
        //We already have this instance loaded, call appropriate DSP lifecycle operations and redisplay it.
        p = app._showExistingScreen(instance, instanceToShow, resourceName, options, refreshPage)
      }

      //Only one of the operations above will have been called and p is the promise it returned
      p.then(function(){
        //Assign to the DSP container
        //Call the menu so it can do any presentation work required (like sliding the newly loaded DSP into view)
        app.menuInstance.activate("postDspSetup", resourceName, instanceToShow);
        app.currentDsp = instanceToShow;

        if(updateState) {
          app._updateState(true, resourceName, action, param);
        }
      });

    });
  },

  //Show a screen that hasn't be loaded into the browser yet
  _showNewScreen: function (dspToShow,
    instanceToShow,
    resourceName,
    options
  ) {

    var dummyEnt,
    newOcc,
    optionString;

    optionString = JSON.stringify(options);

    //First, create a new container to hold the DSP we're going to load
    dummyEnt = app.menuInstance.getEntity("DUMMY.DUMMY");

    newOcc = dummyEnt.getOccurrence(0);
    if (newOcc.getStatus() !== uniface.Occurrence.STATUS_EMPTY) {
      newOcc = dummyEnt.createOccurrence(-1);
    }

    newOcc.setProperty("html:data-route", resourceName);

    //Make the call to create the new DSP instance
    p = uniface.createInstance(
      dspToShow, //Component Name
      instanceToShow, //Instance Name
      "appCreate", //Operation Name
      optionString //Parameters
    ).then(function () {

      //Assign to the DSP container
      newOcc.getField("PAGE").setValue(instanceToShow);

    });

    return p;
  },

  //We already have this instance loaded, call appropriate DSP lifecycle operations and redisplay it.
  _showExistingScreen: function (instance,
    instanceToShow,
    resourceName,
    options,
    refreshPage
  ) {

    var stashedOptions,
    attrName,
    optionString,
    p;

    //If we've been asked to, call the refresh operations, otherwise run the setup operations
    if (refreshPage) {

      //Unpack the options we stashed against this DSP instance, merge them with anything passed in
      //to this showScreen call.
      stashedOptions = instance.app.params;

      for (attrName in stashedOptions) {
        if (stashedOptions.hasOwnProperty(attrName)) {
          options[attrName] = stashedOptions[attrName];
        }
      }

      optionString = JSON.stringify(options);

      if (instance.app.hasRefresh) {
        //We have a refresh operation defined so call it, appRefresh will in turn call refreshJs if it's defined
        p = instance.activate("appRefresh", optionString);
      } else if (instance.app.hasRefreshJs) {
        //We only have a refreshJs operation defined, so call this directly
        p = instance.activate("refreshJs", optionString);
      }

    } else {

      optionString = JSON.stringify(options);

      //Call setup operations
      if (instance.app.hasSetup) {
        //We have a setup operation defined so call it, appSetup will in turn call setupJs if it's defined
        p = instance.activate("appSetup", optionString);

      } else if (instance.app.hasSetupJs) {
        //We only have a setupJs operation defined, so call this directly
        p = instance.activate("appSetupJs", optionString);
      }
    }

    if(typeof p === "undefined") {
      //If we didn't call any of the operations above then simply pass back a resolved promise.
      p = Promise.resolve();
    }

    return p;
  },

  _updateState: function (pushState, //push onto state stack or replace the top entry
    resource,
    action,
    param
  ) {
    "use strict";

    var state,
    urlArguments;

    resource = (typeof resource === "undefined" | resource === null) ? "" : resource;
    action   = (typeof action   === "undefined" | action === null)   ? "" : action;
    param    = (typeof param    === "undefined" | param === null)    ? "" : param;

    state = {};
    if(app.urlRewriting) {
      urlArguments = this.baseUrl;
    } else {
      urlArguments = "APP_MAIN";
    }

    if(resource != "") {
      state.resource = resource;
      if(app.urlRewriting) {
        urlArguments = urlArguments + resource;
      } else {
        urlArguments = urlArguments + "?resource=" + resource;
      }
    }

    if(action != "") {
      state.action = action;
      if(app.urlRewriting) {
        urlArguments = urlArguments + "/" + action;
      } else {
        urlArguments = urlArguments + "&action=" + action;
      }
    }

    if(param != "") {
      state.param = param;
      if(app.urlRewriting) {
        urlArguments = urlArguments + "/" + param;
      } else {
        urlArguments = urlArguments + "&param=" + param;
      }
    }

    if (pushState) {
      //Update the browser navigation bar
      history.pushState(state, null, urlArguments);
    } else {
      history.replaceState(state, null, urlArguments);
    }
  }
};
