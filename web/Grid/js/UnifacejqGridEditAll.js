var lastsel;
$.extend($.jgrid.edit, {
    bSubmit: "Add and Close",
    recreateForm: true,
    onclickSubmit : function (options,postdata) {
    onclickSubmitLocal(options,postdata);
    }

});
$.extend($.jgrid.del, {
    bSubmit: "Delete and Close",
    recreateForm: true,
    onclickSubmit : function (options,postdata) {
    onclickDeleteLocal(options,postdata);
    }

});

function onclickDeleteLocal (options,postdata) {
       	var rowData = jQuery('#list1').jqGrid ('getRowData', postdata);
    	rowData.USTAT = "del";
    	var Udata = JSON.stringify(rowData);
    	window.unifaceTriggers('delGridData', Udata);
	this.processing = true;
	return {};
	};
function onclickSubmitLocal (options,postdata) {
	postdata.USTAT = "new";
	var Udata = JSON.stringify(postdata);
	window.unifaceTriggers('AddGridData', Udata);
	this.processing = true;
	return {};
	};
function closeModal (mType) {
	if(mType =="D") {
           jQuery("#delmodlist1  .ui-icon-closethick").trigger('click');
	}
	else {
           jQuery("#editmodlist1  .ui-icon-closethick").trigger('click');
	}
        jQuery('#list1').trigger("reloadGrid");
}
function showError (errStatus, errMessage) {
      $(".topinfo").html('<div class=\"ui-state-highlight\" style=\"padding:5px;\">Error '+errStatus+' '+errMessage+'</div>'); 
      var tinfoel = $(".tinfo").show();
      tinfoel.delay(3000).fadeOut();
}
function endDelGrid () {								
                     jQuery("#delmodlist1  .ui-icon-closethick").trigger('click');
                    jQuery('#list1').trigger("reloadGrid");
}
function endEditGrid () {								
                     jQuery("#editmodlist1  .ui-icon-closethick").trigger('click');
                    jQuery('#list1').trigger("reloadGrid");
}