# DSP Promises #

DSP Promises is a collection of samples that demonstrate the benefits of using JavaScript promises in DSP web applications. The samples are designed to be worked through sequentially as they show and discuss issues with different approaches and how they are resolved with the use of promises.

## Dependencies ##

DSP Promises has been written and tested with:

 * Uniface 9.7.01
 * SQLite

## Setup ##

Since this is a set of samples designed to run in isolation or as part of a presentation then setting up the project standalone makes most sense.

### Setup DSP Promises as a standalone project ###
These instructions allow you to create a new stand alone project on your local machine. In order to clone the repository (download it to your machine) you will need a git client of some sort installed, something like [SourceTree](https://www.sourcetreeapp.com/).

 * For these steps you'll need the Project Setup Tool. Follow the instructions here https://bitbucket.org/uniface/project-setup-tool to setup this tool before continuing
 * Clone the DSP Promises repository onto your local machine. For these steps we'll assume it's been cloned into C:\Projects\dsp-promises
 * Open a command prompt in the root of the project and type "projectsetup97" to invoke the Project Setup Tool. If your user doesn't have access rights to the directory that Uniface is installed in then you'll need to run the command prompt with administrator privileges.
 * Work through the setup process checking the details picked up by the setup tool make sense. Pay particular attention to user name and passwords
 * Once the tool has finished, restart your URouter
 * Open a browser and navigate to http://localhost:<port_number>/<folder_name>/. So assuming a default Uniface installation and that the project was cloned into a folder called dsp-promises the URL would be http://localhost:8080/dsp-promises/

## Contributing to the project ##

To set up the project for development follow the steps above to create DSP Promises as a standalone project. Once complete the only other tool required is the Version Control project, allowing granular exports of source code suitable for use with BitBucket. To set this up follow these steps:

 * Visit https://bitbucket.org/uniface/version-control and follow the setup instructions to download the Version Control tool
 * Open the IDE and using the Utilities->Import menu import the file FILESYNC_Menu.xml. Assuming you extracted the Version Control tool to C:\\UnifacePackages, this would be found in C:\\UnifacePackages\\VersionControl\\imports
 * Compile the additional menu, which will in turn compile the menu we just imported
 * In the IDE go to Utilities->Preferences->General and tick the check box "Enable Additional Menu"
 * Now that the additional menu is enabled we can go to Utilities->Additional->Settings and using the browse button next to "Uniface Source Directory" select ./src. This points the tool at our source code.
 * Everything is now setup and we can go to Utilities->Additional->Project to verify that everything is setup correctly. Visiting this screen will sync your Uniface repository with the src folder. If it's working correctly then you should see the contents of this folder in the tree view.

## Contributors ##

* James Rodger

## The Examples ##

### PROMISES_01 ###

All calls from a DSP back to the server are asynchronous. Developers might try something like this only to find it doesn't work as they expected. Reading the code we might expect the message "Before the activate" to be displayed followed by a message from the "doSomething" operation and finally the "After the activate" message.

As we can see what we actually get is the "Before" and "After" messages showing immediately followed by the message from the doSomething operation. So what can we do to ensure our code executes in the order we want?

### PROMISES_02 ###

One approach is to use Uniface's webactivate statement to control the execution order of our code. If we look at the code in the SUBMIT button's detail trigger we can see that the final "After" message has been removed. It's been placed in it's own weboperation called doSomethingAfter. If we take a look at the old doSomething operation we can see that we call this weboperation once our processing is complete. This technique ensures that all our code executes in the order that we intended.

For simple examples this technique is perfectly adequate. However, we have made the code less readable in the process. I now need to trace through 3 blocks of code to understand the overall flow of the code. We've also polluted the doSomething operation, having it call an operation it ideally shouldn't need to know about.

Let's take a look at a more complex example to better understand the problems this can cause.

### PROMISES_03 ###

Our doSomething operation now calls a number of services to do some work. These services do some processing and then report back how long it took. Since asynchronous calls from DSPs can't take OUT parameters we need to make a series of webactivate calls to setResultFromService in order to report back.

Running the example we can see that this works. However, imagine you're the JavaScript developer looking at the script running in the detail trigger of the SUBMIT button. All we've done is activate a Uniface operation doSomething and then from no where all this JavaScript starts running and doing things in the page. We'd then need to trace through 2 Uniface components to figure out where all these calls are being made. If not managed well, this approach can quickly become unmaintainable.

### PROMISES_04 ###

Managing asyncronous processing is a common problem in web applications but thankfully JavaScript is well equipped to handle it. Starting with Uniface 9.7 asyncronous calls in the Uniface JavaScript API will return a Promise. This is a JavaScript object designed to make programming against asyncronous interfaces easier. Let's return to our simpler example and see how they might help here.

In the SUBMIT button's detail trigger we can see that the JavaScript is now much more like our very first broken example. We can once again read through it and understand what the flow of execution is going to be, without having to go and look through a number of Uniface components.

The activate function returns us a promise which we've called p1. This promise will be resolved when Uniface finishes executing the doSomething operation. We can use the then function of the promise to line up script that should be executed when the promise resolves.

The behaviour is now the same as our second example but the code is now cleaner and easier to read. As we've just seen we can now read the JavaScript in one place and understand what is going to happen. If we look at the doSomething operation then we can also see that it's not polluted with code just to ensure things execute in the correct order.

### PROMISES_05 ###

Now let's tackle our more complicated example and see how promises can help here. As we've already discussed, this example requires the services to report back how long they took to complete their work. Now that we're using promises we can now pass parameters back to the browser without having to resort to webactivate statements littered around our components.

If we take a look at the doSomething operation then it's much clearer to see what it's doing. We've calling a number of services, collecting up our results and sending them back out again. Likewise with the service itself, there's now no call to a weboperation, we simply pass back the result as an OUT parameter. This keeps component interfaces much cleaner, and there's now nothing stopping us using the same service in a desktop application as well as our web application.

### PROMISES_06 ###

Promises also give us much more flexibility in how we handle things in the browser. If we're using webactivate statements then Uniface will simply sequentially execute them once the request returns. With promises we can influence this behaviour and handle things exactly as we need to.

In this example we're sending 10 requests back to the server as seperate calls. Instead of sending 1 request that runs 10 services, we're sending 10 requests that run 1 service each. This allows us to perform this processing in parallel.

As we can see, even though the service is doing 3 times more "work", the user gets control back in around the same amount of time. It also feels more responsive because we're providing feedback quicker.

We also have a requirement to show the "After the activate" message only once all the processing is complete. The Promise.all function makes this trival. We combine all the promises p0 to p9 into a single promise pA. pA will only resolve once all the other promises have resolved. We can then just use it as we've done before.