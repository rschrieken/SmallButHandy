// ==UserScript==
// @name         set selected site
// @namespace    https://meta.stackexchange.com/users/158100/rene
// @version      0.1
// @description  set selected site in league
// @author       rene
// @match        https://stackexchange.com/leagues/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var url = document.location.pathname.split('/');
    if (url.length >2) {
        $('.fl select option[value^="/' + url[1]+'/'+ url[2] + '/"').prop('selected','selected');
    }
})();
