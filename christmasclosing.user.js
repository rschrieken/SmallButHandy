// ==UserScript==
// @name         christmas tree for on hold and closed questions
// @namespace    https://stackoverflow.com/users/578411/rene
// @version      0.6
// @description  add span and css to give a better indication for closed questions
// @author       rene
// @downloadURL  https://github.com/rschrieken/SmallButHandy/raw/master/christmasclosing.user.js
// @updateURL    https://github.com/rschrieken/SmallButHandy/raw/master/christmasclosing.user.js
// @match        https://stackoverflow.com/questions
// @match        https://stackoverflow.com/questions/tagged/*
// @match        https://stackoverflow.com/search?*
// @match        https://stackoverflow.com/users/*?tab=votes*
// @match        https://superuser.com/questions
// @match        https://superuser.com/questions/tagged/*
// @match        https://superuser.com/search?*
// @match        https://superuser.com/users/*?tab=votes*
// @match        https://serverfault.com/questions
// @match        https://serverfault.com/questions/tagged/*
// @match        https://serverfault.com/search?*
// @match        https://serverfault.com/users/*?tab=votes*
// @match        https://askubuntu.com/questions
// @match        https://askubuntu.com/questions/tagged/*
// @match        https://askubuntu.com/search?*
// @match        https://askubuntu.com/users/*?tab=votes*
// @match        https://mathoverflow.com/questions
// @match        https://mathoverflow.com/questions/tagged/*
// @match        https://mathoverflow.com/search?*
// @match        https://mathoverflow.com/users/*?tab=votes*
// @match        https://stackapps.com/questions
// @match        https://stackapps.com/questions/tagged/*
// @match        https://stackapps.com/search?*
// @match        https://stackapps.com/users/*?tab=votes*
// @match        https://meta.stackoverflow.com/questions
// @match        https://meta.stackoverflow.com/questions/tagged/*
// @match        https://meta.stackoverflow.com/search?*
// @match        https://meta.stackoverflow.com/users/*?tab=votes*
// @match        https://meta.superuser.com/questions
// @match        https://meta.superuser.com/questions/tagged/*
// @match        https://meta.superuser.com/search?*
// @match        https://meta.superuser.com/users/*?tab=votes*
// @match        https://meta.serverfault.com/questions
// @match        https://meta.serverfault.com/questions/tagged/*
// @match        https://meta.serverfault.com/search?*
// @match        https://meta.serverfault.com/users/*?tab=votes*
// @match        https://meta.askubuntu.com/questions
// @match        https://meta.askubuntu.com/questions/tagged/*
// @match        https://meta.askubuntu.com/search?*
// @match        https://meta.askubuntu.com/users/*?tab=votes*
// @match        https://meta.mathoverflow.com/questions
// @match        https://meta.mathoverflow.com/questions/tagged/*
// @match        https://meta.mathoverflow.com/search?*
// @match        https://meta.mathoverflow.com/users/*?tab=votes*
// @match        https://*.stackexchange.com/questions
// @match        https://*.stackexchange.com/questions/tagged/*
// @match        https://*.stackexchange.com/search?*
// @match        https://*.stackexchange.com/users/*?tab=votes*
// @grant        none
// ==/UserScript==

/* global $ */

(function() {
    'use strict';

    var observer;

    // add css class to control how [On Hold] and [Closed] should look like
    $('head').append('<style>.js-post-summary div:not(.js-post-summary-stats) h3 a > span { color:red; }</style>');

    function decorate(anchor) {
        // https://regex101.com/r/VLjRca/1/
        var matches = /^(.*)(\[(on hold|closed|duplicate)\])$/gi.exec(anchor.text().trim());
        if ( matches !== null && matches.length > 2) {
            anchor.text(matches[1]).append($('<span>').text(matches[2]));
        }
    }

    function decorateQuestionLinks() {
        // each link
        $('.js-post-summary div:not(.js-post-summary-stats) h3 a').each(function() {
            decorate($(this));
        });
    }

    // initial page
    decorateQuestionLinks();
    if (document.location.pathname.indexOf('/search') === -1) {
        // we're not on search
        // new nav pages get loaded by ajax calls and replace a dom node
        observer = new MutationObserver(function (recs) { decorateQuestionLinks(); });
        // observe new nav
        observer.observe(document.getElementById('content'), { childList:true});
    }
})();
