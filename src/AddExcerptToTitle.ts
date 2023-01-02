
/*global $ */

(function() {
    'use strict';

    // build api url for an endpoint and its optional parameters
    function apiBuilder(endpoint:string, params:any) {
        var url = 'https://api.stackexchange.com/2.3/',
            urlPath = url + endpoint;
        params.key ='Kdg9mxpgwALz)u5ubehUFw((';
        if (params !== undefined)  {
            var query = [];
            for(var prop in params) {
                if (params.hasOwnProperty(prop)) {
                    query.push( prop + '=' + encodeURI(params[prop]));
                }
            }
            urlPath = urlPath + '?' + query.join('&');
        }
        return urlPath;
    }

    // build url for /sites api endpoint
    function apiSitesBuilder() {
        return apiBuilder(
            'sites', 
            {
                pagesize: 500,
                filter: '!*L6SijN-EORrs4rs'
            });
    }

    // build url for /Question endpoint
    function apiQuestionBuilder(site:string, qid:number) {
        return apiBuilder(
            'questions/' + qid, 
            {
                site: site,
                order: 'asc',
                page: 1,
                pagesize: 100,
                sort: 'activity',
                filter: '!w-2nxYBnAP3ZrgppIq'
            });
    }

    type APIWorker = { get:Function }
    // do a get on the API for the given url
    // and invoke the callback with the JSON result
    function API():APIWorker {

        var backlog:Array<{url:string, callback: VoidFunction}> = [],
            getfunction: Function;

        // simply push the params on the queue
        function cacheget(url:string, callback:VoidFunction) {
            backlog.push({ url: url, callback: callback});
        }

        // this makes the actual xhr call
        function realget(url:string, callback:CallableFunction) {
            var xhr = new XMLHttpRequest();

            // handles pending calls by invoking realget
            // and resetting the getfunction when 
            // the backlog is cleared
            function handleBacklog() {
                var item = backlog.shift();
                if (item !== undefined) {
                    console.log('from cache');
                    // handle this single item
                    realget(item.url, item.callback);
                } 
                if (backlog.length === 0) {
                    // if the backlog is empty 
                    // use realget for the next call
                    getfunction = realget;
                }
            }

            xhr.addEventListener('error', function () {
                console.log(xhr.status);
            });

            xhr.addEventListener('load', function () {
                var response = JSON.parse(xhr.responseText);
                var backoff = response.backoff || 0;
                // backoff received
                if (backoff > 0) {
                    // start caching calls
                    console.log('backoff recv');
                    getfunction = cacheget;
                }
                if (response.error_id === 502) {
                    console.log(response.error_message);
                    getfunction = cacheget;
                    backoff = 120;
                }
                // process pending backlog
                setTimeout(handleBacklog, backoff * 1000);
                // invoke the callback
                callback(response);
            });
            xhr.open('GET', url);
            xhr.send();
        }

        // calls either xhr or the cache
        function get(url:string, callback:VoidFunction)
        {
            getfunction(url, callback);
        }

        // initially we start with a realget
        getfunction = realget;

        // return the public api
        return {
            get: get
        };
    }

    var SEApi = new (API as any)() as APIWorker; // keep an instance

    // hook the mouseover event on the titles
    function bindMouseOver(api_site_parameter:string) {
        $('div.js-post-summary h3 > a').one('mouseover', function (e) {
            var questionTitleLink = $(this), 
                id = questionTitleLink.parent().parent().parent().prop('id'),
                idparts = id.split('-');
            if (idparts.length>2) {
                // call the api for the question to get the body
                SEApi.get(apiQuestionBuilder(api_site_parameter, idparts[2]), function (data:any) {
                    if (data.items && data.items.length > 0) {
                        // html encoding
                        var text = document.createElement('span');
                        text.innerHTML = data.items[0].body_markdown.substring(0,200);
                        // set title
                        questionTitleLink.prop(
                            'title', 
                            text.textContent);
                    }
                });
                $(this).prop('title', 'loading ' + id);
            }
        });
    }

    // match the  hostname against site-url to find api_parameter
    function findApiSiteParameter(items:Array<any>) {
        var i, site;
        for(i = 0; i < items.length; i = i + 1) {
            site = items[i];
            if (site.site_url.indexOf(document.location.hostname) !== -1) {
                bindMouseOver(site.api_site_parameter);
                return site.api_site_parameter;
            }
        }
        return null;
    }

    function start() {
        // cache site list
        var cachedSites:any = localStorage.getItem('SE-add-titles');
        if (cachedSites !== undefined) cachedSites = JSON.parse(cachedSites);
        
        var day = 86400000; // in ms
        debugger;
        if ((cachedSites === undefined || cachedSites === null ) || (cachedSites.items ) ||
        (cachedSites.cacheDate && (cachedSites.cacheDate + day) < Date.now() )) {
            // fetch sites
            SEApi.get(apiSitesBuilder(), function (data:any) {
                if (data.items && data.items.length) {
                    var site = findApiSiteParameter(data.items);
                    localStorage.setItem('SE-add-titles', JSON.stringify({ cachedDate: Date.now() , site: site  }));
                }
            });
        } else {
            bindMouseOver(cachedSites.site);
        }
    }

    start();
})();