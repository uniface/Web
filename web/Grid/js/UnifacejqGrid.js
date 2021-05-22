var UnifacejqGrid = (function ($) {
function callTrigger(trigger, pdata, pfmt, gridid) {

    var rqst1 = $.Deferred();
    var data = null;
    var callBackFunctionName = 'u' + Math.floor(Math.random() * 1000001);
    window[callBackFunctionName] = function (griddata, pfmt) {

        if (pfmt == 'XML') {
            data = $.parseXML(griddata);
        } else {
            data = $.parseJSON(griddata);
        }
        rqst1.resolve(data, pfmt);
        window[callBackFunctionName] = null;
    };
    pdata.totalRecords = $(gridid).jqGrid('getGridParam', 'records');
    var Uparms = JSON.stringify(pdata);
    window.unifaceTriggers(trigger, Uparms, pfmt, callBackFunctionName);
    return rqst1.promise();
};

function GetData(trigger, pdata, pfmt, gridid) {
    var resp1 = callTrigger(trigger, pdata, pfmt, gridid);
    resp1.then(function (data, pfmt) {
            var thegrid = $(gridid)[0];
            if (pfmt == 'XML') {
                    thegrid.addXmlData(data);
                } else {
                    thegrid.addJSONData(data);
                }
            });
};

return {
   	GetData: GetData
   	};


})(jQuery);	          