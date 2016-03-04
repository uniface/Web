// %fv: udojo.js-156:ascii:1 % %dc: Fri Aug 21 10:23:30 2015 %
/*global UNIFACE document dojo dijit */

/*******************************************************************************
date   refnum    version who description
090130 c27216    9.ajax  jdk Error tooltip does not have "tundra" style.
090205 c27248    9.ajax  jdk acceskeys do not work & labels etc show the %sign
090305 c27328    9.ajax  fd  Move common code up in widget class inheritance tree
090928 c27673    9.4.01  fd  Use dojo 1.3.2 instead of 1.1.1.
100714 a28742    9.5.01  jks Dropdownlist validation
100728 c28434    9.5.01  pdk Add OnEdit trigger
100824 c28434    9.5.01  mzu OnEdit trigger with new callback API
110930 b29319    R118    rha Selecting item from certain dropdownlist on DSP using Firefox fails since R115
120410 b29591    R125    sse IE9 fix to show down arrow of dropdownlist
130517 b30175    E117    mgn IE10 Button DSP dropdown list not visible in IE10
date   refnum    version who description
*******************************************************************************/
// IE11 fix
dojo.isIE = (function() {
            var v = undefined;
            var match = navigator.userAgent.match(/(?:MSIE |Trident\/.*; rv:)(\d+)/);
            if (match) {
                v = parseInt(match[1], 10);
            }
            return v;  
        })();

// IE11 fix. See registerWin function in DOJO source for documentation.
dojo.mixin(dijit,
    {
        registerWin: function(targetWindow, effectiveNode){
            dojo.connect(targetWindow.document, "onmousedown", function(evt){
                dijit._justMouseDowned = true;
                setTimeout(function(){ dijit._justMouseDowned = false; }, 0);
                dijit._onTouchNode(effectiveNode||evt.target||evt.srcElement);
            });

            var doc = targetWindow.document;
            if(doc){
                // IE11 fix
                if((dojo.isIE) && (dojo.isIE < 11)) {
                    doc.attachEvent('onactivate', function(evt){
                        if(evt.srcElement.tagName.toLowerCase() != "#document"){
                            dijit._onFocusNode(effectiveNode||evt.srcElement);
                        }
                    });
                    doc.attachEvent('ondeactivate', function(evt){
                        dijit._onBlurNode(effectiveNode||evt.srcElement);
                    });
                }else{
                    doc.addEventListener('focus', function(evt){
                        dijit._onFocusNode(effectiveNode||evt.target);
                    }, true);
                    doc.addEventListener('blur', function(evt){
                        dijit._onBlurNode(effectiveNode||evt.target);
                    }, true);
                }
            }
            doc = null;
        }
    }
);
if (UNIFACE.loaded)
{
    dojo.loaded();
}


///////////////////////////////////////////////////////////////////////////////
// UNIFACE.dijit
// Namespace, as well as he dijit widget base class.
///////////////////////////////////////////////////////////////////////////////
(function(){

    var DOJO_VERSION_MAJOR = 1,
        DOJO_VERSION_MINOR = 3,
        DOJO_VERSION_PATCH = 2,
        BROWSER_TYPE = (document.all ? "ie" : "ff");


if (dojo.version.major != DOJO_VERSION_MAJOR) {
    alert("Expected dojo's major version to be " + DOJO_VERSION_MAJOR + " but it is " + dojo.version.major + "!");
    return;
} else if (dojo.version.minor != DOJO_VERSION_MINOR) {
    alert("Expected dojo's version to be " + DOJO_VERSION_MAJOR + "." + DOJO_VERSION_MINOR + " but it is " + DOJO_VERSION_MAJOR + "." + dojo.version.minor + "!");
    return;
} else if (dojo.version.patch < DOJO_VERSION_PATCH) {
    alert("Expected dojo's patch level to be at least " + DOJO_VERSION_MAJOR + "." + DOJO_VERSION_MINOR + "." + DOJO_VERSION_PATCH + " but it is " + DOJO_VERSION_MAJOR + "." + DOJO_VERSION_MINOR + "." + dojo.version.patch + "!");
    return;
}


var g_themeDefined = false;

// Dojo 1.3.2 dropdownlists and listboxes do not work well
// with valrep items that have an empty value.
// This utility is meant to adapt values for these cases.
var StringAdapter = (function() {
    var SPECIAL_EMPTY_STRING_VALUE = "URIA-emptyString_workaroundForDojo132";
    return {
        adapt : function(val) {
            if (val === "") {
                val = SPECIAL_EMPTY_STRING_VALUE;
            }
            return val;
        },
        adaptBack : function(val) {
            if (val === SPECIAL_EMPTY_STRING_VALUE) {
                val = "";
            }
            return val;
        }
    };
})();

UNIFACE.dijit = function() {
    // Call base class
    UNIFACE.widget.AbstractWidget.apply(this, arguments);
    // attributes
    this.control = null;
    this.initialAttributes = {};
    // methods
};

UNIFACE.dijit.vsn = "9.7/1";
// @c27216 UNIFACE.dijit.defaultClass = "tundra";

UNIFACE.dijit.prototype = new UNIFACE.widget.AbstractWidget();

UNIFACE.dijit.prototype.getElement = function() {
    return this.control ? this.control.focusNode : null;
};

UNIFACE.dijit.prototype.setHtml_disabled = function(aValue) {
    try {
        var oldValue = this.control.disabled;
        this.control.attr("disabled", aValue === "true");
        return oldValue;
    } catch ( e ) {  // happen for ie6
        // ignore;
    }
};

UNIFACE.dijit.prototype.setHtml_readOnly = function(aValue) {
    try {
        var oldValue = this.control.readOnly;
        this.control.attr("readOnly", aValue === "true");

        var node = this.control.focusNode;
        if ( dojo && dojo.isIE && node && document.activeElement === node && node.select) {
            node.select();
        }
        return oldValue;
    } catch ( e ) {  // happen for ie6
        // ignore;
    }
};

UNIFACE.dijit.prototype.setHtmlProp = function(aProp, aValue) {
    try {
        var oldValue, element = this.control.focusNode;

        if (aProp == "disabled")
        {
            oldValue = this.control.attr(aProp);
            this.control.attr(aProp, aValue==="true");
        }
        else
        {
            if ( aProp === "readOnly" || aProp === "multiple" ) {  // pragma(allow-loose-compare)
                aValue = (aValue === "true");
            }
            oldValue = element[aProp];
            element[aProp] = aValue;
        }
        if (oldValue)
        {
            oldValue = oldValue.toString();
        }
        return oldValue;
    } catch ( e ) {  // happen for ie6
        // ignore;
    }
};

UNIFACE.dijit.prototype.setStyle_visibility = function(aValue) {  // for editbox
    try {
        var lStyle = this.control.domNode.style;
        this.setCssProperty(lStyle, "visibility", aValue);
        lStyle = this.control.focusNode.style;
        this.setCssProperty(lStyle, "visibility", aValue, "important");
    } catch ( e ) {  // happen for ie6
        // ignore;
    }
};

UNIFACE.dijit.prototype.setValue = function(aVal) {
    if (this.control) {
        try {
            this.control.attr("value", aVal);
        } catch(e) {
        }
    }
};

UNIFACE.dijit.prototype.getValue = function() {
    if (this.control) {
        var val = this.control.attr("value");
        if (val != null) { // @pragma(allow-loose-compare)
            return val.toString();
        }
        return "";
    }
};

UNIFACE.dijit.prototype.initialize = function(a_placeholder) {
    // Prepare the initial value for the widget.
    if (this.initialAttributes.value === undefined) {
        this.initialAttributes.value = this.getCallbackValue();
    }
};

UNIFACE.dijit.prototype.getCallbackValue = function() {
    if (this.callBack) {
        return this.callBack.getValue();
    }
};

UNIFACE.dijit.prototype.preRender = function(a_placeholder) {
    this.wrapperNode = document.createElement("span");
    a_placeholder.parentNode.replaceChild(this.wrapperNode, a_placeholder);
    this.initialize(a_placeholder);
};

UNIFACE.dijit.prototype.doRender = function(a_placeholder) {
    var l_clsname = "";                         //@c27216
    var l_obj = this.callBack.getCalculatedProperties();  //@c27216
    this.wrapperNode.appendChild(a_placeholder);
    if (this.controlClass) {
        this.control = new this.controlClass( this.initialAttributes, a_placeholder);
        this.control.startup();
    }
    // @c27216 The following if statement may look weird. However I saw no other way to get it
    //working. Studied it with Ming. The true in front forces a boolean comparison
    //Possibly this is a bug in firefox 3.03 together with firebug 1.2.1
    if (!g_themeDefined ){
        if ( true && ((l_obj.uniface != null) && (l_obj.uniface.theme != null)) ){ /* pragma(allow-loose-compare) */
            if (document.body.className != null ){/* pragma(allow-loose-compare) */
                //Append theme class
                 document.body.className += " " + l_obj.uniface.theme;
            }else{
                //Set theme class
                document.body.className = l_obj.uniface.theme;
            }
            g_themeDefined = true;
        }
    }
    // @c27216 ends
};

UNIFACE.dijit.prototype.dispose = function() {
    if ( this.controls ) {
        for (var l_ctrl in this.controls) if (this.controls.hasOwnProperty(l_ctrl)) {
            this.controls[l_ctrl].destroy();
        }
    } else if ( this.control && typeof this.control.destroy === "function" ) {
        this.control.destroy();
    }
};

if ( dojo.isFF >= 4 && !UNIFACE.dijit._udojo_focusNode_subscribed ) {
    UNIFACE.dijit._udojo_focusNode_subscribed = true;
    dojo.subscribe("focusNode", null, function(node){
        if (node.tagName === "DIV") {
            var fixItByMingDev = true;
            if ( fixItByMingDev ) {
                var node2 = dijit.getFirstInTabbingOrder(node);
                if ( node2 ) {
                    node2.focus();
                    dijit.selectInputText(node2);
              //    node = node2;
                    return;
                }
            }
        }
    });
}

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.dijit.textarea
// The dijit textarea widget.
///////////////////////////////////////////////////////////////////////////////
// Private: base class for 'changeable' widgets
function Changeable()
{
    UNIFACE.dijit.apply(this, arguments);
}

Changeable.prototype = new UNIFACE.dijit();

Changeable.prototype.mapEvents = function()
{
    this.addListener(this.control, "onChange", this.callBack.getEvents().onchange);
};

function Editable()
{
    return Changeable.apply(this, arguments);
}

Editable.blockedProperties = new UNIFACE.widget.Props( {"style:cursor": "progress", "html:readonly":"true"});

Editable.prototype = new Changeable();

Editable.prototype.mapEvents = function()
{
    Changeable.prototype.mapEvents.call(this);
    this.addListener(this.control.domNode, "ondblclick", this.callBack.getEvents().detail);
};

UNIFACE.dijit.textarea = function() {
    dojo.require("dijit.form.SimpleTextarea");
    // Call base class
    Editable.apply(this, arguments);
    this.controlClass = dijit.form.SimpleTextarea;
};

UNIFACE.dijit.textarea.prototype = new Editable();

UNIFACE.dijit.textarea.prototype.setStyleProp = function(aProp, aValue) {
    try {
        if (dojo.isIE===7 && (aProp==="backgroundColor" || aProp==="background")) {
            // The default background image under IE7 is not transparent.
            // Therefore it interferes with the backgroundColor property.
            // Therefore we disable the background image here, if the
            // backgroundColor property is set.
            var lStyle = this.getStyleNode(aProp).style;
            var lFocusStyle = this.control.focusNode.style;
            this.setCssProperty(lFocusStyle, "backgroundImage", "none");
            this.setCssProperty(lFocusStyle, "backgroundColor", "transparent");
            this.setCssProperty(lStyle, "backgroundImage", "none");
        }
        UNIFACE.dijit.prototype.setStyleProp.apply(this, arguments);
    } catch ( e ) {  // happen for ie6
        // ignore;
    }
};

UNIFACE.dijit.textarea.prototype.getAllStyleNodes = function() {
    var nodes = [this.control.domNode];
    if (dojo.isIE===7) {
        nodes.push(this.control.focusNode);
    }
    return nodes;
};

UNIFACE.widgetFactory.addCreator("UNIFACE.dijit.textarea", UNIFACE.dijit.textarea);

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.dijit.richtext
// The dijit richtext widget.
///////////////////////////////////////////////////////////////////////////////


UNIFACE.dijit.richtext = function() {
    dojo.require("dijit.form.Textarea");
    // Call base class
    Editable.apply(this, arguments);
    this.controlClass = dijit.form.Textarea;
};

UNIFACE.dijit.richtext.prototype = new Editable();

UNIFACE.dijit.richtext.prototype.getValue = function() {
    var l_val = UNIFACE.dijit.prototype.getValue.call(this);
    if (this.callBack.getValue() === "" && l_val === "\n") {
       return "";
    }
    return l_val;
};

UNIFACE.widgetFactory.addCreator("UNIFACE.dijit.richtext", UNIFACE.dijit.richtext);

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.dijit.editbox
// The dijit editbox widget.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.dijit.editbox = function() {
    dojo.require("dijit.form.ValidationTextBox");
    // Call base class
    Editable.apply(this, arguments);
    this.controlClass = dijit.form.ValidationTextBox;

    // properties
    this.forceError = false;
    this.errorText = "";
};

UNIFACE.dijit.editbox.prototype = new Editable();

UNIFACE.dijit.editbox.prototype.blockedProperties = Editable.blockedProperties;

UNIFACE.dijit.editbox.prototype.setValue = function(aVal) {
    if ( this.control ) {
        this.control._u_inSetValue = true;
        UNIFACE.dijit.prototype.setValue.call(this, aVal);
        this.control._u_inSetValue = false;
        // remember the orginal value, for use by OnChange
        this.control._u_valueBeforeChange = this.getValue();
    }
};

UNIFACE.dijit.editbox.prototype.getStyleNode = function(aProp) {
    var styleNode;
    if (aProp.substring(0,4)==="text" || "color"===aProp || "cursor"===aProp || "direction"===aProp || "letterSpacing"===aProp || "unicodeBidi"===aProp || "wordSpacing"===aProp ) {
        styleNode = this.control.focusNode;
    } else if (aProp === "display" || aProp.substring(0,4) === "list") {
        styleNode = this.control.domNode.parentNode;
    } else {
        styleNode = this.control.domNode;
    }
    return styleNode;
};

UNIFACE.dijit.editbox.prototype.setStyleProp = function(aProp, aValue) {  // for editbox
    var theProp = "backgroundColor";
    try {
        var lStyle = this.getStyleNode(aProp).style;
        if (dojo.isIE===7 && (aProp==="backgroundColor" || aProp==="background")) {
            // The default background image under IE7 is not transparent.
            // Therefore it interferes with the backgroundColor property.
            // Therefore we disable the background image here, if the
            // backgroundColor property (or the more general background
            // property) is set.
            var lFocusStyle = this.control.focusNode.style;
            this.setCssProperty(lFocusStyle, "backgroundImage", "none");
            this.setCssProperty(lFocusStyle, "backgroundColor", "transparent");
            this.setCssProperty(lStyle, "backgroundImage", "none");
        }
        this.setCssProperty(this.getStyleNode(aProp).style, aProp, aValue);
    } catch ( e ) {  // happen for ie6
        // ignore;
    }
};

UNIFACE.dijit.editbox.prototype.getAllStyleNodes = function() {
    return [this.control.domNode,
            this.control.domNode.parentNode,
            this.control.focusNode];
};

function _editboxOnChange() {
    if ( !this.control ) {
        return;
    }
    // if the original value === current value: suppress OnChange
    if ( this.control._u_edited || this.control._u_valueBeforeChange !== this.getValue() ) {
        this.callBack.getEvents().onchange();
    } else {
        this.control._u_valueBeforeChange = this.getValue();
    }
    this.control._u_edited = false;
}

function _editboxOnEdit() {
    if ( this.control ) {
        if ( this.control._u_inSetValue ) {
            this.callBack.markAsModified();
        } else {
            this.callBack.getEvents().onedit();
            this.control._u_edited = true;
        }
    }
}

UNIFACE.dijit.editbox.prototype.mapEvents = function() {
    // Let the OnChange event occur on every key stroke, to support the OnEdit trigger:

    this.control.intermediateChanges = true;

    this.addListener(this.control.domNode, "ondblclick", this.callBack.getEvents().detail);
    this.addListener(this.control, "onChange", this.callBack.bind("onedit", _editboxOnEdit));
    this.addListener(this.control, "onBlur", this.callBack.bind("onchange", _editboxOnChange));
};

UNIFACE.dijit.editbox.prototype.showError = function(a_message) {
    this.forceError = true;
    this.errorText = a_message;
    this.control._hasBeenBlurred=true;
    this.control.validate(true);
    this.forceError = false;
    // Take care that the message is really displayed.
    // Do this with a slight delay, because under some circumstances Dojo is
    // under the impression that it is busy fading out a different message,
    // which prevents an immediate call to displayMessage() from showing
    // the message pop-up.
    var control = this.control;
    window.setTimeout(function() {control.displayMessage(a_message);}, 100);
};

UNIFACE.dijit.editbox.prototype.setProperties = function() {
    if (BROWSER_TYPE === "ff" ) { // Workaround for dojo 1.1.1.
        var vNode = this.control.domNode.firstChild;
        vNode.style.overflowY = "visible";
    }
};

UNIFACE.dijit.editbox.prototype.doRender = function(a_placeholder) {
    UNIFACE.dijit.prototype.doRender.call(this, a_placeholder);

    // Closure variables for the widget's extension points
    var mySelf = this;
    var l_pRecur = false;

    this.control.isValid = function(isFocused) {
        if (mySelf.forceError) {
            return (!mySelf.errorText);
        }

        // Suppress OnSyntaxError trigger (2nd param here)
        var lVal = mySelf.callBack.checkValue(this.attr("displayedValue"), true);
        if (lVal.error) {
            mySelf.errorText = lVal.error.toString();
            return false;
        }
        return true;
    };
    this.control.parse = function(aVal) {

        // Suppress OnSyntaxError trigger (2nd param here)
        var lVal = mySelf.callBack.checkValue(aVal, true);
                if (lVal.error) {
                    return aVal;
                }
                return lVal.newValue;
    };
    this.control.getErrorMessage = function() {
        return mySelf.errorText;
    };

    // The override of _isValidSubset below is needed to make sure that
    // the 'forceError' functionality works under Dojo 1.3.2.
    // Note: this does *not* make use of a supported API function.
    var original_isValidSubset = this.control._isValidSubset;
    this.control._isValidSubset = function() {
        return !mySelf.forceError && original_isValidSubset.call(this);
    };
    this.control.onFocus = function() {
        this._u_valueBeforeChange = mySelf.getValue();
    };
};

UNIFACE.widgetFactory.addCreator("UNIFACE.dijit.editbox", UNIFACE.dijit.editbox);

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.dijit.password
// The dijit password widget.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.dijit.password = function() {
    // Call base class
    UNIFACE.dijit.editbox.apply(this, arguments);
    this.initialAttributes.type = "password";
};

UNIFACE.dijit.password.prototype = new UNIFACE.dijit.editbox();

UNIFACE.widgetFactory.addCreator("UNIFACE.dijit.password", UNIFACE.dijit.password);

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.dijit.checkbox
// The dijit checkbox widget.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.dijit.checkbox = function() {
    dojo.require("dijit.form.CheckBox");
    // Call base class
    UNIFACE.dijit.apply(this, arguments);
    // attributes
    this.controlClass = dijit.form.CheckBox;
};

UNIFACE.dijit.checkbox.prototype = new UNIFACE.dijit();

UNIFACE.dijit.checkbox.prototype.setValue = function(aVal) {
    if (this.control) {
        try {
            var l_val = aVal;
            if (typeof(aVal) == "string") {
                l_val =  (aVal.match( /^(on|yes|y|true|t|1)$/i));
            }
            this.control.attr("checked", l_val);
        } catch(e) {
          //  this.calendar.setValue("");
        }
    }
};

UNIFACE.dijit.checkbox.prototype.getValue = function() {
    if (this.control) {
        return this.control.checked ? "1" : "0";
    }
};

UNIFACE.dijit.checkbox.prototype.getStyleNode = function(aProp) {
    if (aProp === "cursor") {
        return this.control.focusNode;
    }
    return this.control.domNode;
};

UNIFACE.dijit.checkbox.prototype.getAllStyleNodes = function() {
    return [this.control.domNode,
            this.control.focusNode];
};

UNIFACE.dijit.checkbox.prototype.setStyle_width = function(aValue) { // ignore
};


UNIFACE.dijit.checkbox.prototype.setStyle_display = function(aValue) {
    try {
        var lStyle = this.control.domNode.style;
        if ( dojo.isIE!==7 && aValue === "inline" ) {
            aValue = "inline-block";
        }
        this.setCssProperty(lStyle, "display", aValue);
    } catch ( e ) {  // happen for ie6
        // ignore;
    }
};

UNIFACE.dijit.checkbox.prototype.setStyleProp = function(aProp, aValue) {
    try {
        if ( aProp.indexOf("padding") !== 0 && aProp.indexOf("background") !== 0 ) {
            UNIFACE.dijit.prototype.setStyleProp.apply(this, arguments);
        }
    } catch ( e ) {  // happen for ie6
        // ignore;
    }
};

UNIFACE.dijit.checkbox.prototype.postRender = function() {
    UNIFACE.dijit.prototype.postRender.apply(this, arguments);
    // Under all other browsers the control is vertically centered with
    // respect to the surrounding text.
    // The following enforces the same behavior under IE7.
    if (dojo.isIE === 7) {
        this.control.domNode.style.verticalAlign = "middle";
    }
};


UNIFACE.dijit.checkbox.prototype.mapEvents = function() {
    var l_evs = this.callBack.getEvents();
    this.addListener(this.control, "onClick", l_evs.onchange);
};

UNIFACE.widgetFactory.addCreator("UNIFACE.dijit.checkbox", UNIFACE.dijit.checkbox);

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.dijit.button
// The dijit button widget.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.dijit.button = function() {
    dojo.require("dijit.form.Button");
    // Call base class
    UNIFACE.dijit.apply(this, arguments);
    // attributes
    this.controlClass = dijit.form.Button;
};

UNIFACE.dijit.button.prototype = new UNIFACE.dijit();

UNIFACE.dijit.button.prototype.blockedProperties = Editable.blockedProperties;

UNIFACE.dijit.button.prototype.getStyleNode = function(aProp) {
    var node;
    if (aProp === "visibility") {
        node = this.control.focusNode;
    } else if (aProp === "verticalAlign") {
        node = this.control.domNode;
    } else if (aProp.substring(0,4) === "font" || aProp.substring(0,4) === "text" || aProp === "color" || aProp === "unicodeBidi" || aProp === "direction" || aProp === "lineHeight" || aProp === "width" || aProp === "height") {
        node = this.control.focusNode.lastChild;        // The button's text node (a <span>).
    } else {
        node = this.control.focusNode.parentNode;
    }
    return node;
};

UNIFACE.dijit.button.prototype.setStyleProp = function(aProp, aValue) {
    try {
        var lStyle = this.getStyleNode(aProp).style;
        this.setCssProperty(lStyle, aProp, aValue);
        if (aProp === "cursor") {
            // Apply style also to the focusNode itself.
            lStyle = this.control.focusNode.style;
            this.setCssProperty(lStyle, aProp, aValue);
            if (dojo.isIE && aProp === "cursor") {
                // For IE also apply the style to the button's text node.
                lStyle = this.control.focusNode.lastChild.style;
                this.setCssProperty(lStyle, aProp, aValue);
            }
        }
    } catch ( e ) {  // happen for ie6
        // ignore;
    }
};

UNIFACE.dijit.button.prototype.getAllStyleNodes = function() {
    var nodes = [this.control.domNode,
                 this.control.focusNode,
                 this.control.focusNode.parentNode];
    if (dojo.isIE) {
        nodes.push(this.control.focusNode.lastChild);
    }
    return nodes;
};

UNIFACE.dijit.button.prototype.setValue = function(aVal) {
    this.value = aVal;
    if (this.control) {
        try {
            if (this.control.label != aVal) {
                aVal = this.accesskey(aVal,true,true);
                this.control.attr("label", aVal);
            }
        } catch(e) {
        }
    } else {
        aVal = this.accesskey(aVal,true,true);
        this.initialAttributes.label = aVal;
    }
};

UNIFACE.dijit.button.prototype.getValue = function() {
    return this.value;
};

UNIFACE.dijit.button.prototype.setHtml_readOnly = function(aValue) {
};

UNIFACE.dijit.button.prototype.mapEvents = function() {
    var l_evs = this.callBack.getEvents();
    if (l_evs.detail)
    {
        this.addListener(this.control, "onClick", l_evs.detail);
    }
};

UNIFACE.dijit.button.prototype.postRender = function() {
    UNIFACE.dijit.prototype.postRender.apply(this, arguments);
    // Under all other browsers the control is vertically centered with
    // respect to the surrounding text.
    // The following enforces the same behavior under IE7.
    if (dojo.isIE === 7) {
        this.control.domNode.style.verticalAlign = "middle";
    }
    // @c27248 create invisible label. display should not be "none"!!
    // otherwise accesskey won't work.
    var l_labelElem = document.createElement("label");
    l_labelElem.htmlFor   = this.control.focusNode.id;
    l_labelElem.accessKey = this.ackey;
    this.wrapperNode.appendChild(l_labelElem);

    var l_onMouse = this.control._onMouse;
    var widget = this;
    this.control._onMouse = function() {
        var event = arguments[0];
        if (event.type === "mousedown"){
            if ( !widget.blocked ) {
                widget.hasMousedown = true;
            }
        }
        l_onMouse.apply(this, arguments);
    };
};

UNIFACE.widgetFactory.addCreator("UNIFACE.dijit.button", UNIFACE.dijit.button);

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.dijit.dropdown
// The dijit dropdown widget.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.dijit.dropdown = function() {
    dojo.require("dojo.data.ItemFileWriteStore");
    dojo.require("dijit.form.FilteringSelect");
    // Call base class
    Changeable.apply(this, arguments);
    // attributes
    this.controlClass = dijit.form.FilteringSelect;
    // methods
    this.initialAttributes.store = new dojo.data.ItemFileWriteStore({data: {identifier: 'id', items:[]}});
};

UNIFACE.dijit.dropdown.prototype = new Changeable();

UNIFACE.dijit.dropdown.getCallbackValue = function() {
    // The value as obtained from the callback needs to be adapted first,
    // for the dropdown widget.
    if (this.callBack) {
        return StringAdapter.adapt(this.callBack.getValue());
    }
};

UNIFACE.dijit.dropdown.prototype.validate = function() {
    if (this.control.attr("displayedValue") !== "" && !this.control.isValid()) {
        return this.control.invalidMessage;
    }
};

UNIFACE.dijit.dropdown.prototype.getStyleNode = function(aProp) {
    var styleNode;
    if (aProp.substring(0,4)==="text" || "color"===aProp || "cursor"===aProp || "letterSpacing"===aProp || "wordSpacing"===aProp) {
        styleNode = this.control.focusNode;
    } else if ("display"===aProp) {
        styleNode = this.control.domNode.parentNode;
    } else {
        styleNode = this.control.domNode;
    }
    return styleNode;
};

UNIFACE.dijit.dropdown.prototype.setStyleProp = function(aProp, aValue) {
    try {
        if (dojo.isIE===7 && (aProp==="backgroundColor" || aProp==="background")) {
            // The default background image under IE7 is not transparent.
            // Therefore it interferes with the backgroundColor property.
            // Therefore we disable the background image here, if the
            // backgroundColor property is set.
            var lStyle = this.control.downArrowNode.style;
            this.setCssProperty(lStyle, "backgroundImage", "none");
            lStyle = this.getStyleNode(aProp).style;
            this.setCssProperty(lStyle, "backgroundImage", "none");
        }
        UNIFACE.dijit.prototype.setStyleProp.apply(this, arguments);
        if (dojo.isIE && aProp.substring(0,4)==="font") {
            // Under IE some font related style properties also need to be set
            // explicitly on the control's focusNode.
            var domStyle = this.control.domNode.style;
            var focusStyle = this.control.focusNode.style;
            var p = domStyle.fontFamily;
            if (p && p !== "") { focusStyle.fontFamily  = p; }
            p = domStyle.fontStyle;
            if (p && p !== "") { focusStyle.fontStyle   = p; }
            p = domStyle.fontVariant;
            if (p && p !== "") { focusStyle.fontVariant = p; }
            p = domStyle.fontWeight;
            if (p && p !== "") { focusStyle.fontWeight  = p; }
        }
    } catch ( e ) {  // happen for ie6
        // ignore;
    }
};

UNIFACE.dijit.dropdown.prototype.getAllStyleNodes = function() {
    var nodes = [this.control.domNode,
                 this.control.domNode.parentNode,
                 this.control.focusNode];
    if (dojo.isIE===7) {
         nodes.push(this.control.downArrowNode);
    }
    return nodes;
};

UNIFACE.dijit.dropdown.prototype.setValrep = function(aValrep) {
    if (typeof aValrep == 'object' && aValrep) {
        this.initialAttributes.store = new dojo.data.ItemFileWriteStore({data: {identifier: 'id', items:[]}});
        if (this.control) {
            this.control.store = this.initialAttributes.store;
        }
        if (aValrep.constructor === Array) {
            var a;
            for (a=0; a<aValrep[1].length; a++) {
                try {
                    this.initialAttributes.store.newItem({name: this.accesskey(aValrep[0][aValrep[1][a]],false,false), id: StringAdapter.adapt(aValrep[1][a])});
                } catch(e) {
                }
            }
        }
    }
};

// Get the valrep as it is according to the widget;
// that is: without consulting the callBack.
// This function is only intended for the purpose of testing.
UNIFACE.dijit.dropdown.prototype.getValrep = function() {
    if (!this.initialAttributes.store) {
        return null;
    }
    var valrep = [{}, []];
    var items = this.initialAttributes.store._arrayOfAllItems;
    for (var i = 0; i < items.length; i++) {
    	var o = items[i].id;
    	if ( dojo.isArray(o) && o.length > 0 ) {
    		o = o[0];
    	}
    	var value = StringAdapter.adaptBack(o);
    	o = items[i].name;
    	if ( dojo.isArray(o) && o.length > 0 ) {
    		o = o[0];
    	}
        valrep[0][value] = o;
        valrep[1][i]=value;
    }
    return valrep;
};

UNIFACE.dijit.dropdown.prototype.setProperties = function() {
    if ( BROWSER_TYPE == "ff" && this.control.domNode.style.height === "") { // Workaround for dojo 1.1.1.
        var vNode = this.control.domNode.firstChild;
        vNode.style.overflowY = "visible";
    }
};

UNIFACE.dijit.dropdown.prototype.setValue = function(aVal) {
    UNIFACE.dijit.prototype.setValue.call(this, StringAdapter.adapt(aVal));
    if (this.control && !this.control.isValid()) {
        this.control.attr("displayedValue", "");
    }
};

UNIFACE.dijit.dropdown.prototype.setRepresentation = function(aVal) {
    this.control.attr("displayedValue", aVal);
};

UNIFACE.dijit.dropdown.prototype.getRepresentation = function() {
    return this.control.attr("displayedValue");
};

UNIFACE.dijit.dropdown.prototype.getValue = function() {
    return StringAdapter.adaptBack(UNIFACE.dijit.prototype.getValue.call(this));
};

UNIFACE.widgetFactory.addCreator("UNIFACE.dijit.dropdown", UNIFACE.dijit.dropdown);

UNIFACE.dijit.dropdown.propertyPropagationList = [
    "color",
    //"fontSize",         // Do we think this should be propagated?
    "letterSpacing",
    "textDecoration",
    "textTransform",
    "wordSpacing"
];

UNIFACE.dijit.dropdown.prototype.propagateProperties = function(toNode) {
    var propertyList = UNIFACE.dijit.dropdown.propertyPropagationList;
    var s,p;
    for (var i = propertyList.length-1; i >= 0; i--) {
        p = propertyList[i];
        s = this.getStyleNode(p).style[p];
        if (s && s !== "") { toNode.style[p] = s; }
    }
};

UNIFACE.dijit.dropdown.prototype.postRender = function() {
    UNIFACE.dijit.prototype.postRender.apply(this, arguments);

    if (dojo.isIE) {
        // Under all other browsers the control is vertically centered with
        // respect to the surrounding text.
        // The following enforces the same behavior under IE7.
        if (dojo.isIE === 7) {
            this.control.domNode.style.verticalAlign = "middle";
        }

        // Force IE8+ to redraw downarrow image using font size
		if (dojo.isIE >= 8) {
            var node = this.control.domNode.firstChild.firstChild.firstChild;
            if (node && node.className === "dijitArrowButtonInner") {
                node.innerHTML = "\u202F"; // narrow no-break space
            }
        }
    }

    var self = this;
    var lOpen = this.control.open;
    this.control.open = function() {
        var lRet = lOpen.apply(this, arguments);
        if ( this._popupWidget ) {
            var lPnode = this._popupWidget.domNode.parentNode;
            self.propagateProperties(lPnode);
            this._popupWidget.domNode.style.listStyleType = "none";
         }
         return lRet;
    };
};

UNIFACE.dijit.dropdown.prototype.initialize = function(a_placeholder) {
    UNIFACE.dijit.prototype.initialize.call(this, a_placeholder);
    if ( a_placeholder && typeof a_placeholder.name === "string" ) {
        this.initialAttributes.name = a_placeholder.name;
    }
    var l_props = this.callBack.getCalculatedProperties();

    function setBool(a_propname) {
        var l_propName = a_propname.toLowerCase();
        if (typeof l_props[l_propName] === "string") {
            this.initialAttributes[a_propname] = !!(l_props[l_propName].match( /^(on|yes|y|true|t|1)$/i));
        }
    }

    setBool.call(this,"autoComplete");
    setBool.call(this,"hasDownArrow");
    setBool.call(this,"ignoreCase");
};

// Fix for Dojo 1.3.2, upwards displayed dropdownlist on DSP sometimes blocked when using Firefox
if ( dojo && dojo.isFF && dijit && dijit.form && dijit.form._ComboBoxMenu && dijit.form._ComboBoxMenu.prototype ) {
    var _l_onMouseUp = dijit.form._ComboBoxMenu.prototype._onMouseUp;

    if ( typeof _l_onMouseUp === "function" ) {
        dijit.form._ComboBoxMenu.prototype._onMouseUp = function(evt){
            var _t = "0px";
            var _h = "9999px";
            try {
                if ( this.domNode && this.domNode.style ) {
                    _h = parseInt(this.domNode.style.height, 10);
                    _t = parseInt(this.domNode.parentNode ? this.domNode.parentNode.style.top : this.domNode.style.top , 10);

                    if ( evt.clientY > (_t + _h) ) {
                        return;
                    }
                }
            } catch ( _e) {
            }

            _l_onMouseUp.apply(this, arguments);
        };
    }
}

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.dijit.listbox
// The dijit listbox widget.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.dijit.listbox = function() {
    dojo.require("dijit.form.MultiSelect");
    // Call base class
    Changeable.apply(this, arguments);
    // attributes
    this.controlClass = dijit.form.MultiSelect;
};

UNIFACE.dijit.listbox.prototype = new Changeable();

UNIFACE.dijit.listbox.prototype.setValue = function(aVal) {
    aVal = StringAdapter.adapt(aVal);
    if (this.control) {
        try {
            // Turn the (Uniface list) value into a (possibly multi-element) array.
            aVal = UNIFACE.luv.util.uListToArray(aVal);
            // Set the value
            this.control.attr("value", aVal);
            // Prevent the symptoms reported in CR 28450.
            // TODO: When moving to a new Dojo version check whether the bug still occurs.
            //       If it does then check whether this fix still works (it uses Dojo internals!).
            this.control._lastValueReported = aVal;
        } catch(e) {
          //  this.control.attr("value", "");
        }
    }
};

UNIFACE.dijit.listbox.prototype.getValue = function() {
    if (this.control) {
        return StringAdapter.adaptBack(UNIFACE.luv.util.arrayToUList(this.control.attr("value")));
    }
};

UNIFACE.dijit.listbox.getCallbackValue = function() {
    // The value as obtained from the callback needs to be adapted first,
    // for the listbox widget.
    if (this.callBack) {
        return StringAdapter.adapt(this.callBack.getValue());
    }
};

UNIFACE.dijit.listbox.prototype.setSyntax = function() {
    try {
        var l_syntax = this.callBack.getCalculatedProperties().syntax;
        if (l_syntax.REP != undefined) { // pragma(allow-loose-compare)
            if (this.getElement() && parseInt(l_syntax.REP.max,10) > 1 ) {
                this.getElement().multiple = (parseInt(l_syntax.REP.max,10) > 1);
            }
        }
    } catch (e) {
    }
};

UNIFACE.dijit.listbox.prototype.setValrep = function(aValrep) {
    //this.valrepData. = [];
    var a;
    if (typeof aValrep == 'object' && aValrep) {
        var vEl = this.getElement();
        if (!vEl) {
            return;
        }
        var vNodes = vEl.childNodes;
        var i = 0;
        var l = vNodes.length;
        
        if ( aValrep.constructor === Array ) {
            for (a=0; a<aValrep[1].length; a++) {
                var vEl2;
                if ( i < l ) {
                    vEl2 = vNodes[i];
                    if (vEl2.nodeName.toLowerCase() !== "option") {
                        // Replace this subnode with a proper "option" node.
                        var newOption = document.createElement("option");
                        vEl2.parentNode.replaceChild(newOption, vEl2);
                        vEl2 = newOption;
                    }
                    i++;
                } else {
                    vEl2 = document.createElement("OPTION");
                    vEl.appendChild(vEl2);
                }
                vEl2.value = StringAdapter.adapt(aValrep[1][a]);
                vEl2.innerHTML = "";
                vEl2.appendChild(document.createTextNode(this.accesskey(aValrep[0][aValrep[1][a]],false,false)));
            }
        }        
        if ( i < l ) {
            var vNodes2 = [];
            for ( ; i < vNodes.length; i++) {
                vNodes2.push(vNodes[i]);
            }
            for ( i = 0; i < vNodes2.length; i++) {
                vEl.removeChild(vNodes2[i]);
            }
        }
        if ( BROWSER_TYPE === "ie" ) {
            try { // force IE repaint
                var size = vEl.size;
                vEl.size = size + 1;
                vEl.size = size;
            } catch (e) {
            }
        }
   }
};

// Get the valrep as it is according to the widget;
// that is: without consulting the callBack.
// This function is only intended for the purpose of testing.
UNIFACE.dijit.listbox.prototype.getValrep = function() {
    var vEl = this.getElement();
    if (!vEl) {
        return null;
    }
    var valrep = [{}, []];
    var options = vEl.getElementsByTagName("option");
    for (var i = 0; i < options.length; i++) {
    	var value = StringAdapter.adaptBack(options[i].value);
    	valrep[0][value] = options[i].firstChild.nodeValue; // Value of the TextNode.
        valrep[1][i]=value;
    }
    return valrep;
};

UNIFACE.dijit.listbox.prototype.initialize = function(a_placeholder) {
    UNIFACE.dijit.prototype.initialize.call(this, a_placeholder);
    this.initialAttributes.baseClass = "dijitComboBox";
};

UNIFACE.dijit.listbox.prototype.doRender = function(a_placeholder) {
    UNIFACE.dijit.prototype.doRender.apply(this, arguments);
    if (this.callBack.getCalculatedProperties().html.multiple !== "true")
    {
        this.control.focusNode.multiple = false;
    }
    this.setValrep.call(this, this.callBack.getValrep());
    this.setSyntax.call(this);
};

UNIFACE.dijit.listbox.prototype.postRender = function() {
    UNIFACE.dijit.prototype.postRender.apply(this, arguments);
    // Under all other browsers the control is vertically centered with
    // respect to the surrounding text.
    // The following enforces the same behavior under IE7.
    if (dojo.isIE === 7) {
        this.control.domNode.style.verticalAlign = "middle";
    }
};

UNIFACE.widgetFactory.addCreator("UNIFACE.dijit.listbox", UNIFACE.dijit.listbox);

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.dijit.radiogroup
// The dijit radiogroup widget.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.dijit.radiogroup = function() {
    dojo.require("dijit.form.CheckBox");
    // Call base class
    UNIFACE.dijit.apply(this, arguments);
    // attributes

    // We do not define the controlClass property here,
    // because the dojo RadioButton widgets should not be created by
    // the doRender function.  Instead, they are created by
    // UNIFACE.dijit.radiogroup.insertRadio, which is called when
    // a new valrep is set.
//    this.controlClass = dijit.form.RadioButton;
    this.initialAttributes = {};
    this.layout = {
        cols : 0,
        rows : 0,
        verticalOrdering : false
    };
    this.controls = null;
    this.valueList = [];
};

UNIFACE.dijit.radiogroup.prototype = new UNIFACE.dijit();

UNIFACE.dijit.radiogroup.prototype.getAllStyleNodes = function() {
    var nodes = [this.getElement()];
    var node = this.control ? this.control.domNode : null;
	if ( node && node !== this.getElement() ) {
        nodes.push(node);
	}
    for (var l_ctrl in this.controls) if (this.controls.hasOwnProperty(l_ctrl)) {
    	node = this.controls[l_ctrl].focusNode;
    	if ( node && node !== this.getElement() ) {
            nodes.push(node);
    	}
    	if ( node !== this.controls[l_ctrl].domNode ) {
    		node = this.controls[l_ctrl].domNode;
        	if ( node && node !== this.getElement() ) {
                nodes.push(node);
        	}
    	}
    	node = this.controls[l_ctrl].labelNode;
    	if ( node && node !== this.getElement() ) {
            nodes.push(node);
    	}
    }
    return nodes;
};

UNIFACE.dijit.radiogroup.prototype.isEmpty = function() {
    for (var ctrl in this.controls) if (this.controls.hasOwnProperty(ctrl)) {
        return false;
    }
    return true;
};

UNIFACE.dijit.radiogroup.prototype.getStyleNode = function(aProp) {
    var styleNode;
    if (aProp==="textIndent" && !this.isEmpty()) {
        styleNode = this.control.labelNode.parentNode;
    } else {
        styleNode = this.control.domNode;
    }
    return styleNode;
};

UNIFACE.dijit.radiogroup.prototype.setStyleProp = function(aProp, aValue) {
    var ctrl, style;
    if (aProp==="textIndent" && !this.isEmpty()) {
        for (ctrl in this.controls) if (this.controls.hasOwnProperty(ctrl)) {
            style = this.controls[ctrl].labelNode.parentNode.style;
            this.setCssProperty(style, aProp, aValue);
        }
    } else {
        if (aProp==="cursor") {
            for (ctrl in this.controls) if (this.controls.hasOwnProperty(ctrl)) {
                style = this.controls[ctrl].focusNode.style;
                this.setCssProperty(style, aProp, aValue);
                style = this.controls[ctrl].labelNode.style;
                this.setCssProperty(style, aProp, aValue);
            }
        }
        UNIFACE.dijit.prototype.setStyleProp.apply(this, arguments);
    }
};

UNIFACE.dijit.radiogroup.prototype.setHtml_disabled = function(aValue) {
    this.setHtmlProp("disabled", aValue);
};

UNIFACE.dijit.radiogroup.prototype.setHtml_readOnly = function(aValue) {
    this.setHtmlProp("readOnly", aValue);
};


UNIFACE.dijit.radiogroup.prototype.setHtmlProp = function(aProp, aValue) {
    var oldValue;
    if ( this.controls === null ) {
        return oldValue;
    }
    var l_ctrl, l_val;
	var l_prop = aProp;
	if (aProp === "readOnly" || aProp == "disabled")
	{
		var l_props = this.callBack.getCalculatedProperties();
		l_val = l_props.html.disabled === "true" || l_props.html.readOnly=== "true"; 
		l_prop = "disabled";
	}
    for (l_ctrl in this.controls) if (this.controls.hasOwnProperty(l_ctrl)) {
        try {
            if ( l_prop === "disabled" ) {
                oldValue = this.controls[l_ctrl][l_prop];
                this.controls[l_ctrl].attr(l_prop, l_val);
            } else {
                var element = this.controls[l_ctrl].focusNode;
                oldValue = element[aProp];
                element[aProp] = aValue;
            }
        } catch ( e ) {  // happen for ie6
            // ignore;
        }
    }
    if (oldValue) {
        oldValue = oldValue.toString();
    }
    return oldValue;
};

UNIFACE.dijit.radiogroup.prototype.doRender = function() {
    UNIFACE.dijit.prototype.doRender.apply(this, arguments);
    this.initialAttributes.name = this.callBack.getId();
    this.setValrep(this.callBack.getValrep());
};


UNIFACE.dijit.radiogroup.insertRadio = function(aWidget, aValue, aTrElement, aAlign) {
    var l_labelText; //@c27248
    var vTdElem1 = document.createElement("TD");
    vTdElem1.className="unifaceRadioInput";
    aTrElement.appendChild(vTdElem1);
    var vElem = document.createElement("INPUT");
    vElem.value = aValue;
    vTdElem1.appendChild(vElem);

    var l_control = new dijit.form.RadioButton( aWidget.initialAttributes, vElem);
    l_control.startup();
    l_control.domNode.style.cssText += ";display:-moz-inline-block"; // For -moz-inline-box probelm
    aWidget.controls[aValue] = l_control;

    var vTdElem2 = document.createElement("TD");
    vTdElem2.className="unifaceRadioLabel";
    aTrElement.appendChild(vTdElem2);

    vElem = document.createElement("LABEL");
    vElem.setAttribute("for", l_control.focusNode.id);
    var valrep = aWidget.callBack.getValrep();
    l_labelText = aWidget.accesskey(valrep[0][aValue],true,true); //@c27248
    if (this.ackey !== 0){                  //@c27248
        vElem.accessKey = aWidget.ackey;   //@c27248
    }
    vElem.innerHTML = l_labelText;
// @c27248 vElem.appendChild(document.createTextNode(l_labelText)); //@c27248
    vTdElem2.appendChild(vElem);
    l_control.labelNode = vElem;

    if ( aAlign && aAlign === "LEFT" ) {
        //vTdElem2.align="right";
        aTrElement.insertBefore(vTdElem2, vTdElem1);
    } else {
        aTrElement.appendChild(vTdElem2);
    }
};

UNIFACE.dijit.radiogroup.prototype.setValrep = function(a_valrep) {
    if (!this.wrapperNode) {
        return;
    }

    // Kill the children
    this.wrapperNode.innerHTML = "";
    /*while (this.element.firstChild) {
        this.element.removeChild(this.element.firstChild);
    }*/
    this.controls = {};
    var a;
    if (typeof a_valrep !== 'object') {
        a_valrep = [{}, []];
    }
    
    var vValues = a_valrep[1];
    this.valueList = vValues;

    var cols = 0;
    var rows = 0;
    var verticalOrdering = false;

    var l_props = this.callBack.getCalculatedProperties();
    if ( l_props ) {
        l_props = l_props.uniface;
    }
    if ( l_props ) {
        if ( l_props.columns ) {
            try {
                cols = parseInt(l_props.columns,10);
            } catch ( e ) {
                cols = 0;
            }
        }
        if ( l_props.rows ) {
            try {
                rows = parseInt(l_props.rows,10);
            } catch ( e1 ) {
                rows = 0;
            }
        }
        if ( cols > 0 ) {
            if (rows > 0) {
                if (rows * cols < vValues.length) {
                    rows = Math.ceil( vValues.length / cols );
                }
            } else {
                rows = Math.ceil( vValues.length / cols );
            }
        } else if ( rows > 0 ){
            cols = Math.ceil( vValues.length / rows );
        } else {
            cols = 1;
            rows = vValues.length;
        }
        if (l_props.verticalorder === "true") {
            verticalOrdering = true;
        }
    }
    this.layout.cols = cols;
    this.layout.rows = rows;
    this.layout.verticalOrdering = verticalOrdering;
    this.control = {};
    var vElem = document.createElement("TABLE");
    vElem.className = "unifaceRadioGroup";
    this.control.domNode = vElem;
    if (dojo.isIE===7) {
        vElem.style.cssText = "display:inline-block;";
    } else if (dojo.isFF) {
        vElem.style.cssText = "display:inline-block;";
    } else {
        vElem.style.cssText = "display:inline-table;";
    }
    this.wrapperNode.appendChild(vElem);
    vElem = document.createElement("TBODY");
    this.control.domNode.appendChild(vElem);

    // Fill the array of indirect indices.
    var indices = [];
    var index = 0;
    var i,j,max;
    if (verticalOrdering) {
        var itemsInLastRow = vValues.length % cols;
        if (itemsInLastRow === 0) {
            itemsInLastRow = cols;
        }
        for (j = 0; j < cols; j++) {
            max = rows;
            if (j >= itemsInLastRow) {
                max--;
            }
            for (i = 0; i < max; i++) {
                indices[i*cols+j] = index++;
            }
        }
    } else {
        var itemsInLastColumn = vValues.length % rows;
        if (itemsInLastColumn === 0) {
            itemsInLastColumn = rows;
        }
        for (i = 0; i < rows; i++) {
            max = cols;
            if (i >= itemsInLastColumn) {
                max--;
            }
            for (j = 0; j < max; j++) {
                indices[i*cols+j] = index++;
            }
        }
    }

    // Create the rows of radio buttons.
    max = rows*cols;
    var vElem2;
    for (i = 0; i < max; i++) {
        if (i % cols === 0) {
            vElem2 = document.createElement("TR");
            vElem.appendChild(vElem2);
        }
        var vIndex = indices[i];
        if (vIndex != null && vIndex < vValues.length) { //@pragma(allow-loose-compare)
            UNIFACE.dijit.radiogroup.insertRadio(this, vValues[vIndex], vElem2, l_props.align);
        }
    }
    if (vValues.length > 0) {
        this.control.focusNode = this.controls[vValues[0]].focusNode;
        this.control.labelNode = this.controls[vValues[0]].labelNode;
    } else {
        this.control.focusNode = this.control.domNode;
        this.control.labelNode = this.control.domNode;
    }

    // The nodes of this widget have changed.
    this.nodesChanged();
};

// Get the valrep as it is according to the widget;
// that is: without consulting the callBack.
// This function is only intended for the purpose of testing.
UNIFACE.dijit.radiogroup.prototype.getValrep = function() {
    var valrep = [{}, []];
    var i;
    for (i=0; i<this.valueList.length; i++) {
    	var value = this.valueList[i];
        var labelNode = this.controls[value].labelNode;
        if (labelNode.textContent) {
            valrep[0][value] = labelNode.textContent;     // FF
        } else if (labelNode.innerHTML) {
            valrep[0][value] = labelNode.innerHTML;       // IE
        } else {
            valrep[0][value] = labelNode.firstChild.nodeValue; // Last resort...
        }
        valrep[1][i] = value;
    }
    return valrep;
};

UNIFACE.dijit.radiogroup.prototype.setValue = function(aVal) {
    this.value = aVal;
    if (this.controls) {
        this.applyValue();
    }
};

UNIFACE.dijit.radiogroup.prototype.applyValue = function() {
    if (typeof this.controls[this.value] != 'undefined') {
        this.controls[this.value].attr("checked", true);
    } else {
        var l_ctrl;
        for (l_ctrl in this.controls) if (this.controls.hasOwnProperty(l_ctrl)) {
            this.controls[l_ctrl].attr("checked", false);
        }
    }
};

UNIFACE.dijit.radiogroup.prototype.getValue = function() {
    var l_ctrl;
    var l_val = this.value;
    for (l_ctrl in this.controls) {
        if (this.controls[l_ctrl].checked ) {
            l_val = l_ctrl;
            break;
        }
    }
    return l_val;
};


UNIFACE.dijit.radiogroup.prototype.mapEvents = function() {
    var l_evs = this.callBack.getEvents();
    for (var l_ctrl in this.controls) if ( this.controls.hasOwnProperty(l_ctrl) ) {
        this.addListener(this.controls[l_ctrl], "onClick", l_evs.onchange);

    }
};

UNIFACE.widgetFactory.addCreator("UNIFACE.dijit.radiogroup", UNIFACE.dijit.radiogroup);

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.dijit.datepicker
// The dijit datepicker widget.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.dijit.datepicker = function() {
    dojo.require("dijit.form.DateTextBox");
    // Call base class
    Changeable.apply(this, arguments);
    // attributes
    this.controlClass=dijit.form.DateTextBox;
    // methods

};

UNIFACE.dijit.datepicker.prototype = new Changeable();

UNIFACE.dijit.datepicker.convertUnifaceDatePattern = function(aPattern) {
    // All patterns allowed by Uniface in a date format.
    aPattern = aPattern.replace(/[dz]?d|aa[a\*]?|mmm\*?|[mz]?m|[wz]?w|(:?xx)?xx|(:?yy)?yy|[zh]?h|[zn]?n|[zs]?s|[a-z']/gi, function(aPat) {
            // day
            aPat = aPat.replace(/[zd]d/i, "dd");
            // weekday
            aPat = aPat.replace(/aaa/i, "EEE");
            aPat = aPat.replace(/aa\*/i, "EEEE");
            aPat = aPat.replace(/aa/i, "EEEEE");
            // month
            aPat = aPat.replace(/m/gi, "M");
            aPat = aPat.replace(/MMM\*/, "MMMM");
            aPat = aPat.replace(/zM/i, "MM");
            // week number
            aPat = aPat.replace(/[zw]w/i, "w");

            // calendar year
            aPat = aPat.replace(/YY/i, "yy");
            aPat = aPat.replace(/YYYY/i, "yyyy");

            // fiscal year
            aPat = aPat.replace(/xxxx/i, "YYYY");
            aPat = aPat.replace(/xx/i, "YY");

            // hour
            aPat = aPat.replace(/[zh]h/i, "HH");
            aPat = aPat.replace(/h/i, "H");

            // minute
            aPat = aPat.replace(/[zn]n/i, "mm");
            aPat = aPat.replace(/n/i, "m");

            // seconds
            aPat = aPat.replace(/[zs]s/i, "ss");

            // DOJO does not support quoted alphabetical characters....  :-(
            if (aPat === "'") {
                //aPat = "''''";
            } else {
                // All single characters except d, month, week are illegal..
                if (/^[^dmwhs]$/i.test(aPat)) {
                    aPat = ""; //"'" + aPat + "'";
                }
            }
            return aPat;

        }
    );

    return aPattern;
};

UNIFACE.dijit.datepicker.prototype.setValue = function(aVal) {
    if (this.control) {
        var l_isValid = this.control.isValid;
        this.control.isValid = function() { return true; };
        try {
            // Note: a *formatted* value is supplied!
            this.control.attr("displayedValue", aVal);
        } catch(e) {
        } finally {
            this.control.isValid = l_isValid;
        }
    }
};

UNIFACE.dijit.datepicker.prototype.getValue = function() {
    if (this.control) {
        return this.control.attr("displayedValue").toString();
    }
};

UNIFACE.dijit.datepicker.prototype.initialize = function(a_placeholder) {
    var l_syn = this.callBack.getCalculatedProperties().syntax;
    var pattern = l_syn.DISpattern;
    if (pattern == undefined) { // pragma(allow-loose-compare)
        pattern = l_syn.DIS;
        if (pattern == undefined) { // pragma(allow-loose-compare)
            pattern = "dd-MMM-yyyy";
        } else {
            pattern = UNIFACE.dijit.datepicker.convertUnifaceDatePattern(pattern);
        }
        l_syn.DISpattern = pattern;
    }

    if (this.initialAttributes.constraints == undefined) { // pragma(allow-loose-compare)
        this.initialAttributes.constraints = {};
    }
    this.initialAttributes.constraints.datePattern = pattern;

    // For the datepicker widget the initial value is a displayedValue.
    // Therefore we set the initial displayedValue here, rather than
    // plainly the initial value (as we do for other widgets).
    if (this.initialAttributes.displayedValue === undefined) {
        this.initialAttributes.displayedValue = this.getCallbackValue();
    }
};

UNIFACE.dijit.datepicker.prototype.postRender = function() {
    UNIFACE.dijit.prototype.postRender.apply(this, arguments);
    // Under all other browsers the control is vertically centered with
    // respect to the surrounding text.
    // The following enforces the same behavior under IE7.
    if (dojo.isIE === 7) {
        this.control.domNode.style.verticalAlign = "middle";
    }
};

UNIFACE.dijit.datepicker.prototype.getStyleNode = function(aProp) {
    var styleNode;
    if ("textIndent"===aProp) {
        if (dojo.isIE===7) {
            styleNode = this.control.focusNode;
        } else {
            styleNode = this.control.domNode;
        }
    } else if (aProp.substring(0,4)==="text" || "color"===aProp || "letterSpacing"===aProp || "wordSpacing"===aProp) {
        styleNode = this.control.focusNode;
    } else if (aProp === "display" || aProp.substring(0,4) === "list") {
        styleNode = this.control.domNode.parentNode;
    } else {
        styleNode = this.control.domNode;
    }
    return styleNode;
};

UNIFACE.dijit.datepicker.prototype.setStyleProp = function(aProp, aValue) {
    try {
        if (dojo.isIE===7 && (aProp==="backgroundColor" || aProp==="background")) {
            // The default background image under IE7 is not transparent.
            // Therefore it interferes with the backgroundColor property.
            // Therefore we disable the background image here, if the
            // backgroundColor property is set.
            var lStyle = this.getStyleNode(aProp).style;
            var lDOMStyle = this.control.domNode.style;
            this.setCssProperty(lDOMStyle, "backgroundImage", "none");
        }
        if (aProp==="cursor") {
            this.setCssProperty(this.control.focusNode.style, aProp, aValue);
        }
        UNIFACE.dijit.prototype.setStyleProp.apply(this, arguments);
        if (dojo.isIE) {
            var lineHeight = this.getStyleNode("lineHeight").style.lineHeight;
            if (lineHeight && lineHeight!=="normal") {
                if (dojo.isIE===8) {
                    // In IE8 the text in the control's focusNode (that is, the date as a string)
                    // becomes partially invisible if the lineHeight property is set.
                    // The following repairs this:
                    this.control.focusNode.style.lineHeight = "normal";
                } else if (dojo.isIE===7) {
                    // Unlike in other browsers in IE7 the visible control height
                    // is unaffected by the lineHeight property.
                    // To make the control behave in IE7 like it does in other browsers
                    // we adapt the actual height:
                    var style = this.control.focusNode.parentNode.style;
                    var pattern = new RegExp("^\\d*$");
                    if (pattern.test(lineHeight)) {
                        style.height = lineHeight + "em";
                    } else {
                        style.height = lineHeight;
                    }
                }
            }
        }
    } catch ( e ) {  // happen for ie6
        // ignore;
    }
};

UNIFACE.dijit.datepicker.prototype.getAllStyleNodes = function() {
    return [this.control.domNode,
            this.control.domNode.parentNode,
            this.control.focusNode];
};

UNIFACE.widgetFactory.addCreator("UNIFACE.dijit.datepicker", UNIFACE.dijit.datepicker);

}());
