var lastsel;
$.extend($.jgrid.edit, {
    bSubmit: "Add and Close",
    recreateForm: true,
    onclickSubmit : function (options,postdata) {
    onclickSubmitLocal(options,postdata);
    }

});

grid = $("#list1"),
myDelOptions = {
        onclickSubmit: function(rp_ge, rowid) {
       	var rowData = jQuery('#list1').jqGrid ('getRowData', rowid);
   	rowData.USTAT = "del";
    	var Udata = JSON.stringify(rowData);
    	window.unifaceTriggers('delGridData', Udata);
    	//$( "#DelError" ).hide();
    	// !!! the most important step: skip ajax request to the server
    	this.processing = true;
        return true;
       		}
  	},

onclickSubmitEdit = function(options,postdata) {
	var rowData = jQuery('#list1').jqGrid ('getRowData', postdata.list1_id);
	postdata.ID = rowData.ID;
	delete postdata.list1_id;
	postdata.USTAT = "mod";
	var Udata = JSON.stringify(postdata);
	window.unifaceTriggers('SetGridData', Udata);
	this.processing = true;
	return {};
	},
onclickSubmitDel = function(options,postdata) {
	var rowData = jQuery('#list1').jqGrid ('getRowData', postdata);
	postdata.ID = postdata.list1_id;
	delete postdata.list1_id;
	rowData.USTAT = "del";
	var Udata = JSON.stringify(rowData);
	window.unifaceTriggers('delGridData', Udata);
	this.processing = true;
	return {};
	},

editSettings = {
        recreateForm:true,
        viewPagerButtons: false,
        editData: {ID: function() { return jQuery("#ID option:selected").val(); }},
        bSubmit: "Edit and Close",
        jqModal:false,
        reloadAfterSubmit:false,
        closeOnEscape:true,
        savekey: [true,13],
        closeAfterEdit:true,
        onclickSubmit:onclickSubmitEdit
        },
deleteSettings = {
        recreateForm:true,
        viewPagerButtons: false,
	delData: {ID: function() { return jQuery("#ID option:selected").val(); }},
	bSubmit: "Delete and Close",
	jqModal:false,
	reloadAfterSubmit:false,
	closeOnEscape:true,
	savekey: [true,13],
	closeAfterEdit:true,
        onclickSubmit:onclickSubmitDel
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