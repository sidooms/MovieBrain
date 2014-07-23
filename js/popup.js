var global_imdb_userid ;
var global_imdb_username ;  
var global_maybe_imdb_userid ;
var global_maybe_imdb_username ;

/*
    When DOM is ready, assign listeners
*/
$( document ).ready(function() {
    $('#div_no_user_detected').hide();
    $('#div_login_form').hide();
    $('#div_logged_in').hide();
    $('#div_loggedout').hide();


   $('#div_announcements').hide();
   
    /*
        try to load the user from storage and set the 
        layout according to the response (login form or not)
    */
    load_user();
    //The feed link
    $( "#btn_login" ).click(function() {   
      //brain login
      brain_login();
    });  
    //The show recommendations link
    $( "#link_show_recommendations" ).click(function() {
        goto_recommendations_page();
        return false;
    });  
    //The open any imdb pagelink
    $( "#anyimdblink" ).click(function() {
        chrome.tabs.create({url: 'http://www.imdb.com/'});
        return false;
    }); 
    
    //Logout
    $( "#link_logout" ).click(function() {
        close_tabs();
        clear_user();
        //reset layout to no user logged in
        set_basic_layout('loggedout');
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

function check_if_ratings_are_public(imdbid)
{
    $.ajax({
        url: brain_api_path + "?a=check_public_ratings&u=" + imdbid,
    }).done(function ( data ) {
        if (data == '0'){
            //ratings are NOT public
             $( "#link_imdb_profile" ).click(function() {
               // console.log('clicked');
                 chrome.tabs.create({url: 'http://www.imdb.com/user/' + imdbid});
                
            }); 
            
            $('#div_ratings_not_public').show();
            //console.log('ratings are NOT public');
        }else{
            $('#div_ratings_not_public').hide();
            //console.log('data is '  + data);
            //console.log('userid '  + imdbid);
        }
    });    
}

function goto_recommendations_page(){
    //check if recommendations page exists
    chrome.tabs.getAllInWindow(null, function(tabs) {
        var foundit = false;
        tabs.forEach(function(tab){
            if (tab.title == 'MovieBrain -- Recommendations'){
                //if yes: goto existing
                chrome.tabs.update(tab.id, {selected: true});
                foundit = true;
            }
        });
        //if not: create new
        if (!foundit){
        chrome.tabs.create({url: 'recommendations.html'});
        }
    });
}

function goto_feedback_page(){
    //check if recommendations page exists
    chrome.tabs.getAllInWindow(null, function(tabs) {
        var foundit = false;
        tabs.forEach(function(tab){
            if (tab.title == 'MovieBrain -- Feedback'){
                //if yes: goto existing
                chrome.tabs.update(tab.id, {selected: true});
                foundit = true;
            }
        });
        //if not: create new
        if (!foundit){
        chrome.tabs.create({url: 'feedback.html'});
        }
    });
}
function close_tabs(){
    chrome.tabs.getAllInWindow(null, function(tabs) {
        
        tabs.forEach(function(tab){
            if (tab.title == 'MovieBrain -- Recommendations' || tab.title=='MovieBrain -- Settings and Filters' || tab.title=='MovieBrain -- Feedback'){
                chrome.tabs.remove(tab.id);
            }
        });
       
    });
}



function set_basic_layout(status){
    $("#div_ratings_not_public").hide();
    if (status == ''){
        $('#div_no_user_detected').show();
        $('#div_login_form').hide();
        $('#div_logged_in').hide();
        $('#div_loggedout').hide();
        $('#div_announcements').hide();
    }else if(status == 'userdetected'){
        // Set user in the form
        $('#span_maybe_username').text(global_maybe_imdb_username);
        $('#div_no_user_detected').hide();
        $('#div_login_form').show();
        $('#div_logged_in').hide();
        $('#div_loggedout').hide();
        $('#div_announcements').hide();
    }else if (status == 'loggedin'){
        // Set user in logout link
        $('#span_username').text(global_imdb_username);
        //The open any imdb pagelink
        $( "#link_rate_movies_imdb" ).click(function() {
            chrome.tabs.create({url: 'http://www.imdb.com/user/' + global_imdb_userid + '/ratings?tab=builder'});
            return false;
        }); 
        $( "#link_feedback" ).click(function() {
            goto_feedback_page();
            return false;
        }); 
        $('#div_no_user_detected').hide();
        $('#div_login_form').hide();
        $('#div_logged_in').show();
        $('#div_loggedout').hide();
        brain_get_announcements();
    }else if (status == 'loggedout'){
        $('#div_no_user_detected').hide();
        $('#div_login_form').hide();
        $('#div_logged_in').hide();
        $('#div_loggedout').show();
        $('#div_announcements').hide();
    }
}

function save_user(imdb_id, imdb_username){
    chrome.storage.sync.set({'imdbusername': imdb_username, 'imdbid': imdb_id});
}

function load_user(){
    // See if user is logged in
    chrome.storage.sync.get(["imdbid","imdbusername"], function (result) {
        if(typeof result.imdbid === 'undefined'){
            // User is NOT logged in
            // Check for a maybe id ...
            chrome.storage.sync.get(["maybe_imdbid","maybe_imdbusername"], function (result) {
                if(typeof result.maybe_imdbid === 'undefined'){
                    // No maybe id detected
                    set_basic_layout('');
                }else{
                    // An IMDb user has been detected 
                    global_maybe_imdb_userid = result.maybe_imdbid;
                    global_maybe_imdb_username = result.maybe_imdbusername;
                    
                    set_basic_layout('userdetected');
                }
           });
        }else{
            // User is logged in
            global_imdb_userid = result.imdbid;
            global_imdb_username = result.imdbusername;
            set_basic_layout('loggedin');
            
            //check if ratings are public
            check_if_ratings_are_public(result.imdbid);
        }
    });
}

function clear_user(){
    chrome.storage.sync.clear();
}


function brain_login(){
    // Login means that the maybe username and id can be set as normal username and id
    global_imdb_userid = global_maybe_imdb_userid;
    global_imdb_username = global_maybe_imdb_username;
    $.ajax({
        url: brain_api_path + "?a=login&u=" + global_imdb_userid + "&un=" + global_imdb_username,
    }).done(function ( data ) {
        if (data == 'done.'){
            //save user id to local chrome storage
          
            save_user(global_imdb_userid, global_imdb_username);
            //set the layout as logged in
            set_basic_layout('loggedin');
        }else{
            alert('there was a problem login in to the brain: ' + data);
        }
    });
}
