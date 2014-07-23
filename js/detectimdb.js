$(".rating.rating-list").click(function() {
    chrome.storage.sync.get('imdbid', function (result) {
        if(typeof result.imdbid === 'undefined'){
            // Nothing to do, user is not logged in.
        }else{
            imdb_user = result.imdbid;
            // Notify the brain!
             $.ajax({
                url: brain_api_path + "?a=refresh_ratings&u=" + imdb_user,
            }).done(function ( data ) {
                // The brain knows
                //alert('The brain grows wiser with every rating!');
                get_num_ratings(result.imdbid);
            });
        }
    });
}); 

/*
    Detect the user id from the HTML
*/
$( document ).ready(function() {
    var link = $('.navCategory.singleLine:not(.watchlist)');
    var inlink = $(link).find('a[href*="/user/ur"]');
    
    if(inlink.length >0){
        // If user is logged in
        var imdb_username =  $.trim(inlink.text());
        var imdb_id = inlink.attr('href');
        var imdb_id = imdb_id.match(/ur[0-9]*/g);
        //Save the possible imdb_id and username
        //console.log('TheBrain: ' + imdb_id);
        //console.log('TheBrain: ' + imdb_username);
        //
        /*
            Only save the maybe imdb username if user not logged in
        */
        
         chrome.storage.sync.get('imdbid', function (result) {
            if(typeof result.imdbid === 'undefined'){
                //user is not logged in.
                get_num_ratings(imdb_id);
                chrome.storage.sync.set({'maybe_imdbusername': imdb_username, 'maybe_imdbid': imdb_id});
               
            }else{
                //console.log('user logged in, so checking num imdb ratings ...');
                get_num_ratings(result.imdbid);
            }
             
        });
        
        
    }else{
        //console.log('TheBrain: no user detected.');
    }
});

function get_num_ratings(imdb_user){
    $.ajax({
        url: "http://www.imdb.com/list/export?list_id=ratings&author_id=" + imdb_user,
    }).done(function ( data ) {
        //console.log(data);
        var lines = data.split("\n").length - 2;
        chrome.storage.sync.set({'num_imdb_ratings': ''});
        chrome.storage.sync.set({'num_imdb_ratings': lines + ''});
        
       // console.log('set num_imdb_ratings as: ' + lines);
        
       
        
        // The brain knows
        //alert('The brain grows wiser with every rating!');
    });
}
