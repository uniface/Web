# Web Application Basics #

## Setup ##

Run setup tool as normal.

To get Polymer, install:

  * node.js (https://nodejs.org/en/)
  * Git (http://git-scm.com/download/win)
  * Bower (npm install -g bower)

Open a command prompt in .\\web\\ and type

```
bower install
```

## Background ##

Small, simple sounding requirements, but these are topics that expose some of the key complexity in web applications.

  * User Login
  * Navigation
  * Layouts


### User Login ###

The first page a user hits in your application will likely be the "login page". The requirements for this might, at first glance, seem simple. A user needs to enter their credentials, we then check these against a database and progress to the main application if they check out. However, due to the stateless nature of web applications this is the first place we need to start considering state management. We need to maintain some state on the user so that we know they logged in at some point in the past. Otherwise every time the user requests a page the application wont know who they are and will have to redirect them to the login page again.

Diagram (the problem)

One solution is to implement a session cookie which contains an identifier for that user's session. Using this the server can work out who it's talking to for each request.

Diagram (with a session cookie)


#### Implementation ####

Basic APP_MAIN execute trigger (the first code that will run when accessing the application):

```
public web

variables
 	String vSessionAttributes
 	String vUserName
 	String vServerVars
 	String vQueryString
 	String vAppConfigJson
 	String vResource
 	String vAction
 	String vParam
endvariables

;Check the session attributes for a user name. A user name logged against the
;session indicates that the user is logged in.
vSessionAttributes = $item("SESSIONATTRIBUTES", $webinfo("WEBSERVERCONTEXT"))
vUserName = $item("UserName", vSessionAttributes)

if(vUserName == "")
 	;If the user isn't logged in then show the login page
 	$instancehandle->showLogin()
else
 	;If the user is logged in then show the main application
 	$instancehandle->showApplication()
endif

return 0
```


### Navigation ###

One page isn't an application. You want to click a thing and have the screen change. Thinking about DSP lifecycle, challenges around managing instances, passing parameters to them etc.

  * Menu options configuration (Routing)
  * Lifecycle of a DSP
  * Hooks system for plugging child DSPs into the menu
  * HTML5 History Support
  * URL Rewriting

#### DSP Lifecycle ####

Compared to a USP, a DSP leads a much more interesting life.

USP:

 * Created on server and sent to the browser
 * “Destroyed” when making request back to the server
 * Recreated in whole, along with all data, and sent to the browser
 * Only 1 USP on the page at a time

DSP:

 * Created on server and sent to the browser
 * Persists in the browser when a request goes back to the server
 * Data coming back from the server merged with existing DSP instance in browser (following scoping rules)
 * Can be many DSPs in the browser at a time


### Layouts ###

A bit of a visual payoff, don't want to go into it too much since it'll be covered by other sessions. Flick a switch and swap the boring grey theme with a nicer one. Flick a switch and turn on the Android mobile layout. Perhaps show the uclaim applications as an example of what can be achieved.
