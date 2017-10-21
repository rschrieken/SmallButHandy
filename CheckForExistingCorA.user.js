 // ==UserScript==
// @name         Check if comment and answer exist
// @namespace    http://meta.stackexchange.com/users/158100/rene
// @version      0.2
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

(function ($, window, StackExchange) {

    var hash = $(window.location).attr('hash');

    function showMessage(jqsel, text) {
        if (jqsel.length === 0) {
            // wait for SE to be ready
            StackExchange.initialized.done(function() {
                var classid = 'missing-post-or-comment';
                // put a notify on top
                StackExchange.notify.show('The ' + text + ' is not found. It may have been deleted', classid);
                // remove it automagically after 5 seconds
                setTimeout(function () { StackExchange.notify.close(classid);}, 5000);
            });
        }
    }

    if (hash.length > 0) {
        cleanHash = hash.substring(1);
        if (cleanHash.indexOf('comment') === 0) {
            ids = cleanHash.substring(7).split('_');
            showMessage($('div#comments-' + ids[1]).find('tr#comment-'+ ids[0]), 'comment');
        } else {
            if (!isNaN(Number.parseInt(cleanHash, 10))) {
                showMessage($('div#answer-' + cleanHash), 'answer');
            }
        }
    }
}($ || unsafeWindow.$, window || unsafeWindow, StackExchange || unsafeWindow.StackExchange ));
