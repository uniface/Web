# This repository contains multiple projects, each outlined below #

## Setup ##

 * This project can be synchronized using the WAS plugin (https://github.com/uniface/WASListener), compiled and run.
 * Import the data found in the exports folder
 * If your webapp folder differs to web in your git repository root folder, please copy the contents of web to your webapp folder.

 ## Dependencies ##

These samples have been written and tested with:

 * Uniface 10.3.02
 * SQLite
 
# 1. Project  CSS Basics #

## Vanilla CSS ##

Work through these concepts on a basic Uniface DSP with a some labels, inputs and buttons

 + Stylesheets (External / Internal)
 + Syntax
 + Selectors (elements, classes and IDs)
 + Propertiesple 
 + Box model
 + Styling a basic form

## Bootstrap ##

Having recognised the limitations of writing vanilla CSS, take a look at a CSS framework and see what they offer us

 + Basic form styling of our example DSP
 + Responsive / cross browser
 + Common patterns (message, modal)

## CSS and Uniface ##

In a Uniface application we're going to want to do things like dynamically change the styling of our application

 + Change the class on a field
 + Changing the class of anything else (AtrributeOnly fields).

 ## Desktop Applications and the HTML Widget ##

  + Use the HTML widget to provide UI in a desktop application
  + Not "web" and UI only. So still stateful.
  + Pumping data in
  + Handling user interaction
  
# 2. DSP Charts #  

DSP Charts is a collection of samples demonstrating how to integrate Uniface DSPs with various JavaScript charting libraries. Libraries currently implemented are:

 * [JQPLot](http://www.jqplot.com/)
 * [morris.js](http://morrisjs.github.io/morris.js/)

# 3. HTML_JQGrid #

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
 

The HTML embedded grid makes use of the freee version of jqgrid  https://github.com/free-jqgrid/jqGrid
This is a forked MIT/GPL 'free' licensed version of the original grid by Tony Tomov. A newer version has since been commercialized and is available via guriddo.net.
The resources folder also contain copies of JQuery and JQuery-ui-themes

# 4. DSP File Upload #

DSP File Upload is a collection of samples demonstrating a variety of techniques for uploading files in DSP web applications.