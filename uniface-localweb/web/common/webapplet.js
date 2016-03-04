// CONT_ID %fv: webapplet.js-3:js:1 % %dc: Fri Apr 18 18:55:47 2014 %

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

if (navigator.appName.substring(0, 9) == "Microsoft")
{
	if (oClientCaps.isComponentInstalled("{08B0E5C0-4FCB-11CF-AAA5-00401C608500}", "componentid"))
	{
		document.write('<applet name="syntax" archive="uwe.zip" codebase="../common" code="uniface.web.syntax.class" mayscript="mayscript" width="2" height="1">\
			<param name="cabbase" value="uwe.cab" />\
			</applet><br />');
	}
	else
	{
		document.write('<object name="syntax" classid="clsid:8AD9C840-044E-11D1-B3E9-00805F499D93" width="2" height="1" align="baseline" codebase="http://java.sun.com/products/plugin/autodl/jinstall-1_4_2-windows-i586.cab#Version=1,4,0,0">\
			<param name="name" value="syntax" />\
			<param name="codebase" value="../common" />\
			<param name="code" value="uniface.web.syntax.class" />\
			<param name="archive" value="uwe.zip" />\
			<param name="mayscript" value="mayscript" />\
			</object><br />');
	}
}
else
{
	document.write('<applet name="syntax" archive="uwe.zip" codebase="../common" code="uniface.web.syntax.class" mayscript="mayscript" width="2" height="1">\
		<param name="cabbase" value="uwe.cab" />\
		</applet><br />');
}
