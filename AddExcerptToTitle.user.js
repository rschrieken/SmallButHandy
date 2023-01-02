// ==UserScript==
// @name            Add Excerpt To Title
// @namespace       https://meta.stackexchange.com/users/158100/rene
// @version         0.4
// @description     Add titles to links on the frontpage of an SE site
// @author          rene
// @match           https://stackoverflow.com/
// @match           https://serverfault.com/
// @match           https://superuser.com/
// @match           https://*.stackexchange.com/
// @match           https://askubuntu.com/
// @match           https://stackapps.com/
// @match           https://mathoverflow.net/
// @match           https://pt.stackoverflow.com/
// @match           https://ja.stackoverflow.com/
// @match           https://ru.stackoverflow.com/
// @match           https://es.stackoverflow.com/
// @match           https://meta.stackoverflow.com/
// @match           https://meta.serverfault.com/
// @match           https://meta.superuser.com/
// @match           https://meta.askubuntu.com/
// @match           https://meta.mathoverflow.net/
// @match           https://pt.meta.stackoverflow.com/
// @match           https://ja.meta.stackoverflow.com/
// @match           https://ru.meta.stackoverflow.com/
// @match           https://es.meta.stackoverflow.com/
// @updateURL       https://github.com/rschrieken/SmallButHandy/raw/master/AddExcerptToTitle.user.js
// @downloadURL     https://github.com/rschrieken/SmallButHandy/raw/master/AddExcerptToTitle.user.js
// @grant           none
// ==/UserScript==

(function () {
    'use strict';
    function apiBuilder(endpoint, params) {
        var url = 'https://api.stackexchange.com/2.3/', urlPath = url + endpoint;
        params.key = 'Kdg9mxpgwALz)u5ubehUFw((';
        if (params !== undefined) {
            var query = [];
            for (var prop in params) {
                if (params.hasOwnProperty(prop)) {
                    query.push(prop + '=' + encodeURI(params[prop]));
                }
            }
            urlPath = urlPath + '?' + query.join('&');
        }
        return urlPath;
    }
    function apiSitesBuilder() {
        return apiBuilder('sites', {
            pagesize: 500,
            filter: '!*L6SijN-EORrs4rs'
        });
    }
    function apiQuestionBuilder(site, qid) {
        return apiBuilder('questions/' + qid, {
            site: site,
            order: 'asc',
            page: 1,
            pagesize: 100,
            sort: 'activity',
            filter: '!w-2nxYBnAP3ZrgppIq'
        });
    }
    function API() {
        var backlog = [], getfunction;
        function cacheget(url, callback) {
            backlog.push({ url: url, callback: callback });
        }
        function realget(url, callback) {
            var xhr = new XMLHttpRequest();
            function handleBacklog() {
                var item = backlog.shift();
                if (item !== undefined) {
                    console.log('from cache');
                    realget(item.url, item.callback);
                }
                if (backlog.length === 0) {
                    getfunction = realget;
                }
            }
            xhr.addEventListener('error', function () {
                console.log(xhr.status);
            });
            xhr.addEventListener('load', function () {
                var response = JSON.parse(xhr.responseText);
                var backoff = response.backoff || 0;
                if (backoff > 0) {
                    console.log('backoff recv');
                    getfunction = cacheget;
                }
                if (response.error_id === 502) {
                    console.log(response.error_message);
                    getfunction = cacheget;
                    backoff = 120;
                }
                setTimeout(handleBacklog, backoff * 1000);
                callback(response);
            });
            xhr.open('GET', url);
            xhr.send();
        }
        function get(url, callback) {
            getfunction(url, callback);
        }
        getfunction = realget;
        return {
            get: get
        };
    }
    var SEApi = new API();
    function bindMouseOver(api_site_parameter) {
        $('div.js-post-summary h3 > a').one('mouseover', function (e) {
            var questionTitleLink = $(this), id = questionTitleLink.parent().parent().parent().prop('id'), idparts = id.split('-');
            if (idparts.length > 2) {
                SEApi.get(apiQuestionBuilder(api_site_parameter, idparts[2]), function (data) {
                    if (data.items && data.items.length > 0) {
                        var text = document.createElement('span');
                        text.innerHTML = data.items[0].body_markdown.substring(0, 200);
                        questionTitleLink.prop('title', text.textContent);
                    }
                });
                $(this).prop('title', 'loading ' + id);
            }
        });
    }
    function findApiSiteParameter(items) {
        var i, site;
        for (i = 0; i < items.length; i = i + 1) {
            site = items[i];
            if (site.site_url.indexOf(document.location.hostname) !== -1) {
                bindMouseOver(site.api_site_parameter);
                return site.api_site_parameter;
            }
        }
        return null;
    }
    function start() {
        var cachedSites = localStorage.getItem('SE-add-titles');
        if (cachedSites !== undefined)
            cachedSites = JSON.parse(cachedSites);
        var day = 86400000;
        debugger;
        if ((cachedSites === undefined || cachedSites === null) || (cachedSites.items) ||
            (cachedSites.cacheDate && (cachedSites.cacheDate + day) < Date.now())) {
            SEApi.get(apiSitesBuilder(), function (data) {
                if (data.items && data.items.length) {
                    var site = findApiSiteParameter(data.items);
                    localStorage.setItem('SE-add-titles', JSON.stringify({ cachedDate: Date.now(), site: site }));
                }
            });
        }
        else {
            bindMouseOver(cachedSites.site);
        }
    }
    start();
})();
