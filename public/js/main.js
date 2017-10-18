$(document).ready(() => {
    $("#add").on("click", function(e) {
      if(!$("#newoption").val()){
        e.preventDefault();
        if($("#alert").length === 0){
          $("#pollinfo").append('<div class="alert alert-danger" id="alert" role="alert">Fill the option field to insert a new one!</div>');
        }
      }
    })
    });