$( document ).ready(function() {
    brain_get_announcements();
    //Send feedback
    $( "#link_feedback_send" ).click(function() {
        send_feedback_brain();
        return false;
    }); 
});


function brain_get_announcements()
{
     chrome.storage.sync.get(['imdbid','imdbusername'], function (result) {
        if(typeof result.imdbid === 'undefined'){
            
         }else{
            // If user is logged in!
            imdb_user = result.imdbid;       
            imdb_username = result.imdbusername;
                $.ajax({
                    url: brain_api_path + "?a=get_announcements&u=" + imdb_user,
                }).done(function ( data ) {
                 if (data !== ''){
                    $( "#div_announcements").show();
                    var announcements = JSON.parse(data);
                    for (var i in announcements) {
                        var ann = announcements[i];
                        var theid = ann.id;
                        var thetext = ann.announcement;
                         html = '<div id="div_announcements_'+theid+'" class="alert alert-info">'+thetext+'<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button></div>';
                        $('#div_announcements_'+theid).alert();
                        $('#div_announcements').bind('closed.bs.alert', function () {
                               $.ajax({
                                    url: brain_api_path + "?a=clear_announcement&u=" + imdb_user + "&i=" + theid,
                                }).done(function ( data ) {
                                    //announcement is cleared
                                });
                        })
                        $( "#div_announcements").html($( "#div_announcements").html() + html);
                         $('#div_announcements_'+theid).fadeIn();
                    }
                 }else{
                    $('#div_announcements').hide()
                 }
                });
         }
    });
}

function send_feedback_brain()
{
      chrome.storage.sync.get(['imdbid','imdbusername'], function (result) {
        if(typeof result.imdbid === 'undefined'){
              $( "#div_feedback_status" ).fadeIn();
                $("#div_feedback_status").html('<p class="alert alert-danger"><strong>Logged out?</strong> You seem to have logged out. Please login to IMDbrain and come back here.</p>');
         }else{
            imdb_user = result.imdbid;       
            imdb_username = result.imdbusername;
            feedback_text = $("#textarea_feedback").val();
            if (feedback_text!==''){
                $.ajax({
                    url: brain_api_path + "?a=feedback&u=" + imdb_user + "&f="+ feedback_text,
                    error: function(){
                         $("#div_feedback_status").html('<p class="alert alert-warning"><strong>Whoopsy.</strong> There seems to be a problem contacting the brain. Please try again later...</p>');
                    }
                }).done(function ( data ) {
                     $( "#div_feedback_status" ).fadeIn();
                $("#div_feedback_status").html('<p class="alert alert-success"><strong>Got it!</strong> Thanks for the feedback!</p>');
                    $("#textarea_feedback").val('');
                });
            }else{
                //do nothing when no text inserted
            }
         }
    });
}