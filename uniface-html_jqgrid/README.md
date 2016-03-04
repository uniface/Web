# HTML_JQGrid #

The purpose of this repository is to provide samples on how the JQGrid library of Grids might be incorporated into a Uniface App. Targetted at web apps it is also possible to embed
these grids inside of a Uniface HTML container as an alternate to the standard Uniface grid. The examples contain samples of both implementations and although not exhaustive
does provide representative examples of what can be achieved.
This includes but not limited to the following features:

 * Sortable columns
 * Movable columns (Drag-n-Drop)
 * Editable rows (C.R.U.D)
 * Groupable by column
 * Pagination
 * Selection & search
 


## Dependencies ##

HTML_JQGrid has been written and tested with:

 * Uniface 9.7.01
 * SQLite
 

The HTML embedded grid makes use of the freee version of jqgrid  https://github.com/free-jqgrid/jqGrid
This is a forked MIT/GPL 'free' licensed version of the original grid by Tony Tomov. A newer version has since been commercialized and is available via guriddo.net.
The resources folder also contain copies of JQuery and JQuery-ui-themes

## Setup ##

This project can be downloaded and setup standalone.

### Setup HTML_JQGrid as a standalone project ###
These instructions allow you to create a new stand alone project on your local machine.

 * For these steps you'll need the Project Setup Tool. Follow the instructions here https://bitbucket.org/uniface/project-setup-tool to setup this tool before continuing
 * Clone the utunes repository onto your local machine. For these steps we'll assume it's been cloned into C:\Projects\HTML_JQGrid
 * Open a command prompt in the root of the project and type "projectsetup" to invoke the Project Setup Tool
 * Work through the setup process checking the details picked up by the setup tool make sense. Ignore referencies to userid and password they are not used.
 * When complete click of the UTunes link
 
## Contributing to the project ##

To set up the project for development follow the steps above to create uOutlook as a standalone project. Once complete the only other tool required is the Version Control project, allowing granular exports of source code suitable for use with BitBucket. To set this up follow these steps:

 * Visit https://bitbucket.org/uniface/version-control and follow the setup instructions to download the Version Control tool
 * Open the IDE and using the Utilities->Import menu import the file FILESYNC_Menu.xml. Assuming you extracted the Version Control tool to C:\\UnifacePackages, this would be found in C:\\UnifacePackages\\VersionControl\\imports
 * Compile the additional menu, which will in turn compile the menu we just imported
 * In the IDE go to Utilities->Preferences->General and tick the check box "Enable Additional Menu"
 * Now that the additional menu is enabled we can go to Utilities->Additional->Settings and using the browse button next to "Uniface Source Directory" select ./src. This points the tool at our source code.
 * Everything is now setup and we can go to Utilities->Additional->Project to verify that everything is setup correctly. Visiting this screen will sync your Uniface repository with the src folder. If it's working correctly then you should see the contents of this folder in the tree view.

## Contributors ##

* George Mockford