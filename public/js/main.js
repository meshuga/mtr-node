"use strict";

$(document).ready(function() {
  var socket = io.connect('http://localhost');
  var results = {};

  socket.on('update', function (data) {
    var newData = data.data,j;
    var newIndex = newData[0];
    results[newIndex] = newData;

    var indexes = Object.keys(results).sort(function(a,b){return a-b});
    var trs = '<tr><th>ID</th><th>Host</th><th>Loss</th><th>Received</th><th>Sent</th><th>Xmit</th><th>AVG</th><th>Wrst</th></tr>';
    var trElements = $('tr');
    var tds = '';
    var lossLvl = 0;
    var lossInfo = '';

    if(trElements.length-1 != indexes.length){ // New row(s);-1 because of HR tags
      for(var i=0;i<indexes.length;i++){
        var index = indexes[i];
        var row = results[index];
        tds = '';
        for(j=0;j<8;j++){
          if(j==1){
            tds+='<td><a href="http://www.ip-adress.com/whois/'+row[1]+'" target="_blank">'+row[1]+'</a></td>';
          }else if(j!=2){
            tds+='<td>'+row[j]+'</td>'
          }else{
            lossLvl = (new Number(100 - 100 * (+row[3]) / (+row[4]))).toPrecision(5);
            tds+='<td>'+ lossLvl +'%</td>'
          }
        }
        if(lossLvl > 75){
          lossInfo = ' class="error"';
        }else if(lossLvl > 50){
          lossInfo = ' class="warning"';
        }else{
          lossInfo = ' class="success"';
        }
        trs += '<tr id="row-'+index+'"'+lossInfo+'>'+tds+'</tr>';

      }
      $('th, td, tr').remove();
      $('table.mtr-results').append(trs);
    }else{
      for(j=0;j<8;j++){
        if(j==1){
          tds+='<td><a href="http://www.ip-adress.com/whois/'+newData[1]+'" target="_blank">'+newData[1]+'</a></td>';
        }else if(j!=2){
          tds+='<td>'+newData[j]+'</td>';
        }else{
          lossLvl = (new Number(100 - 100 * (+newData[3])/(+newData[4]))).toPrecision(5);
          tds+='<td>'+ lossLvl +'%</td>'
        }
      }
      if(lossLvl > 75){
        lossInfo = 'error';
      }else if(lossLvl > 50){
        lossInfo = 'warning';
      }else{
        lossInfo = 'success';
      }
      $('tr#row-'+newIndex).html(tds).attr('class', lossInfo);
    }
  });

  socket.on('got', function (data) {
    if(data.cmd == 'nok'){
      newAlert('error', data.data);
      $("button.kill-mtr").attr("disabled", "disabled");
    }
    else if(data.cmd == 'ok'){
      $(".alert").remove();
      newAlert('success', data.data);
    }
  });

  $('.mtr-send').submit(sendRequest);

  $('.send-btn').click(sendRequest);

  $('.kill-mtr').click(function(){
    socket.emit('kill-mtr');
  });

  function sendRequest(){
    socket.emit('mtr', { address: $('#address').val() });
    $('tr').remove();
    $("button.kill-mtr").removeAttr("disabled");
    return false;
  }

  function newAlert (type, message) {
    $("#alert-area").append($("<div class='alert alert-"+type+" alert-message fade in' data-alert='alert'><p> " + message + " </p></div>"));
    $(".alert-message").delay(3000).fadeOut("slow", function () { $(this).remove(); });
  }

});