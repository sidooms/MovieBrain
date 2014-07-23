chrome.storage.onChanged.addListener(function(changes, namespace) {
   //   console.log('storage changed!');
    /*
        The ! indicating that user can now be logged in...
    */
    chrome.storage.sync.get('imdbid', function (result) {
        if(typeof result.imdbid === 'undefined'){
          //  console.log('user is not logged in');
            //user is not logged in.
            chrome.storage.sync.get(["maybe_imdbid","maybe_imdbusername"], function (result) {
                if(typeof result.maybe_imdbid === 'undefined'){
                    //user is not logged in AND no maybe user found
                    chrome.browserAction.setBadgeText({
                        text: ''
                    });
                }else{
                    //maybe user IS found
                    chrome.browserAction.setBadgeBackgroundColor({color:'#5cb85c'});
                    chrome.browserAction.setBadgeText({text: '...'});
                }
            });
        }else{
            //console.log('user is logged in');
            //console.log(changes);
            //user is logged in.
           
           
                chrome.storage.sync.get('num_imdb_ratings', function (result) {
                    if (typeof result.num_imdb_ratings === 'undefined' || result.num_imdb_ratings === ''){
                        //not available
                       // alert('num_imdb_ratings not available');
                        chrome.browserAction.setBadgeText({text:''}); 
                        chrome.browserAction.setTitle({title:'MovieBrain - Find the right movie for you!'});
                    }else{
                      chrome.browserAction.setBadgeBackgroundColor({color:'#000'});
                    chrome.browserAction.setBadgeText({text: result.num_imdb_ratings + ''});      
                    chrome.browserAction.setTitle({title:'MovieBrain - using ' + result.num_imdb_ratings + ' ratings'});  
                    }
                });       
            
            
           
        }
    });
    
});

        
    
