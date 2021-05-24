var client = null;
var storeFileKey = null;
var storeFileName = null;

function fileChange() {

    // FileList is an object of the input element with ID "fileA"
    var fileList = document.getElementById("fileA").files;
    // File object (first element of fileList)
    var file = fileList[0];
    // File object not found = no file selected or not supported by browser
    if (!file) {
        return;
    }
    document.getElementById("fileName").innerHTML = 'Filename: ' + file.name;
    document.getElementById("fileSize").innerHTML = 'Filesize: ' + file.size + ' B';
    document.getElementById("fileType").innerHTML = 'Filetype: ' + file.type;
    document.getElementById("progress").value = 0;
    document.getElementById("percent").innerHTML = "0%";
}

function uploadFile() {

    // same file object
    var file = document.getElementById("fileA").files[0];
    if (!file) {
        alert("No file selected!");
        return;
    }

    // Create FormData object
    var formData = new FormData();
    // Create XMLHttpRequest object
    client = new XMLHttpRequest();

    //Setup the progress bar
    var prog = document.getElementById("progress");
    prog.value = 0;
    prog.max = 100;

    // Adds file and filename to the FormData object, so that USP can do upload and store
    formData.append("FILE_UPLOAD.DUMMY.1", file);
    storeFileName = file.name;
    formData.append("UPLOADFILENAME.DUMMY.1", storeFileName);

    //What should we do if the upload fails?
    client.onerror = function (e) {
        alert("onError");
    };

    //What should we do once the upload completes?
    client.onload = function (e) {
        document.getElementById("percent").innerHTML = "100%";
        prog.value = prog.max;

        console.log(this.response);

        var responseObject = JSON.parse(this.response);
        var status  = responseObject.status;
        var message = responseObject.message;

        console.log(status);
        console.log(message);
    };

    //What should we do while the upload is going?
    client.upload.onprogress = function (e) {
        var p = Math.round(100 / e.total * e.loaded);
        document.getElementById("progress").value = p;
        document.getElementById("percent").innerHTML = p + "%";
    };

    //What should we do if the user aborts the upload?
    client.onabort = function (e) {
        alert("Upload aborted");
    };

    //Open the XMLHttpRequest and post the form data
    client.open("POST", "FILE_UPLOAD_USPP");
    client.send(formData);
}

function uploadAbort() {

    if (client instanceof XMLHttpRequest) {
        // cancels actual transmission
        client.abort();
    }
}
