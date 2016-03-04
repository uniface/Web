<a name="Quick_Start"></a>Quick Start
-------------------------------------
Follow these quick steps for using your own DSP in the framework. For this example we're going to look at the DSP EX_QUICK_START. This is a standalone DSP which loads this readme and renders it as HTML in the DSP. This should be fairly representative of a basic DSP, it does some server-side work and then executes some JavaScript to do things in the browser.

Open EX_QUICK_START in the IDE. Look at the execute trigger and see how it's loading a file from the server. It then uses webactivate to run some JavaScript which you can see in the operations trigger. The Get State and Set State triggers are just the Uniface defaults. In the layout editor you can see a JavaScript library being included with a script tag, this is the library that turns this Markdown file into HTML

Now we'll create a version of this DSP for use in the Framework. Duplicate EX_QUICK_START and call the new DSP APP_QUICK_START. There is some default code that should be in every DSP used inside the framework. We could create templates for this, but for adapting existing DSPs it's easier to just copy and paste some include statements.

Replace all the default code in the Set State trigger with:

    #include App:setState

Replace all the default code in the Get State trigger with:

    #include App:getState

Replace all the default code in the Define trigger with:

    #include App:dspDefines

Below any existing code in the Operations trigger add the include App:dspOperations. In this example the final operations trigger will now look like this:

    ;----------------------------------------------------------------
    ; Take the markdown document in README.DUMMY and render it
    ; as HTML
    ;----------------------------------------------------------------
    weboperation renderMarkdown
    ;----------------------------------------------------------------
    javascript

      var preview = document.getElementById("preview");
      var text    = this.getEntity("DUMMY.DUMMY").getOccurrence(0).getField("README").getValue();
      preview.innerHTML = marked(text);

    endjavascript

    end ;renderMarkdown

    #include App:dspOperations

Below any existing code in the Local Proc Modules trigger at the include App:dspLocalProcs. In this example the trigger will now look like this:

    #include App:dspLocalProcs

For security reasons we don't want users of our application to be able to access DSPs directly, we only want an end user to be able to access the main DSP called APP_MAIN. To this end we need to move the code from the execute trigger into a place that the framework can call it but a user's browser can't. Take the contents of the execute trigger and add them to an operation called postSetup, it should look like this:

    #define SETUP
    ;----------------------------------------------------------------
    ; Load .\README.md and put it in the field README.DUMMY
    ;----------------------------------------------------------------
    operation setup
    ;----------------------------------------------------------------
    public web
    
    params
        Struct pOptions : INOUT
    endparams

      lfileload ".\README.md", README.DUMMY

      webactivate $instancename.renderMarkdown()

      return 0

    end ;postSetup


    ;----------------------------------------------------------------
    ; Take the markdown document in README.DUMMY and render it
    ; as HTML
    ;----------------------------------------------------------------
    weboperation renderMarkdown
    ;----------------------------------------------------------------
    javascript

      var preview = document.getElementById("preview");
      var text    = this.getEntity("DUMMY.DUMMY").getOccurrence(0).getField("README").getValue();
      preview.innerHTML = marked(text);

    endjavascript

    end ;renderMarkdown

    #include App:dspOperations

Note the #define above the setup operation, this informs the templated framework code that the operation is present in this DSP and should be called. Also ensure that the execute trigger is completely blank, if a user now tries to access the DSP directly then they will get a security error.

The default mode for HTML layouts is to look for a file. This DSP has an internal layout so we need to tell the framework to use that instead. In the Defines trigger add a define #define LAYOUT_SOURCE = INTERNAL underneath the included defines:

    #include App:dspDefines

    #define LAYOUT_SOURCE = INTERNAL

All that is left to do is add this DSP to the menu so we can click on an option and load it up. Open menu.dashboard.json, we're going to modify OPTION_06 so that it loads our DSP instead of APP_FORUM. Adding additional options is fairly straight forward but outside the scope of this quick start. Alter menu.dashboard.json so that it looks like this:

    {
      "OPTION_01" : {
        "dsp": "APP_ABOUT",
        "alias": "about"
      },
      "OPTION_02" : {
        "dsp": "APP_FILE_UPLOAD",
        "alias": "upload"
      },
      "OPTION_03" : {
        "dsp": "APP_TABS",
        "alias": "tabs"
      },
      "OPTION_04" : {
        "dsp": "APP_ACCOUNT",
        "alias": "account"
      },
      "OPTION_05" : {
        "dsp": "APP_USERS",
        "alias": "users"
      },
      "OPTION_06" : {
        "dsp": "APP_QUICK_START",
        "alias": "quickstart"
      }
    }

Open app_menu_dashboard.html and edit the menu text to reflect your new DSP. Search for "OPTION_06" and change the link text from "Forum" to "Quick Start". Save these files and open the framework application in your browser. It should now be possible to click the navigation option "Quick Start" and to see the DSP opened.

There are other hooks available for doing processing at various points in the life cycle of a DSP (see the section [DSP Lifecycle](#DSP_Lifecycle) for more details). A very common use case is to run some JavaScript when intially setting up a DSP. There is a hook for this so let's apply that to our example DSP. Open the Operations trigger of APP_QUICK_START and remove the web activate that calls renderMarkdown. Now rename the renderMarkdown operation to postSetupJS, add a define statement above it #define POST_SETUP_JS. The final Operations trigger should look like this:

    #define SETUP
    ;----------------------------------------------------------------
    ; Load .\README.md and put it in the field README.DUMMY
    ;----------------------------------------------------------------
    operation setup
    ;----------------------------------------------------------------
    public web

    lfileload ".\README.md", README.DUMMY

    return 0

    end ;setup


    #define SETUP_JS
    ;----------------------------------------------------------------
    ; Take the markdown document in README.DUMMY and render it
    ; as HTML
    ;----------------------------------------------------------------
    weboperation setupJS
    ;----------------------------------------------------------------
    javascript

      var preview = document.getElementById("preview");
      var text    = this.getEntity("DUMMY.DUMMY").getOccurrence(0).getField("README").getValue();
      preview.innerHTML = marked(text);

    endjavascript

    end ;setupJS

    #include App:dspOperations

Using this hook has allowed us to remove a webactivate statement that called a bespoke operation on this DSP. By moving code that runs at standard times in a DSP's lifecycle into these standard hooks we make our code shorter and make it easier for a developer to understand what's going on across every DSP in the application, rather than having to follow a string of webactivate statements through all the server-side code.