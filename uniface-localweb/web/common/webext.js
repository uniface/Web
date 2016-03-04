// CONT_ID %fv: webext.js-2:js:1 % %dc: Fri Apr 18 18:55:53 2014 %

/*
*****************************************************************************
* (c) 2014 Uniface B.V. All rights reserved.                                *
*                                                                           *
* You have a royalty-free right to use, modify, reproduce and distribute    *
* this sample code (and/or any modified version) in any way you find useful,*
* provided that you agree that Uniface B.V. has no warranty obligations or  *
* liability for any sample code which has been modified.                    *
*****************************************************************************
*/

/**
Web extensions used in the generated HTML from the UNIFACE server pages.

The functions used there are:
  function uLoad(inp) { }
  function Ualert(msg) { }
  function Ustatus(msg) { }
  function Uerror(msg) { }
  function UclrError() { }
  function uSubmit(inp) { }
  function UHelpUNIFACE(which) { }
  function UHelpNATIVE(topic,mode,logicalname) { }
*/

var uUseApplets = false;    // Use and load applets
var uBrowserID = "";        // Indicate which browser is used
var uLastClick = false;     // Prevent submit on enter in a single field form
// Browsers IDs
var uIE = "IE"; // Internet Explorer
var uNS = "NS"; // Netscape Communicator

// test if java is enabled and the applet is available and loaded
function uJavaEnabled(appletName)
{
  if (!uUseApplets)
    return false;

  if ((uTestBrowserIE() ||
       (uTestBrowserNS() && navigator.javaEnabled != null && navigator.javaEnabled())
      )
      && document.applets[appletName] != null
     )
  {
    return true;
  }
  return false;
}

// display browser information and init browser ID
function uInitBrowser()
{
  var browser = navigator.appName;
  if (browser.substring(0, 8) == "Netscape")
  {
    uBrowserID = uNS;
  }
  else if (browser.substring(0, 9) == "Microsoft")
  {
    uBrowserID = uIE;
  }
}

// test if browser ID indicates Internet Explorer
function uTestBrowserIE()
{
  return (uBrowserID == uIE);
}

// test if browser ID indicates Netscape Communicator
function uTestBrowserNS()
{
  return (uBrowserID == uNS);
}

// load document (onload event)
// this function is called when the applets are loaded
function uLoad(inp)
{
  // init browser information
  uInitBrowser();
  // indicate applet use
  uUseApplets = true;
  if (!uJavaEnabled("syntax"))
  {
    uUseApplets = false;
    uLastClick = true;
  }
}

// Used in HTML (onload event)
// Ualert : proc statement message/info/warning/error
function Ualert(msg)
{
  alert(msg);
}

// Used in HTML (onload event)
// Ustatus : proc statement message/hint
function Ustatus(msg)
{
  window.status = msg;
}

// Used in HTML
// Display validation error message
function Uerror(msg)
{
  window.status = msg;
  return true;
}

// Used in HTML
// Clear validation error message
function UclrError()
{
  window.status = window.defaultStatus;
  return true;
}

// Used in HTML (onsubmit event)
function uSubmit(inp)
{
  if (uUseApplets)
  {
    retVal = uLastClick;
    uLastClick = false;
    return(retVal);
  }
  else
  {
    return true;
  }
}

// UHelpUNIFACE : proc statement help
function UHelpUNIFACE(which)
{
  w = window.open(which, "UnifaceHelpWindow", "scrollbars=yes,resizable=yes,width=300,height=150");
  if (uTestBrowserNS()) {
    w.focus();
  }
}

// UHelpNATIVE : proc statement help /topic or /keyword
function UHelpNATIVE(topic,mode,logicalname)
{
  w = window.open("help?topic="+topic+"&mode="+mode+"&logicalname="+logicalname, "UnifaceHelpNative",
      "scrollbars=yes,resizable=yes,width=400,height=200");
  if (uTestBrowserNS()) {
    w.focus();
  }
}
