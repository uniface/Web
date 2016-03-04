function setResult(id, message) {

  var messageDiv = document.getElementById(id);

  messageDiv.className = "yellow";
  messageDiv.innerHTML = message;

  setTimeout(function(){
    messageDiv.className = "foo";
  }, 2000);
}