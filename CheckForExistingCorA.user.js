 // ==UserScript==
// @name         Check if comment and answer exist
// @namespace    http://meta.stackexchange.com/users/158100/rene
// @version      0.1
// @description  Show a message if the answer or comment in the hash of the url doesn't exist
// @author       rene
// @match        *://*.stackexchange.com/questions/*
// @match        *://stackoverflow.com/questions/*
// @match        *://serverfault.com/questions/*
// @match        *://askubuntu.com/questions/*
// @match        *://mathoverflow.net/questions/*
// @match        *://stackapps.com/questions/*
// @match        *://superuser.com/questions/*
// @grant        none
// ==/UserScript==

(function ($, window) {

    var hash = $(window.location).attr('hash'),
        msg = $('<div></div>')
                    .css('background-color','#CCFFCC')
                    .css('align','center')
                    .css('padding', '10px')
                    .css('text-align', 'center')
                    .hide();

    function showMessage(jqsel, text) {
        if (jqsel.length === 0) {
            $('div#header').append(
                msg
                .text('The ' + text + ' is not found. It may have been deleted')
                .fadeIn(2000)
                .fadeOut(5000));
        }
    }

    if (hash.length > 0) {
        cleanHash = hash.substring(1);
        if (cleanHash.indexOf('comment') === 0) {
            ids = cleanHash.substring(7).split('_');
            showMessage($('div#comments-' + ids[1]).find('tr#comment-'+ ids[0]), 'comment');
        } else {
            if (Number.parseInt(cleanHash, 10) !== NaN) {
                showMessage($('div#answer-' + cleanHash), 'answer');
            }
        }
    }
}($ || unsafeWindow.$, window || unsafeWindow ));
