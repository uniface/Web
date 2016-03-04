Overview
--------
This section details the general architecture and features of the framework

###Table of Contents

+ [Single Page Application](#Single_Page_Application)
+ [Bootstrap](#Bootstrap)
+ [Bootstrap Themed Dojo Widgets](#Bootstrap_Themed_Dojo_Widgets)
+ [External Layouts](#External_Layouts)
+ [Security](#Security)
+ [Access Control](#Access_Control)
+ [Performance](#Performance)
+ [DSP Lifecycle](#DSP_Lifecycle)
+ [Features](#Features)
   + [Modal Dialogs](#Modal_Dialogs)
   + [File Upload](#File_Upload)
   + [Tabs](#Tabs)
   + [RECAPTCHA](#RECAPTCHA)
   + [HTML5 History Support](#HTML5_History_Support)
   + [URL Rewriting](#URL_Rewriting)
+ [Other Libraries](#Other_Libraries)
+ [Todo](#Todo)
+ [Issues](#Issues)
+ [Product Enhancements](#Product_Enhancements)

###<a name="Single_Page_Application"></a>Single Page Application
APP\_MAIN is the main page. Other DSPs can assume that the instance <MAIN\_DSP> will always be available.


###<a name="Bootstrap"></a>Bootstrap
The bootstrap framework has been used to provide common web application functionality. Bootstrap provides a "mobile first" approach, meaning that anything built on top of the framework should work well on nearly any device (try resizing the window and see the menu options pop into a mobile friendly menu)


###<a name="Bootstrap_Themed_Dojo_Widgets"></a>Bootstrap Themed Dojo Widgets
All the fields are standard Uniface (Dojo 1.3). They have been styled with Bootstrap's look and feel.

+ https://github.com/thesociable/dbootstrap


###<a name="External_Layouts"></a>External Layouts
All HTML layouts have been moved into their own file in ./hts/. This allows the developer to use whatever HTML editor they wish.


###<a name="Security"></a>Security
Tomcat session
Use of a session ID is per browser session, so opening new tabs in the same browser will result in the same session being used. This may or may not be desirable.

Todo:

+ Automated user registration (validation email and automated password reset etc)
+ CAPATCHA for registering / resetting password
+ If I have someone's JSESSIONID I can delete their account by sending appropriate JSON and cookie to APP\_ACCOUNT.deletecallback. Maybe require a re-login to perform this action somehow? Maybe do something with a unique token that needs to be returned to the callback so that it can't be called arbitrarily?
+ Login with third party account? (Twitter, Facebook)


###<a name="Access_Control"></a>Access Control
Currently uses a DSP define to tell what level of user can access the page. This is currently limited to "logged in" or "public". A richer security model could be implemented, for example, an administrator user should be able to assess user management but a normal user shouldn't.


###<a name="Performance"></a>Performance
The framework tries to re-use DSPs that have already been sent to the browser rather than destroying them and resending. This reduces network traffic.


###<a name="DSP_Lifecycle"></a>DSP Lifecycle
Templated hooks allow server side and client side code to be defined per DSP while still allowing centralised code to handle common operations. When assigning a DSP to a DSP container, always used the lpGetDSP local procedure, this ensures the proper setup operations are triggered.

List of hooks:

+ create (server-side)   - runs on the server when the DSP is created for the first time
+ createJS (client-side) - provides a hook for running one time setup code in the browser
+ setup (server-side)    - runs everytime a DSP is assigned to a container.
+ setupJS (client-side)  - runs JavaScript everytime a DSP is assigned to a container.

The hooks implement a standard mechanism for extending behaviour using Uniface defines. The #include at the bottom of the operation trigger contains all the infrastructure code which will conditionally call hooks based define statements. For example, the standard setup operation contains some code like this:

    #ifdefined SETUP
    ;This DSP defines a post setup operation, so call it
    $instancehandle->setup()
    #endif

This means we can define an operation in our DSP which looks like this:

    #define SETUP
    ;--------------------------------------------------
    operation setup
    ;--------------------------------------------------

    end ;setup

As long as this comes before the inclusion of the main setup operation then the setup operation will be called during setup on this DSP.

Todo:

+ Architecture to handle multiple instances of a DSP being in the browser (i.e. when instance name != component name)
+ The hooks should probably be made into local procs because they shouldn't be called from outside the component


###<a name="Features"></a>Features
####<a name="Modal_Dialogs"></a>Modal Dialogs
APP\_MODAL provides modal messaging and askmess type functionality

Todo:

+ Create a modal test page to exercise all the options (wrapped up in a nice Uniface component)


####<a name="File_Upload"></a>File Upload
APP\_FILE\_UPLOAD provides a basic example of how to upload a file using DSPs. The solution is based on the dojo module dojo.io.iframe, which is available in the dojo build bundled with Uniface. dojo.io.iframe submits data to the server through a hidden iframe it creates on the fly. See http://docs.dojocampus.org/dojo/io/iframe for full details.

The example contains 2 components:

 + A DSP component (FILE\_UPLOAD\_DSP) that we are adding file upload functionality to.
 + A USP (FILE\_UPLOAD\_HANDLER) which receives the post message from dojo.io.iframe, does our application processing and returns the response in a format that dojo.io.iframe can understand.

Implementation Details:

+   Open FILE\_UPLOAD\_DSP in the IDF and go to the layout editor:
    + The first thing to notice here is the form tag. The action attribute is set to return to our USP. This could also be set directly in JavaScript.
    + The name of the input tag in this form must match what would be generated from the USP. Effectively the USP needs to be tricked into thinking the post back came from itself.
+   Now look at the detail trigger of the upload button. This JavaScript does the following:
    + When the button is clicked the dojo.io.iframe.send function is run.
    + This captures our form data (including the file for upload).
    + UPLOAD.DUMMY.DUMMY.1 is added to the form submission, this causes the detail trigger of UPLOAD.DUMMY to fire on the USP.
    + The callback functions load and error then handle the response coming back from the USP.
+   Now open FILE\_UPLOAD\_HANDLER. Go to the detail trigger of the UPLOAD.DUMMY. Here we can see some standard Uniface proc for processing file uploads. Anything that needs to be returned to the browser is placed in RESPONSE.DUMMY.
+   Open the layout editor. The layout has been stripped back to basics, dojo.io.iframe expects the response in the format.
&lt;html&gt;
  &lt;body&gt;
    &lt;textarea&gt;
      payload
    &lt;/textarea&gt;
  &lt;/body&gt;
&lt;/html&gt;
So the USP has been trimmed down to as near that as possible, with RESPONSE.DUMMY being our textarea.


####<a name="Tabs"></a>Tabs
There is a basic implementation of a Bootstrap tab in the framework.

Todo:

+ Make a more general DSP to encapsulate the Bootstrap tab and allow child DSPs to be added to form the tab windows


####<a name="Application Messages"></a>Application Messages
Application messages are presented through a Bootstrap alert at the top of the main page.

Todo:

+ It might be nice to encapsulate this in a seperate DSP. i.e. Create an alert test page to exercise all the options (wrapped up in a nice Uniface component)


####<a name="RECAPTCHA"></a>RECAPTCHA
To use RECAPTCHA on your DSP form follow these steps:

1. Add a div tag to your layout and give it an id attribute.
2. Add the inlcude proc APP:RECAPTCHA to the operations trigger of your DSP
3. To display the RECAPTCHA use the following code snippet (most likely in the execute trigger of your DSP)

    `$instancehandle->showRecaptcha("reCaptcha")`

4. When you submit your form, as well as sending back the data entered by the user, send back the values returned by Recaptcha.get\_challenge() and Recaptcha.get\_response().
5. Check the user's guess by calling APP_RECAPTCHASVC.verify passing in the challenge, the user's guess, their IP address. The operation will return a boolean result indicating success or failure along with an error code in the event of a failure.

An example setup can be see in the standalone DSP APP_RECAPTCHA.

####<a name="HTML5_History_Support"></a>HTML5 History Support
The framework uses the HTML5 history API to properly support the back and forward buttons. Navigating around the application and then using the back and forward buttons will navigate you through the pages you already visited, all without doing a full page refresh. Also note that as you navigate around the application the URL is updated to reflect where you currently are in the application. Even though the main DSP will always be APP_MAIN it's also possible to navigate directly to a page in the application by using its URL. If the user isn't logged in then they will be challenged with a login prompt and then sent directly to the requested page.

This functionality is handled by code in 3 places:

+ The postInitJS operation of APP_MENU defines a function showScreen which is called when a menu option is clicked. At the bottom of this function history.pushState is used to register the fact that the user has navigated within the application.
+ The setup operation of APP_MAIN does something similar but instead uses replaceState to register the fact that the user has entered the application, this gives us the information we need to navigate back to it later if the user presses their back button.
+ The final piece of the puzzle is back in APP_MENU at the bottom of the postInitJS operation. Here we register an event listener on the "popstate" event, this lets us define what should happen when the user hits their back or forward buttons. In our case we inspect the event object to get the page we should be going to and then call showScreen with that information which does the actual page switch for us.

Todo:

+ Add history support to sub-navigation elements like APP_TABS (so that changing a tab also updates the URL)

####<a name="URL_Rewriting"></a>URL Rewriting
Providing a unique URL for each page in order to enable HTML5 History support provides some great functionality. However, the URL looks rather ugly. URL Rewriting addresses this by allowing the user to navigate around the application with more friendly URLs. For example instead of navigating to the about screen with http://localhost:8080/WebFramework/wrd/APP_MAIN?page=about, users can enter http://localhost:8080/WebFramework/about. The URL rewriter simlpy translates the friendly URL into the actual URL before it gets to Uniface. This is a first step towards have a completely clean URL like http://example.com/about.

URL rewriting can be achieved in a number of ways. The framework is using UrlRewriteFilter (http://www.tuckey.org/urlrewrite/), a rewriter for Tomcat. Another popular option is mod_rewrite for Apache, and it should be possible to run the Framework with this as well.

It's possible to turn off the rewriting if you want to get a clearer view of what is going on 'under the hood'. Just follow these steps:

+ Open \asn\wasv.asn
+ Change the setting $js\_base\_url to ../dspjs
+ Change the logical BASE\_URL to ../
+ Change the logical URL\_REWRITING to 0
+ Open \web\WEB-INF\web.xml and comment out the filter and filter-mappings elements near the top
+ Rename \adm\uweb.ini to \adm\uweb.ini.rewrite
+ Rename \adm\uweb.ini.norewrite to \adm\uweb.ini
+ Restart the urouter and tomcat
+ You can now access the application in the "normal" way using http://localhost:8080/WebFramework/wrd/APP_MAIN

It's even possible to removed the "WebFramework" portion of the URL and change the port to the default of 80. This leaves you with a URL something like http://localhost/about. To remove the "WebFramework" from the URL:

+ Navigate to your Uniface install directory and go to \common\tomcat\conf\Catalina\localhost
+ Copy WebFramework.xml and rename it to ROOT.xml
+ Open ROOT.xml and add the attribute path="" to the context element
+ Copy WebFramework#common.xml and rename it to common.xml
+ Open common.xml and add the attribute path="" to the context element

Todo:

+ Rewrite rules to use mod_rewrite format so that we can easily setup the framework on Apache


###<a name="Other_Libraries"></a>Other Libraries
+ Spin.js - fgnass.github.io/spin.js/
+ Markdown-js - https://github.com/cadorn/markdown-js


###<a name="Todo"></a>Todo
+ Animate page changes?
+ Page / result caching?
+ HTML optimisation
+ JS and CSS minification
+ Default error pages present a security risk. Provide assignment switches for development to enable them, but otherwise have production suitable error pages
+ Options to enable HTTPS and automatically switching to HTTPS for login etc
+ Audit error handling and deal with it in a consistant way across the framework
+ Implement more charts:
   + Pie Chart
   + Option to make bar chart vertical
   + Line Chart
+ There's a lot of repeated JavaScript in every DSP's dspjs file. Find a better way to handle this.
+ Audit significant security events in the database
+ Add a controller service to hold commonly used things like remote IP address etc. Create a service factory so that this controller can be injected into all other services while maintaining some form of de-coupling
+ PDF printing
+ Drag and drop file upload
+ Base64 encoded file upload
+ Multiple file upload
+ Add menu option text into menu config files


###<a name="Issues"></a>Issues
+ A session cookie expiring while the user is in the application can lead to ugly Uniface authorisation errors rather than just taking them back to the login screen
+ Clicking a link while another DSP is loading causes the browser to try and actually navigate to the link URL (i.e. Uniface doesn't intercept the click). This causes a yellow screen because the "pretty" links don't actually refer to DSPs
+ It should be possible to disable the RECAPTCHA for when you don't have an internet connection


###<a name="Product_Enhancements"></a>Product Enhancements
+ The ability to set any attribute on a field, especially attributeOnly fields. This will be important when moving to HTML5 with user definable attributes like data-*.
+ Can't use onClick and such on occurrence tags
+ Need something like "atleastone" from x-occurrence in USPs on DSPs (ideally the ability to supress the entire entity if it has no content).
+ The internal layout editor should support HTML5. Current it forces you to use XHTML.
+ Get the element ID of a Uniface attributeOnly field
+ A instance.active JS call breaks, how do we handle this in our application gracefully? Need an error call back or some such?