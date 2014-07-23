var weights;
var filters_yes_data = [];
var filters_no_data = [];
var is_popular = true;

$( document ).ready(function() {
    /*
        Set the tooltips
    */
    $('#link_refresh_recommendations').tooltip({placement:"bottom",container: 'body'});
    $('#link_modal_weights').tooltip({placement:"bottom",container: 'body'});
    $('#link_modal_filters').tooltip({placement:"bottom",container: 'body'});
    
    brain_get_recommendations();
    brain_get_announcements();
   $( "#link_refresh_recommendations" ).click(function() {
        brain_get_recommendations();
        return false;
    }); 
   $( "#link_leave_feedback" ).click(function() {
        goto_feedback_page();
        return false;
    }); 
    
    
    
    
    /*
        The Settings
    */
    // Event: when modal is shown
    $('#div_modal_weights').on('shown.bs.modal', function (e) {
        $("#weights-no-settings-yet").hide();
        $('#link_weights_reset').tooltip({placement:"bottom", container:"#div_modal_weights"}) ;
        brain_get_weights();
        $( "#link_weights_update").click(function() {
            $('#div_modal_weights').modal('hide');
            $("#div_recommendations_status").fadeIn();
            $("#div_recommendations_status").html('<strong>Saving.</strong> Saving your settings now...');
            brain_set_weights();
        });
        $("#link_weights_reset").click(function() {
            $('#div_modal_weights').modal('hide');
            $("#div_recommendations_status").fadeIn();
            $("#div_recommendations_status").html('<strong>Restoring.</strong> Restoring default settings now...');
            brain_reset_weights();
        });        
    });
    // Trigger: show modal
    $( "#link_modal_weights" ).click(function() {
        $('#div_modal_weights').modal({
            backdrop: "static"
        });
    }); 
    /*
        The Filters
    */
    // Event: when modal is shown
    $('#div_modal_filters').on('shown.bs.modal', function (e) {
        brain_get_filters();
        $( "#link_save_filters").click(function() {
            $('#div_modal_filters').modal('hide');
            $("#div_recommendations_status").html('<strong>Saving.</strong> Saving your filters now...');
            $("#div_recommendations_status").fadeIn();
            brain_set_filters();
        });
        
        
    });
    // Trigger: show modal
    $( "#link_modal_filters" ).click(function() {
        $('#div_modal_filters').modal({
        });
        
        
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
                    error: function(){
                         $("#div_recommendations_status").html('<strong>Whoopsy.</strong> There seems to be a problem contacting the brain. Please try again later...');
                    }
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

function brain_log_more_click(next){
     chrome.storage.sync.get(['imdbid','imdbusername'], function (result) {
        if(typeof result.imdbid === 'undefined'){
            
         }else{
            imdb_user = result.imdbid;       
            imdb_username = result.imdbusername;
            $.ajax({
                url:  brain_api_path + "?a=track_more_click&u=" + imdb_user + "&p="+ next,
            }).done(function ( data ) {
            
            });
        }
     });
}

function brain_log_open_imdb_click(movie_imdb_id){
    //console.log('brain_log_open_imdb_click called...');
    chrome.storage.sync.get(['imdbid','imdbusername'], function (result) {
        if(typeof result.imdbid === 'undefined'){
            
         }else{
            imdb_user = result.imdbid;       
            imdb_username = result.imdbusername;
            $.ajax({
                url: brain_api_path + "?a=track_imdb_click&u=" + imdb_user + "&l="+ movie_imdb_id,
            }).done(function ( data ) {
            
            });
         }
    });
}

function brain_log_hide_click(movie_imdb_id){
    chrome.storage.sync.get(['imdbid','imdbusername'], function (result) {
        if(typeof result.imdbid === 'undefined'){
            
         }else{
            imdb_user = result.imdbid;       
            imdb_username = result.imdbusername;
            $.ajax({
                url: brain_api_path + "?a=track_hide_click&u=" + imdb_user + "&l="+ movie_imdb_id,
            }).done(function ( data ) {
            
            });
         }
    });
}



function brain_get_recommendations(resultdiv, page){ 
    var loading_more = true; 
    if(typeof(resultdiv)==='undefined'){
        resultdiv = 'div_movies';
        loading_more = false;
    }
    if(typeof(page)==='undefined'){
        page = 1;
        loading_more = false;
    }
    
    
    //get imdb user from chrome storage
    chrome.storage.sync.get(['imdbid','imdbusername'], function (result) {
        if(typeof result.imdbid === 'undefined'){
            //error getting user id?
            $( "#div_recommendations_status" ).show();
            $("#div_recommendations_status").html("<strong>Logged out?</strong> You seem to have logged out. Please login to MovieBrain and come back here.");
        }else{
            imdb_user = result.imdbid;       
            imdb_username = result.imdbusername;
            if (!loading_more){
                $("#div_recommendations_info").hide();
                $( "#div_recommendations_status" ).show();
                $("#div_recommendations_status").html("<strong>Loading recommendations.</strong> This might take a few seconds (depending on the mood of the brain)...");
            }else{
                $("#"+resultdiv).html("<p class='alert alert-warning'><strong>Loading recommendations.</strong> This might take a few seconds (depending on the mood of the brain)...</p>");
            }
            $.ajax({
                url: brain_api_path + "?a=get_rec&u=" + imdb_user + "&p=" + page,
                error: function(){
                         $("#div_recommendations_status").html('<strong>Whoopsy.</strong> There seems to be a problem contacting the brain. Please try again later...');
                    }
            }).done(function ( data ) {
                if (data === 'problem.'){
                     $("#div_recommendations_status").html('<strong>Whoopsy.</strong> There seems to be a problem contacting the brain. Please try again later...');
                }else{
                    jsondata = JSON.parse(data);    
                    if (jsondata.type === 'popular'){
                        $("#link_modal_weights").hide();
                        $("#div_recommendations_status").html('<strong>Hi there!</strong> Since you are new here, the brain is still analyzing your IMDb ratings and figuring out who you are (usually takes about 5 minutes). Make sure your ratings are public and you have rated at least 5 movies. For now, here are some <strong>popular movies</strong>. You can already play around with the filters if you want.');
                    }else if (jsondata.type =='personal'){
                        is_popular = false;
                        $("#link_modal_weights").show();
                        $("#div_recommendations_status").fadeOut();
                        $("#div_recommendations_info").fadeIn()
                        $("#div_recommendations_info").html('<strong>Ready! </strong> Here are some movies the brain thinks you like. Unhappy with the results? No problem! Adjust the <strong>settings</strong> and play with the genre <strong>filters</strong> to get it right!');
                    }
                    recs = jsondata.recs;
                    generate_html_from_movies(recs, jsondata.next, resultdiv);
                } 
            });
        }
    });
}

function generate_html_from_movies(movies, next, resultdiv){
    //console.log(movies);
    var html = "";
    count = 0;
    for (var i in movies) {
        var movie_imdb_id = movies[i];
        html += generate_html_from_movie_id(movie_imdb_id);
        count += 1;
    }
    //if no movies are found
    if (count == 0){
        html = "<div class='alert alert-info'><strong>No Movies!</strong> That's weird, no movies were found, try adjusting the settings...</div>";    
        $("#div_recommendations_info").hide();
        $("#div_movies").html(html);
    }else{
        if (next !== 'end'){
            /*
                Add more recs button  
            */
            //add more recs div, + button
            html += '<button type="button" class="btn btn-primary btn-block more-button" id="button-more-recs-'+next+'">Load more...</button><div id="div-more-recs-'+next+'"></div>';        
            $("#" + resultdiv).html(html);
            //action for button
            $("#button-more-recs-" +next).click(function() {
                //load more movies in the next movies div
                $("#button-more-recs-" +next).fadeOut();
                brain_get_recommendations('div-more-recs-' + next, next);
                brain_log_more_click(next);
            });
        }else{
               $("#" + resultdiv).html(html);
        }
    }
}

function make_shorter(text, maxlength){
    if (text.length > maxlength){
        var sbstring = text.substring(0, maxlength-3);
        return sbstring + '...';
    }else{
        return text;
    }
    
}

function search_omdb_data(movie_imdb_id){
     $.ajax({
        url: "http://www.omdbapi.com/?i=" + movie_imdb_id,
    }).done(function ( data ) {
      var movie = JSON.parse(data);
      if (movie.Response == 'False')
      {
         var notfoundstring = '(No moviedata found for id: ' + movie_imdb_id +  '.)'
      }else{
          //short and long movie title
          $("#movie_title_shorter_" + movie_imdb_id).html(make_shorter(movie.Title + ' (' + movie.Year + ')', 35));
          $(".movie_title_" + movie_imdb_id).html(movie.Title + ' (' + movie.Year + ')');
          $("#movie_hide_link_" + movie_imdb_id).html('<a id="movie_hide_link_a_'+movie_imdb_id+'" class="text-right"  href="#" title="Already seen it? Hate it? Want to hide it? Click and this movie will trouble you no more!">Hide movie</a>' );
          $("#movie_imdb_link_" + movie_imdb_id).html('<a title="Open the IMDb page in a new tab so you can rate the movie or add it to your watchlist. The brain grows smarter with every rating!" id="movie_imdb_link_a_'+movie_imdb_id+'" class="text-right" target="_blank" href="http://www.imdb.com/title/' + movie.imdbID + '">Open IMDb</a>' );
          $("#movie_imdbrating_" + movie_imdb_id).html(movie.imdbRating + ' (' + movie.imdbVotes + ' votes)' );
          $("#movie_director_" + movie_imdb_id).text(movie.Director);
          $("#movie_cast_" + movie_imdb_id).text(movie.Actors);
          $("#movie_genre_" + movie_imdb_id).text(movie.Genre);
          $("#movie_runtime_" + movie_imdb_id).text(movie.Runtime);
          $("#movie_plot_" + movie_imdb_id).text(movie.Plot);
          //prevent imdb hotlinking by downloading the poster and storing it on the webserver
          $.ajax({
            url: brain_movie_poster_path + "?title=" + movie.Title + "&year=" + movie.Year + "&url=" + movie.Poster,
            error: function(){
                         $("#div_recommendations_status").html('<strong>Whoopsy.</strong> There seems to be a problem contacting the brain. Please try again later...');
                    }
          }).done(function ( data ) {
            $(".movie_poster_" + movie_imdb_id).attr('src', data);
          });
      }
    });
}

function generate_html_from_movie_id(movie_imdb_id){
    var html = '';
    html += '\
             <span class="movie-thumbnail popover-dismiss" id="movie_thumbnail_'+movie_imdb_id+'" data-toggle="popover" data-content=""> \
            <img class="img-thumbnail movie-thumbnail-poster movie_poster_'+movie_imdb_id+'" alt="Movie poster" id="" src="'+brain_img_not_found_url+'"></div> \
            <strong><p class="movie-thumbnail-title" id="movie_title_shorter_' + movie_imdb_id + '">Loading...</p></strong> \
        </span> \
            <span id="movie_thumbnail_title_panel_'+movie_imdb_id+'" style="display:none">\
            <strong><span class="movie_title_' + movie_imdb_id + '">Loading...</span></strong><button type="button" id="movie_thumbnail_popover_close_' + movie_imdb_id + '" class="close imdb-link-right movie-thumbnail-popover-close">&times;</button><span class="imdb-link-right" id="movie_imdb_link_' + movie_imdb_id + '"></span> <span class="imdb-link-right" id="movie_hide_link_' + movie_imdb_id + '"></span>\
            </span>\
     <div class="panel panel-default movie-thumbnail-popover" id="movie-panel-'+movie_imdb_id+'">\
          <!-- <div class="panel-heading">\
            <span class="h3 panel-title movie_title_' + movie_imdb_id + '" id="">Loading...</span><span class="imdb-link-right" id="movie_imdb_link_' + movie_imdb_id + '"></span> <span class="imdb-link-right" id="movie_hide_link_' + movie_imdb_id + '"></span>\
          </div> --> \
          <div class="panel-body imdbrain-movie-content-panel"> \
                <div class="row"> \
                    <!-- <div class="col-md-2"><img class="img-responsive img-rounded movie_poster_'+movie_imdb_id+'" alt="Responsive image" id="" src="'+brain_img_not_found_url+'" class="img-polaroid poster"> \</div> -->\
                    <div class="col-md-12"> \
                         <div class="row"> \
                                <div class="col-md-2"><strong>IMDb:</strong></div>\
                                <div class="col-md-10"><span id="movie_imdbrating_'+movie_imdb_id+'"></span></div> \
                         </div> \
                         <div class="row"> \
                                <div class="col-md-2"><strong>Director:</strong></div>\
                                <div class="col-md-10"><span id="movie_director_'+movie_imdb_id+'"></span></div> \
                         </div> \
                         <div class="row"> \
                                <div class="col-md-2"><strong>Cast:</strong></div>\
                                <div class="col-md-10"><span id="movie_cast_'+movie_imdb_id+'"></span></div> \
                         </div> \
                         <div class="row"> \
                                <div class="col-md-2"><strong>Genre:</strong></div>\
                                <div class="col-md-10"><span id="movie_genre_'+movie_imdb_id+'"></span></div> \
                         </div> \
                         <div class="row"> \
                                <div class="col-md-2"><strong>Runtime:</strong></div>\
                                <div class="col-md-10"><span id="movie_runtime_'+movie_imdb_id+'"></span></div> \
                         </div> \
                         <div class="row"> \
                                <div class="col-md-2"><strong>Plot:</strong></div>\
                                <div class="col-md-10"><span class="text-justify" id="movie_plot_'+movie_imdb_id+'"></span></div> \
                         </div> \
                    </div> \
                </div> \
          </div>\
        </div> \
        <script>$(function() { \
                search_omdb_data("'+movie_imdb_id+'");\
                $("#movie_thumbnail_'+movie_imdb_id+'").popover({\
                   trigger: "click",\
                   content: function() { \
                    return $("#movie-panel-'+movie_imdb_id+'").html(); \
                    }, \
                   title: function() { \
                    return $("#movie_thumbnail_title_panel_'+movie_imdb_id+'").html(); \
                    }, \
                   html : true, \
                   placement: function (context, source) { \
                        var position = $(source).position(); \
                        if (position.left > 415) { \
                            return "left";\
                        }\
                        if (position.left < 415) {\
                            return "right";\
                        }\
                        if (position.top < 110){\
                            return "bottom";\
                        }\
                        return "top";\
                    } \
                });\
                 $("#movie_thumbnail_'+movie_imdb_id+'").click(function() { \
                        $("#movie_hide_link_a_'+movie_imdb_id+'").tooltip({placement:"top", container:"body"}); \
                        $("#movie_imdb_link_a_'+movie_imdb_id+'").tooltip({placement:"top", container:"body"}); \
                        if (!is_popular){ \
                           $( "#movie_imdb_link_a_'+movie_imdb_id+'").click(function() { \
                                brain_log_open_imdb_click("'+movie_imdb_id+'"); \
                                return true;\
                            }); \
                          $( "#movie_hide_link_a_'+movie_imdb_id+'").click(function() {\
                                $("#movie_thumbnail_'+movie_imdb_id+'").popover("hide"); \
                                $("#movie_thumbnail_'+movie_imdb_id+'").fadeOut();\
                                brain_log_hide_click("'+movie_imdb_id+'");\
                                return false;\
                            }); \
                      }else{\
                          $("#movie_hide_link_'+movie_imdb_id+'" ).hide();\
                      }\
                      $( "#movie_thumbnail_popover_close_'+movie_imdb_id+'").click(function() {\
                        $("#movie_thumbnail_'+movie_imdb_id+'").popover("hide"); \
                      }); \
                }); \
            });</script>';
            
       
        
        
    return html;
}



function brain_get_filters(){
    //get imdb user from chrome storage
    chrome.storage.sync.get('imdbid', function (result) {
        if(typeof result.imdbid === 'undefined'){
            //error getting user id?
        }else{
            imdb_user = result.imdbid;         
            $.ajax({
                url: brain_api_path + "?a=get_filters&u=" + imdb_user,
                error: function(){
                        $("#div_filters-status").fadeIn();
                         $("#div_filters-status").html('<p class="alert alert-warning"><strong>Whoopsy.</strong> There seems to be a problem contacting the brain. Please try again later...</p>');
                    }
            }).done(function ( data ) {
                if (data == 'untrained.'){
                    //untrained user
                }else{
                    if (data == 'nofilter.'){
                        //no filters set      
                        filters_yes_data = [];
                        filters_no_data = [];                        
                    }else{
                        //filter data available
                        filterdata = JSON.parse(data);
                        filters_yes_data = JSON.parse(filterdata[0]);
                        filters_no_data = JSON.parse(filterdata[1]);
                    }
                    initialize_draggable_genres();
                }
            });
        }
    });
}

function initialize_draggable_genres(){
    //get the genres
    genres = get_all_genres();
    //remove all draggable genres
    $('.drag-genre').remove();
    //add the genres to the correct divs
    $.each(genres, function(key, genre) {
        if ($.inArray(genre, filters_no_data) != -1){
            divgenre = '<span class="drag-genre btn btn-danger">' + genre + '</span>';
            $('#div_filters_no').html($('#div_filters_no').html() + divgenre);
        }else if ($.inArray(genre, filters_yes_data) != -1){
            divgenre = '<span class="drag-genre btn btn-success">' + genre + '</span>';
            $('#div_filters_yes').html($('#div_filters_yes').html() + divgenre);
        }else{
            divgenre = '<span class="drag-genre btn btn-default">' + genre + '</span>';
            $('#div_filters_all').html($('#div_filters_all').html() + divgenre);
        }
    });  
    //make all genres draggable
    $('.drag-genre').draggable();
    //drop on not YES and not NO filter
    $( "body" ).droppable({
         drop: function( event, ui ) {
            initialize_draggable_genres();
         }
    });
    //drop on NO filter
    $( "#div_filters_no" ).droppable({
      //add genre to the no filter
      drop: function( event, ui ) {
         $(ui.draggable).removeClass('btn-default btn-success btn-danger');
         $(ui.draggable).addClass('btn-danger');
         //check if already in the filter
         var thetext = $(ui.draggable).text();
         var theindex = filters_no_data.indexOf(thetext);
         if (theindex < 0) {
            filters_no_data.push($(ui.draggable).text());
            initialize_draggable_genres();
         }
         //console.log('filters_no_data: ' + filters_no_data);
      },
      //remove genre from the no filter
      out: function( event, ui ) {
        $(ui.draggable).removeClass('btn-default btn-success btn-danger');
        $(ui.draggable).addClass('btn-default');
        var thetext = $(ui.draggable).text();
        var theindex = filters_no_data.indexOf(thetext);
        if (theindex > -1) {
            //console.log('removing ' + thetext +  ' from ' + filters_no_data);
            var temp = filters_no_data.splice(theindex, 1);
            //console.log('result: ' + filters_no_data);
            //console.log('filters_no_data: ' + filters_no_data);
        }
      }
    });
    //drop on YES filter
    $( "#div_filters_yes" ).droppable({
      //add genre to the yes filter
      drop: function( event, ui ) {
         $(ui.draggable).removeClass('btn-default btn-success btn-danger');
         $(ui.draggable).addClass('btn-success');
         //check if already in the filter
         var thetext = $(ui.draggable).text();
         var theindex = filters_yes_data.indexOf(thetext);
         if (theindex < 0) {
            filters_yes_data.push($(ui.draggable).text());
            initialize_draggable_genres();          
         }
         //console.log('filters_yes_data: ' + filters_yes_data);
      },
      //remove genre from the yes filter
      out: function( event, ui ) {
        $(ui.draggable).removeClass('btn-default btn-success btn-danger');
        $(ui.draggable).addClass('btn-default');
        var thetext = $(ui.draggable).text();
        var theindex = filters_yes_data.indexOf(thetext);
        if (theindex > -1) {
            var temp = filters_yes_data.splice(theindex, 1);
        }
       // console.log('filters_yes_data: ' + filters_yes_data);
      }
    });
    
     $( "#link_filters_clear").click(function() {
        filters_yes_data = [];
        filters_no_data = [];
        initialize_draggable_genres();
    }); 
    
}


function brain_get_weights(){
        $("#div_weights_status").html('<strong>Loading.</strong> Just a sec...');
        $("#div_weights_status").fadeIn();
    //get imdb user from chrome storage
    chrome.storage.sync.get('imdbid', function (result) {
        if(typeof result.imdbid === 'undefined'){
            //error getting user id?

        }else{
            imdb_user = result.imdbid;         
            $.ajax({
                url: brain_api_path + "?a=get_weights&u=" + imdb_user,
                error: function(){
                    $("#div_weights_status").html('<strong>Whoopsy.</strong> There seems to be a problem contacting the brain. Please try again later...');
                    }
            }).done(function ( data ) {
                if (data == 'untrained.'){
                    //should not happen since the settings button is disabled
                }else if (data === 'problem.'){
                     $("#div_weights_status").html('<strong>Whoopsy.</strong> There seems to be a problem contacting the brain. Please try again later...');
                }else{
                    $("#div_weights_status").fadeOut();
                    set_weights_datastructure(data);
                    generate_sliders_html();        
                }
            });
        }
    });
}


function get_all_genres()
{
    var genres = ["Action","Adult","Adventure","Animation","Biography","Comedy","Crime","Documentary","Drama","Family","Fantasy","Film-Noir","History","Horror","Music","Musical","Mystery","News","Reality-TV","Romance","Sci-Fi","Short","Sport","Thriller","War","Western"];
    return genres;
}


function brain_reset_weights(){
    $("#div_recommendations_info").hide();
    chrome.storage.sync.get('imdbid', function (result) {
        if(typeof result.imdbid === 'undefined'){
            //error getting user id?
            $("#div_recommendations_status").show()
            $("#div_recommendations_status").html('<strong>Logged out?</strong> You seem to have logged out. Please login to make any changes.');
        }else{
            imdb_user = result.imdbid;         
             $.ajax({
                url: brain_api_path + "?a=reset_weights&u="+imdb_user,
                error: function(){
                         $("#div_recommendations_status").html('<strong>Whoopsy.</strong> There seems to be a problem contacting the brain. Please try again later...');
                    }
            }).done(function ( data ) {
                $("#div_recommendations_status").html('<strong>Check!</strong> Your settings are restored.');
                weights = [];
                brain_get_recommendations();
            });
        }
    });
}

function brain_set_weights(){
    $("#div_recommendations_info").hide();
    chrome.storage.sync.get('imdbid', function (result) {
        if(typeof result.imdbid === 'undefined'){
            //error getting user id?
            $("#div_recommendations_status").show()
            $("#div_recommendations_status").html('<strong>Logged out?</strong> You seem to have logged out. Please login to make any changes.');
        }else{
            imdb_user = result.imdbid;         
            thebrainweights = get_brainformatted_weights();
             $.ajax({
                url: brain_api_path + "?a=set_weights&u="+imdb_user +"&w=" + thebrainweights ,
                error: function(){
                         $("#div_recommendations_status").html('<strong>Whoopsy.</strong> There seems to be a problem contacting the brain. Please try again later...');
                    }
            }).done(function ( data ) {
                if (data == 'done.'){
                    $("#div_recommendations_status").html('<strong>Check!</strong> Your settings are saved.');
                    brain_get_recommendations();
                }else{
                    //do nothing
                }
            });
        }
    });
}

/*
    The filters
*/
function brain_set_filters(){
    chrome.storage.sync.get('imdbid', function (result) {
        if(typeof result.imdbid === 'undefined'){
            //error getting user id?
            $("#div_recommendations_status").show()
            $("#div_recommendations_status").html('<strong>Logged out?</strong> You seem to have logged out. Please login and come back here.');
        }else{
            imdb_user = result.imdbid;         
            filters_yes = get_brain_formatted_filters_yes();
            filters_no = get_brain_formatted_filters_no();
             $.ajax({
                url: brain_api_path + "?a=set_filters&u="+imdb_user +"&fy=" + filters_yes + "&fn=" + filters_no ,
                error: function(){
                         $("#div_recommendations_status").html('<strong>Whoopsy.</strong> There seems to be a problem contacting the brain. Your filter settings could not be saved. Please try again later...');
                    }
            }).done(function ( data ) {
                $("#div_recommendations_status").html('<strong>Check!</strong> Your filters are saved.');
                brain_get_recommendations();
            });
        }
    });
}

function get_brain_formatted_filters_yes()
{
    return JSON.stringify(filters_yes_data);
}

function get_brain_formatted_filters_no()
{
    return JSON.stringify(filters_no_data);
}

function get_brainformatted_weights(){
    json = '';
    $.each(weights, function(key, value) {
        //if not the first time, add ,
        if (json != ''){
            json += '-' 
        }
        json +=  key ;
        json += '_' ;
        json += value
    });
    json += ''
    return json;
}

function set_weights_datastructure(weights_string){
    /*
        Convert string to JSON format
    */
    weights_string = weights_string.replace(/-/g,', "');
    weights_string = weights_string.replace(/_/g,'": ');
    weights_string = '{"' + weights_string + '}';
    //console.log('weights_string: ' + weights_string);
    weights = JSON.parse(weights_string);
}

//http://stackoverflow.com/questions/5745960/javascript-dictionary-with-names
function substitute_algorithm_names(algorithm){
    var myMappings = [
    { algo: "MatrixFactorization", expl: "The brain's mathematical opinion" },
    { algo: "UserKNN", expl: "Similar people's opinions" },
    { algo: "ItemKNN", expl: "Use movies similar to my rated movies" },
    { algo: "MyRecentMovies", expl: "Recent movies" },
    { algo: "MyLogPopular", expl: "Popular movies" },
    { algo: "MyUbcf", expl: "Similar people's opinions" }
];

    for (var i = 0; i < myMappings.length; i += 1) {
        if (myMappings[i].algo == algorithm){
            return myMappings[i].expl;
        }
    }
    //if no mapping found, return name of the algorithm
    return algorithm
}

//http://stackoverflow.com/questions/5745960/javascript-dictionary-with-names
function substitute_algorithm_tooltips(algorithm){
    var myMappings = [
    { algo: "MatrixFactorization", tip: "The brain is so smart it can calculate what you like. Do you trust its opinion? " },
    { algo: "MyRecentMovies", tip: "Do you find it important how recent a movie is? " },
    { algo: "MyLogPopular", tip: "What about the popularity of a movie? Popular movies are movies that a lot of people liked. Is that important for you? " },
    { algo: "MyUbcf", tip: "The brain can find other people who have rated the same movies as you and show you what they liked. " }
];

    for (var i = 0; i < myMappings.length; i += 1) {
        if (myMappings[i].algo == algorithm){
            return myMappings[i].tip;
        }
    }
    //if no mapping found, return name of the algorithm
    return algorithm
}


function generate_sliders_html(){
    var html = '';
     $.each(weights, function(algo, weight) {
        html += '\
        <div class="row"> \
            <div class="col-md-1"></div>\
            <div id="label-algo-expl-'+algo+'"class="col-md-5" title="'+substitute_algorithm_tooltips(algo)+'">' + substitute_algorithm_names(algo) + '</div> \
            <div class="col-md-6">\
            <div id="algo-slider-'+algo+'" title="'+substitute_algorithm_tooltips(algo)+'" class="dragdealer rounded-cornered" style="background:#cecece;width:400px;"> \
                        <div id="algo-slider-handle-'+algo+'" class="red-bar handle">drag me</div> \
                    </div>\
            </div> \
        </div><br>';
        //http://stackoverflow.com/questions/7433824/how-to-get-current-loop-iteration-from-anonymous-function-within-the-for-loop
        html += " <script> (function(key, val){ \
                   $('#algo-slider-handle-'+key).text(Math.floor(val * 100) + '');\
                            new Dragdealer('algo-slider-'+key, {x: val, \
                                                            animationCallback : function(x, y){ algo_weights_moved(key, x); }}); \
                        })('"+algo+"', "+weight+"); \
    $('#label-algo-expl-"+algo+"').tooltip({placement:'bottom', container:'#div_modal_weights'}) ;\
    $('#algo-slider-"+algo+"').tooltip({placement:'bottom', container:'#div_modal_weights'}) ;\
        </script>";
    });  
     $("#div_weights_sliders").html(html);
}

function algo_weights_moved(key, value)
{
    $('#algo-slider-handle-'+key).text(Math.floor(value * 100) + '');
    weights[key] = value;
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
