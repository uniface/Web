# DSP Charts #

DSP Charts is a collection of samples demonstrating how to integrate Uniface DSPs with various JavaScript charting libraries. Libraries currently implemented are:

 * [JQPLot](http://www.jqplot.com/)
 * [morris.js](http://morrisjs.github.io/morris.js/)

## Dependencies ##

DSP Charts has been written and tested with:

 * Uniface 9.6.07
 * SQLite

## Setup ##

This project can be downloaded and setup in 2 ways. Either added to an existing Uniface project or setup standalone.

### Add DSP Charts to an existing project ###
These instructions assume you're adding DSP Charts to your default Uniface environment. Simply replace the paths with your own to add it to another project.

 * Download the latest zip from the downloads page
 * Copy DspCharts.uar to your project area (C:\\Users\\admin\\Documents\\Uniface 96 Development\\project)
 * Add a reference to DspCharts.uar in your wasv.asn (C:\\Program Files (x86)\\Compuware\\Uniface 9.6\\uniface\\adm\\wasv.asn). If you don't have a [resource] section, add one. In the resource section add the line C:\\Users\\admin\\Documents\\Uniface 96 Development\\project\\DspCharts.uar
 * Copy the contents of the web folder from the zip into C:\Program Files (x86)\Compuware\Uniface 9.6\uniface\webapps\uniface
 * Restart your urouter
 * Open a browser and access thee jqplot_example DSP, by default this would be on the URL http://localhost:8080/uniface/wrd/JQPLOT_EXAMPLE

### Setup DSP Charts as a standalone project ###
These instructions allow you to create a new stand alone project on your local machine. In order to clone the repository (download it to your machine) you will need a git client of some sort installed, something like [SourceTree](https://www.sourcetreeapp.com/).

 * For these steps you'll need the Project Setup Tool. Follow the instructions here https://bitbucket.org/uniface/project-setup-tool to setup this tool before continuing
 * Clone the DSP Charts repository onto your local machine. For these steps we'll assume it's been cloned into C:\Projects\dsp-charts
 * Open a command prompt in the root of the project and type "projectsetup" to invoke the Project Setup Tool. If your user doesn't have access rights to the directory that Uniface is installed in then you'll need to run the command prompt with administrator privileges.
 * Work through the setup process checking the details picked up by the setup tool make sense. Pay particular attention to user name and passwords
 * Once the tool has finished, restart your URouter
 * Open a browser and navigate to http://localhost:<port_number>/<folder_name>/. So assuming a default Uniface installation and that the project was cloned into a folder called dsp-charts the URL would be http://localhost:8080/dsp-charts/

## Contributing to the project ##

To set up the project for development follow the steps above to create DSP Charts as a standalone project. Once complete the only other tool required is the Version Control project, allowing granular exports of source code suitable for use with BitBucket. To set this up follow these steps:

 * Visit https://bitbucket.org/uniface/version-control and follow the setup instructions to download the Version Control tool
 * Open the IDE and using the Utilities->Import menu import the file FILESYNC_Menu.xml. Assuming you extracted the Version Control tool to C:\\UnifacePackages, this would be found in C:\\UnifacePackages\\VersionControl\\imports
 * Compile the additional menu, which will in turn compile the menu we just imported
 * In the IDE go to Utilities->Preferences->General and tick the check box "Enable Additional Menu"
 * Now that the additional menu is enabled we can go to Utilities->Additional->Settings and using the browse button next to "Uniface Source Directory" select ./src. This points the tool at our source code.
 * Everything is now setup and we can go to Utilities->Additional->Project to verify that everything is setup correctly. Visiting this screen will sync your Uniface repository with the src folder. If it's working correctly then you should see the contents of this folder in the tree view.

## Contributors ##

* James Rodger