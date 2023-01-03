
/*global $ */

(function() {
    'use strict'

    const Server = {
        host: 'https://api.stackexchange.com',
        version: '2.3'
    }

    const DefaultParams:ApiParams = {
        key: 'Kdg9mxpgwALz)u5ubehUFw(('
    }

    type ApiParamsKeys = keyof ApiParams;

    type ApiParams = {
        filter?:string,
        key?:string,
        pagesize?:number,
        site?:string,
        order?:string,
        page?:number,
        sort?:string
    }

    // build api url for an endpoint and its optional parameters
    function apiBuilder(endpoint:string, params:ApiParams) {
        let urlPath = `${Server.host}/${Server.version}/${endpoint}`
        params = Object.assign(params, DefaultParams)
        if (params !== undefined)  {
            const query = []
            for(const prop in params) {
                if (params.hasOwnProperty(prop)) {
                    const key = prop as ApiParamsKeys
                    if (typeof params[key] === 'string') {
                        const value = params[key] as string
                        query.push( prop + '=' + encodeURI(value))
                    } else {
                        const value = params[key]
                        query.push( prop + '=' + value)
                    }
                }
            }
            urlPath = urlPath + '?' + query.join('&')
        }
        return urlPath
    }

    // build url for /sites api endpoint
    function apiSitesBuilder() {
        return apiBuilder(
            'sites', 
            {
                pagesize: 500,
                filter: '!*L6SijN-EORrs4rs'
            })
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
            })
    }

    type APIGetFunction = (url:string, callback:CallableFunction ) => void
    type APIWorker = { get:APIGetFunction }
    // do a get on the API for the given url
    // and invoke the callback with the JSON result
    function API():APIWorker {

        const backlog:Array<{url:string, callback:CallableFunction}> = []
        let getfunction: APIGetFunction

        // simply push the params on the queue
        function cacheget(url:string, callback:CallableFunction) {
            backlog.push({ url: url, callback: callback})
        }

        // this makes the actual xhr call
        function realget(url:string, callback:CallableFunction) {
            const xhr = new XMLHttpRequest()

            // handles pending calls by invoking realget
            // and resetting the getfunction when 
            // the backlog is cleared
            function handleBacklog() {
                const item = backlog.shift()
                if (item !== undefined) {
                    console.log('from cache')
                    // handle this single item
                    realget(item.url, item.callback)
                } 
                if (backlog.length === 0) {
                    // if the backlog is empty 
                    // use realget for the next call
                    getfunction = realget
                }
            }

            xhr.addEventListener('error', function () {
                console.log(xhr.status)
            })

            xhr.addEventListener('load', function () {
                const response = JSON.parse(xhr.responseText)
                let backoff = response.backoff || 0
                // backoff received
                if (backoff > 0) {
                    // start caching calls
                    console.log('backoff recv')
                    getfunction = cacheget
                }
                if (response.error_id === 502) {
                    console.log(response.error_message)
                    getfunction = cacheget
                    backoff = 120
                }
                // process pending backlog
                setTimeout(handleBacklog, backoff * 1000)
                // invoke the callback
                callback(response)
            })
            xhr.open('GET', url)
            xhr.send()
        }

        // calls either xhr or the cache
        function get(url:string, callback:CallableFunction):void
        {
            getfunction(url, callback)
        }

        // initially we start with a realget
        getfunction = realget

        // return the public api
        return {
            get: get
        }
    }

    const SEApi = new (API as any)() as APIWorker // keep an instance

    function htmlEncoder(html:string):string | null {
        // html encoding
        const text = document.createElement('span')
        text.innerHTML = html
        return text.textContent
    }

    type ApiQuestion = {body_markdown:string}
    // hook the mouseover event on the titles
    function bindMouseOver(api_site_parameter:string) {
        $('div.js-post-summary h3 > a').one('mouseover', function () {
            const questionTitleLink = $(this), 
                id = questionTitleLink.parent().parent().parent().prop('id'),
                idparts = id.split('-')
            if (idparts.length>2) {
                // call the api for the question to get the body
                SEApi.get(apiQuestionBuilder(api_site_parameter, idparts[2]), function (data:ApiWrapper<ApiQuestion>) {
                    if (data.items && data.items.length > 0) {
                        // html encoding
                        const first = data.items[0]
                        const excerpt = first.body_markdown.substring(0,200)
                        const html = htmlEncoder(excerpt)
                        // set title
                        questionTitleLink.prop(
                            'title', 
                            html)
                    } else {
                        questionTitleLink.prop(
                            'title', 
                            'no question found')
                    }
                })
                questionTitleLink.prop('title', 'loading ' + id)
            }
        })
    }

    type ApiSite = {site_url:string, api_site_parameter:string}
    // match the  hostname against site-url to find api_parameter
    function findApiSiteParameter(items:Array<ApiSite>) {
        for(const site of items) {
            if (site.site_url.indexOf(document.location.hostname) !== -1) {
                bindMouseOver(site.api_site_parameter)
                return site.api_site_parameter
            }
        }
        return null
    }

    type ApiWrapper<T> = { items:Array<T>}
    type CachedSite = { cachedDate: number , site: string  };

    function start() {
        const storageKey = 'SE-add-titles'
        // cache site list
        let cachedSites: CachedSite | undefined
        const addTitles = localStorage.getItem(storageKey)
        if (addTitles !== null) { 
            cachedSites = JSON.parse(addTitles)
        }
        
        const day = 86400000 // in ms
        if ((cachedSites === undefined || cachedSites === null ) ||
            (cachedSites.cachedDate && (cachedSites.cachedDate + day) < Date.now() )) {
            // fetch sites
            SEApi.get(apiSitesBuilder(), function (data:ApiWrapper<ApiSite>) {
                if (data.items && data.items.length) {
                    const site = findApiSiteParameter(data.items)
                    localStorage.setItem(storageKey, JSON.stringify({ cachedDate: Date.now() , site: site  }))
                }
            })
        } else {
            bindMouseOver(cachedSites.site)
        }
    }

    start()
})()