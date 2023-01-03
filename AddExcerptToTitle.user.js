// ==UserScript==
// @name            Add Excerpt To Title
// @namespace       https://meta.stackexchange.com/users/158100/rene
// @version         0.6
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
    const Server = {
        host: 'https://api.stackexchange.com',
        version: '2.3'
    };
    const DefaultParams = {
        key: 'Kdg9mxpgwALz)u5ubehUFw(('
    };
    function apiBuilder(endpoint, params) {
        let urlPath = `${Server.host}/${Server.version}/${endpoint}`;
        params = Object.assign(params, DefaultParams);
        if (params !== undefined) {
            const query = [];
            for (const prop in params) {
                if (params.hasOwnProperty(prop)) {
                    const key = prop;
                    if (typeof params[key] === 'string') {
                        const value = params[key];
                        query.push(prop + '=' + encodeURI(value));
                    }
                    else {
                        const value = params[key];
                        query.push(prop + '=' + value);
                    }
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
    class API {
        constructor() {
            this.backlog = [];
            this.getfunction = this.realget;
        }
        cacheget(url, callback) {
            this.backlog.push({ url: url, callback: callback });
        }
        handleBacklog() {
            const item = this.backlog.shift();
            if (item !== undefined) {
                console.log('from cache');
                this.realget(item.url, item.callback);
            }
            if (this.backlog.length === 0) {
                this.getfunction = this.realget;
            }
        }
        handleLoad(callback, xhr) {
            const handler = () => {
                const response = JSON.parse(xhr.responseText);
                let backoff = response.backoff || 0;
                if (backoff > 0) {
                    console.log('backoff recv');
                    this.getfunction = this.cacheget;
                }
                if (response.error_id === 502) {
                    console.log(response.error_message);
                    this.getfunction = this.cacheget;
                    backoff = 120;
                }
                setTimeout(this.handleBacklog, backoff * 1000);
                callback(response);
            };
            return handler;
        }
        realget(url, callback) {
            const xhr = new XMLHttpRequest();
            xhr.addEventListener('error', function () {
                console.log(xhr.status);
            });
            xhr.addEventListener('load', this.handleLoad(callback, xhr));
            xhr.open('GET', url);
            xhr.send();
        }
        get(url, callback) {
            this.getfunction(url, callback);
        }
    }
    const SEApi = new API();
    function htmlEncoder(html) {
        const text = document.createElement('span');
        text.innerHTML = html;
        return text.textContent;
    }
    function bindMouseOver(api_site_parameter) {
        $('div.js-post-summary h3 > a').one('mouseover', function () {
            const questionTitleLink = $(this), id = questionTitleLink.parent().parent().parent().prop('id'), idparts = id.split('-');
            if (idparts.length > 2) {
                SEApi.get(apiQuestionBuilder(api_site_parameter, idparts[2]), function (data) {
                    if (data.items && data.items.length > 0) {
                        const first = data.items[0];
                        const excerpt = first.body_markdown.substring(0, 200);
                        const html = htmlEncoder(excerpt);
                        questionTitleLink.prop('title', html);
                    }
                    else {
                        questionTitleLink.prop('title', 'no question found');
                    }
                });
                questionTitleLink.prop('title', 'loading ' + id);
            }
        });
    }
    function findApiSiteParameter(items) {
        for (const site of items) {
            if (site.site_url.indexOf(document.location.hostname) !== -1) {
                bindMouseOver(site.api_site_parameter);
                return site.api_site_parameter;
            }
        }
        return null;
    }
    function start() {
        const storageKey = 'SE-add-titles';
        let cachedSites;
        const addTitles = localStorage.getItem(storageKey);
        if (addTitles !== null) {
            cachedSites = JSON.parse(addTitles);
        }
        const day = 86400000;
        if ((cachedSites === undefined || cachedSites === null) ||
            (cachedSites.cachedDate && (cachedSites.cachedDate + day) < Date.now())) {
            SEApi.get(apiSitesBuilder(), function (data) {
                if (data.items && data.items.length) {
                    const site = findApiSiteParameter(data.items);
                    localStorage.setItem(storageKey, JSON.stringify({ cachedDate: Date.now(), site: site }));
                }
            });
        }
        else {
            bindMouseOver(cachedSites.site);
        }
    }
    start();
})();
