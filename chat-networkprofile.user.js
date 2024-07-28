// ==UserScript==
// @name         Add network link to chat user
// @namespace    https://meta.stackexchange.com/users/158100/rene
// @version      0.1
// @description  link to network for user
// @author       rene
// @match        https://chat.stackexchange.com/users/*
// @match        https://chat.meta.stackexchange.com/users/*
// @match        https://chat.stackoverflow.com/users/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=stackexchange.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const key = 'rl_DkuzjcopQMy5uxvWKku8fc6Dm'

    function buildApiUrl(site, userid) {
        const filter = getAccountIdFilter()
        const key = getKey();
        return `https://api.stackexchange.com/2.3/users/${userid}?order=desc&sort=reputation&site=${site}&${filter}&${key}`
    }

    function getKey() {
        return `key=${key}`
    }
    function getAccountIdFilter() {
        return `filter=!-.wu_WIxk_kO`
    }

    function buildNetworkLink(accountId) {
        return `https://stackexchange.com/users/${accountId}`
    }

    function createLink(link) {
        const a = document.createElement('a');
        a.href = link;
        a.target = '_blank';
        a.textContent = 'network user';
        return a;
    }

    function createSpan(linkElement) {
        const span = document.createElement('span');
        span.appendChild(document.createTextNode(' ('));
        span.appendChild(linkElement);
        span.appendChild(document.createTextNode(')'));
        return span
    }

    function appendLink(link) {
        parentUser.appendChild(createSpan(createLink(link)));
    }

    // get the parent user table cell, there is one
    const parentUser = Array.from(document.getElementsByClassName('user-keycell')).filter( a => a.textContent === 'parent user')[0]
    // get the link to the user from the next table cell
    const parentUserValue = parentUser.nextSibling.getElementsByTagName('a')[0];
    const splitSiteAndUser = /^https:\/\/(?<host>[\w|\.]+?)\/users\/(?<userid>\d+)/;
    const match = splitSiteAndUser.exec(parentUserValue.href);
    if (match) {
        const url = buildApiUrl(match.groups.host, match.groups.userid);
        fetch(url)
          .then( resp => resp.json())
          .then( data => data.items ?? [])
          .then( items => items.length > 0 ? items[0] : {})
          .then( item => buildNetworkLink(item.account_id))
          .then( link => appendLink(link))
          .catch( err => console.log)
    }
})();
