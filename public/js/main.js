"use strict";

$(document).ready(function() {
  var socket = io.connect();
  var results = {};

  // function fired on update from server
  socket.on('update', function (data) {
    var newData = data.data,j;
    var newIndex = newData[0];
    results[newIndex] = newData;

    var indexes = Object.keys(results).sort(function(a,b){return a-b});
    var trs = '';
    var trElements = $('tr:has(td)');
    var tds = '';
    var lossLvl = 0;
    var lossInfo = '';

    if(trElements.length != indexes.length){
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
        if(lossLvl > 80){
          lossInfo = ' class="error"';
        }else if(lossLvl > 40){
          lossInfo = ' class="warning"';
        }else{
          lossInfo = ' class="success"';
        }
        trs += '<tr id="row-'+index+'"'+lossInfo+'>'+tds+'</tr>';

      }
      $('tr:has(td)').remove();
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
      if(lossLvl > 80){
        lossInfo = 'error';
      }else if(lossLvl > 40){
        lossInfo = 'warning';
      }else{
        lossInfo = 'success';
      }
      $('tr#row-'+newIndex).html(tds).attr('class', lossInfo);
    }
  });

  // Show proper error in case of server error
  socket.on('disconnect', function(){
    newAlert('error', 'server error');
    $("button.kill-mtr").attr("disabled", "disabled");
  });

  // Show proper information from server
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

  // Bind form events to function
  $('.mtr-send').submit(sendRequest);
  $('.send-btn').click(sendRequest);

  // Bind button to kill MTR event
  $('.kill-mtr').click(function(){
    socket.emit('kill-mtr');
  });

  /**
   * Sends new request to lookup a host
   * @return {Boolean} always false
   */
  function sendRequest(){
    socket.emit('mtr', { address: $('#address').val() });
    $('tr:has(td)').remove();
    $("button.kill-mtr").removeAttr("disabled");
    results = {};
    return false;
  }

  /**
   *
   * @param type - can be: success, error, warning, info
   * @param message
   */
  function newAlert (type, message) {
    $("#alert-area").append($("<div class='alert alert-"+type+" alert-message' data-alert='alert'><p> " + message + " </p></div>"));
    $(".alert-message").delay(3000).fadeOut("slow", function () { $(this).remove(); });
  }
});
