 // ==UserScript==
// @name         Check if comment and answer exist
// @namespace    http://meta.stackexchange.com/users/158100/rene
// @version      1.1
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

(function (document, window, StackExchange) {

    var hash = (window.location && window.location.hash)?window.location.hash:'';

    function showMessage(jqsel, text) {
        if (jqsel === null) {
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

    StackExchange.ready( function() {
        if (hash.length > 0) {
            cleanHash = hash.substring(1);
            if (cleanHash.indexOf('comment') === 0) {
                ids = cleanHash.substring(7).split('_');
                var lnk = document.getElementById('comments-link-' + ids[1]);
                if (lnk !== null) {
                    StackExchange.comments.loadAll(lnk).done(function() {
                        showMessage(document.getElementById('comment-'+ ids[0]), 'comment');
                    });
                } else {
                    showMessage(document.getElementById('comment-'+ ids[0]), 'comment');
                }
            // Make sure the hash is not the ID of the question.
            } else if (window.location.pathname.indexOf('/questions/' + cleanHash) !== 0) {
                if (!isNaN(Number.parseInt(cleanHash, 10))) {
                    showMessage(document.getElementById('answer-' + cleanHash), 'answer');
                }
            }
        }
    });

}(document || unsafeWindow.document, window || unsafeWindow, StackExchange || unsafeWindow.StackExchange ));
