// CONT_ID %fv: websyntax.js-2:js:1 % %dc: Fri Apr 18 18:55:58 2014 %

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
Web field syntax checking used in the generated HTML from the UNIFACE server pages.

The functions used there are:
  function uLeaveFld(inp, syntax) { }
  function uChangeFld(inp, syntax) { }
  function uClickFld(inp, syntax) { }
  function uBlurClear(inp) { }
  function uFocusFld(inp, syntax) { }
  function UButtonPressed(name) { }
*/

var uErrorStatus = false;   // suppress leave trigger fire for other fields
var uErrorField  = "";      // store error fieldname
var uLastMessage = "";      // store last message from messageline
var uMessageStatus = false; // last message line stored


// log to JavaConsole
function uLog(str)
{
  if (uJavaEnabled("syntax"))
  { // the syntax applet performs the logging
    document.syntax.writeLog("JavaScript: " + str);
  }
}

function uTestMessageLine()
{
  if (document.forms["msgline"] != null
      && document.forms["msgline"].elements["MSGLINE.IGNORE.UNIDUM"] != null)
  {
    return true;
  }
  return false;
}

function uWriteMessageLine(msg)
{
  if (msg == "" && uTestBrowserIE()) // prevent GPF in IE
  {
    document.forms["msgline"].elements["MSGLINE.IGNORE.UNIDUM"].options[0].text = " ";
  }
  else
  {
    document.forms["msgline"].elements["MSGLINE.IGNORE.UNIDUM"].options[0].text = msg;
  }
}

function uGetMessageLine(i)
{
  return document.forms["msgline"].elements["MSGLINE.IGNORE.UNIDUM"].options[i].text;
}

// return the current value from the widget and store it in the applet
function uStoreValue(inp)
{
  var value = "";
  if (inp.type == "password"
      || inp.type == "text"
      || inp.type == "textarea")
  {
    value = inp.value;
  }
  else if (inp.type == "radio")
  {
    value = ""; // nothing selected
    for (var i = 0; i < document.forms[0].elements[inp.name].length; i++)
    {
      if (document.forms[0].elements[inp.name][i].checked)
      {
        value = document.forms[0].elements[inp.name][i].value;
        break;
      }
    }
  }
  else if (inp.type == "select-multiple" || inp.type == "select-one")
  {
    var cnt = 0;
    for (var i = 0; i < document.forms[0].elements[inp.name].length; i++)
    {
      if (inp.options[i].selected == true)
      {
        cnt = cnt + 1;
      }
    }
    document.syntax.initSubField(cnt.toString());
    for (var i = 0; i < document.forms[0].elements[inp.name].length; i++)
    {
      if (inp.options[i].selected == true)
      {
        document.syntax.setFieldValue(inp.options[i].value); // different subfields
      }
    }
    return;
  }
  else if (inp.type == "checkbox")
  {
    if (inp.checked)
    {
      value = inp.value;
    }
    else
    {
      value = ""; // return not selected
    }
  }
  document.syntax.initSubField("1");
  if (value != "")
  {
    document.syntax.setFieldValue(value);
  }
  else
  {
    document.syntax.setFieldValue("");
  }
}

// get changed value from the applet and set it back into the widget
function uSetValue(inp)
{
  var index = document.syntax.initGetSubField();;
  var value;
  if (inp.type == "checkbox"
      || inp.type == "password"
      || inp.type == "text"
      || inp.type == "textarea"
     )
  {
    inp.value = document.syntax.getFieldValue();
    return;
  }
  else if (inp.type == "radio") // check the radiogroup element where radio.value == 'value'
  {
    value = document.syntax.getFieldValue();
    for (var i = 0; i < document.forms[0].elements[inp.name].length; i++)
    {
      if (document.forms[0].elements[inp.name][i].value == value)
      {
        document.forms[0].elements[inp.name][i].checked = true;
        return;
      }
    }
  }
  else if (inp.type == "select-multiple" || inp.type == "select-one")
  {
    // select the selection element where element.value == 'value'
    for (var j = 0; j < index; j++)
    {
      value = document.syntax.getFieldValue();
      for (var i = 0; i < document.forms[0].elements[inp.name].length; i++)
      {
        if (inp.options[i].value == value)
        {
          inp.options[i].selected = true;
          return;
        }
      }
    }
  }
}

// set widget back to default value (the old value before value change)
function uSetOldValue(inp)
{
  if (inp.type == "radio") // check the radiogroup element where radio.value == 'value'
  {
    for (var i = 0; i < document.forms[0].elements[inp.name].length; i++)
    {
      if (document.forms[0].elements[inp.name][i].defaultChecked == true)
      {
        document.forms[0].elements[inp.name][i].checked = true;
        break;
      }
    }
  }
  else if (inp.type == "select-multiple" || inp.type == "select-one")
  {
    for (var i = 0; i < document.forms[0].elements[inp.name].length; i++)
    {
      if (inp.options[i].defaultSelected == true)
      {
        inp.options[i].selected = true;
      }
      else
      {
        inp.options[i].selected = false;
      }
    }
  }
  else if (inp.type == "checkbox")
  {
    inp.checked = inp.defaultChecked;
  }
}

// make the current value the default value
// so if we want to put the current values back we can use the default values
function uConfirmValue(inp)
{
  if (inp.type == "radio") // check the radiogroup element where radio.value == 'value'
  {
    for (var i = 0; i < document.forms[0].elements[inp.name].length; i++)
    {
      if (document.forms[0].elements[inp.name][i].checked == true)
      {
        document.forms[0].elements[inp.name][i].defaultChecked = true;
        break;
      }
    }
  }
  else if (inp.type == "select-multiple" || inp.type == "select-one")
  {
    for (var i = 0; i < document.forms[0].elements[inp.name].length; i++)
    {
      if (inp.options[i].selected == true)
      {
        inp.options[i].defaultSelected = true;
      }
      else
      {
        inp.options[i].defaultSelected = false;
      }
    }
  }
  else if (inp.type == "checkbox")
  {
    inp.defaultChecked = inp.checked;
  }
}

// put the valrep into the applet so the applet can check values against the valrep
// actually only put the 'val' from the 'valrep' the 'rep' is not necessary
// if there is no valrep just init the valrep value in the applet
function uPutValRep(inp)
{
  if (inp.type == "radio" || inp.type == "select-multiple" || inp.type == "select-one")
  {
    var len = document.forms[0].elements[inp.name].length;
    document.syntax.initValRep(len.toString());
    for (var i = 0; i < len; i++)
    {
      document.syntax.addValRep(document.forms[0].elements[inp.name][i].value);
    }
    return;
  }
  document.syntax.initValRep("0");
}

// store valrep, fieldname, syntax string and field value into the applet
function uStoreField(inp, syntax)
{
  uStartPanel("panel1");
  uStartPanel("panel2");
  uPutValRep(inp);
  document.syntax.setFieldName(inp.name);
  if (syntax != "" && document.syntax.initSyntax(syntax) == false)
  {
    uDisplayError(inp);
    return false;
  }
  uStoreValue(inp);
  return true;
}

// if the value is changed by the applet set the changed value back and confirm any value
function uSetNewValue(inp)
{
  if (document.syntax.valueChanged())
  {
    uSetValue(inp);
  }
  uConfirmValue(inp);
  uOKPanel("panel1");
  uOKPanel("panel2");
  uReadyPanel("panel1");
  uReadyPanel("panel2");
}

// get error message from the javaScript error message array
function uGetError(errorNumber)
{
  var errMessage;
  errMessage = uMessages[errorNumber + ""];
  if (errMessage == null || errMessage == "")
  {
    errMessage = uMessages[0];
  }
  return(errMessage);
}

// display errors from syntax checking
function uDisplayError(inp)
{
  var errNo = document.syntax.getErrno();
  var errStr = uGetError(errNo);
  errStr = document.syntax.replaceParam(errStr);
  uErrorStatus = true;
  uErrorField = inp.name;
  window.status = errStr;
  if (uTestMessageLine())
  {
    if (!uMessageStatus)
    {
      uLastMessage = uGetMessageLine(0);
      uMessageStatus = true;
    }
    uWriteMessageLine(errStr);
  }
  uReadyPanel("panel1");
  uReadyPanel("panel2");
}

// clear the error status
function uClearError(inp)
{
  if (inp.name == uErrorField)
  {
    uErrorField = "";
    uErrorStatus = false;
    window.status = "";
    if (uTestMessageLine() && uMessageStatus)
    {
      uWriteMessageLine(uLastMessage);
      uMessageStatus = false;
      uLastMessage = "";
    }
  }
}

// get the current error status for current field
function uGetErrorStatus(inp)
{
  if (uErrorStatus && inp.name != uErrorField)
  {
    return true;
  }
  return false;
}

// set the focus to a widget
function uSetFocus(inp)
{
  if (inp.type != "radio")
  {
    document.forms[0].elements[inp.name].focus();
  }
  else
  {
    for (var i = 0; i < document.forms[0].elements[inp.name].length; i++)
    {
      if (document.forms[0].elements[inp.name][i].checked == true)
      {
        document.forms[0].elements[inp.name][i].focus();
        break;
      }
    }
  }
}

// select the input in a widget
function uSelectInput(inp)
{
  if (inp.type == "password"
      || inp.type == "text"
      || inp.type == "textarea")
  {
    document.forms[0].elements[inp.name].select();
  }
}

// signal start to a specific panel
function uStartPanel(panel)
{
  if (uJavaEnabled(panel))
  {
    document.applets[panel].syntaxStart();
  }
}

// signal ready to a specific panel
function uReadyPanel(panel)
{
  if (uJavaEnabled(panel))
  {
    document.applets[panel].setReady();
  }
}

// signal OK to a specific panel
function uOKPanel(panel)
{
  if (uJavaEnabled(panel))
  {
    document.applets[panel].resetError();
  }
}

// Used in HTML (onBlur event)
// leave field trigger
// leave field checking is only done for those widgets without change or click triggers
// so for example for text fields
function uLeaveFld(inp, syntax)
{
  uLog("uLeaveFld["+ inp.name +"]");

  if (uJavaEnabled("syntax") && !uGetErrorStatus(inp))
  {
    window.status = window.defaultStatus;
    uClearError(inp);
    if (uStoreField(inp, syntax) == false)
    {
      return; // error
    }
    if (document.syntax.checkSyntax() == false)
    {
      uDisplayError(inp);
      uSetFocus(inp);
      uSelectInput(inp);
      return;
    }
    uSetNewValue(inp);
  }
}

// Used in HTML (onchange event)
// change field trigger
function uChangeFld(inp, syntax)
{
  // uLog("uChangeFld["+ inp.name +"]");

  if (uGetErrorStatus(inp))
  {
    uSetOldValue(inp);
  }
  if (uJavaEnabled("syntax") && !uGetErrorStatus(inp))
  {
    if (uStoreField(inp, syntax) == false)
    {
      return; // error
    }
    if (document.syntax.checkSyntax() == false)
    {
      uSetOldValue(inp);
      uOKPanel("panel1");
      uOKPanel("panel2");
      uDisplayError(inp);
      return;
    }
    uSetNewValue(inp);
  }
  uClearError(inp);
}

// Used in HTML (onclick event)
// on click trigger
function uClickFld(inp, syntax)
{
  // uLog("uClickFld["+ inp.name +"]");

  if (uJavaEnabled("syntax") && !uGetErrorStatus(inp))
  {
    if (uStoreField(inp, syntax) == false)
    {
      return false; // error
    }
    if (document.syntax.checkSyntax() == false)
    {
      uOKPanel("panel1");
      uOKPanel("panel2");
      uDisplayError(inp);
      return false;
    }
    uSetNewValue(inp);
  }
  // try to clear the error
  uClearError(inp);
  if (!uGetErrorStatus(inp))
  {
    if (inp.type == "submit")
    {
      uLastClick = true;
    }
    return (true);
  }
  return (false);
}

// Used in HTML (onblur event)
// onBlur for some fields
function uBlurClear(inp)
{
  // uLog("uBlurClear["+ inp.name +"]");

  uClearError(inp);
}

// Used in HTML (onFocus event)
// onFocus, not used
function uFocusFld(inp, syntax)
{
  // uLog("uFocusFld["+ inp.name +"]");
}

// UButtonPressed : called by panel applet when a button is pressed
// HTML must have <INPUT type="hidden" name="BUTNAME.IGNORE.UNIDUM">
function UButtonPressed(name)
{
  document.forms[0].elements["BUTNAME.IGNORE.UNIDUM"].value = name;
  document.forms[0].submit();
}
