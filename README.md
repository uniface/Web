#This repository contains multiple projects, each detailed below#

## Setup ##

 * This project can be synced using the WAS plugin (https://github.com/uniface/WASListener), compiled and run.
 * If your webapp folder differs is web in your git repository root folder, please copy the contents of web to your webapp folder.
 
#1. Project  CSS Basics #

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

## Dependencies ##

DSP Charts has been written and tested with:

 * Uniface 10.3
 * SQLite
