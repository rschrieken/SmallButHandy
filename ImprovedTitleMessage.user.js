// ==UserScript==
// @name         show chars left in a title
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  add chars left / used on a title
// @author       rene
// @match        *://*.stackexchange.com/questions/ask
// @match        *://stackoverflow.com/questions/ask
// @match        *://superuser.com/questions/ask
// @match        *://servefault.com/questions/ask
// @match        *://stackapps.com/questions/ask
// @match        *://mathoverflow.net/questions/ask
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // where is the title
    var targetNode = document.getElementById('title');

    // we observe changes, like adding the validation message to the DOM
    var observer = new MutationObserver(function(elems, sender) {
        var i, elem, splitmsg;
        // lets see what we got
        for( i = 0; i < elems.length; i = i + 1) {
            elem = elems[i];
            // we're only in for the validation message
            if (elem.type === 'childList' &&
                elem.target &&
                elem.target.classList &&
                elem.target.classList.contains('js-stacks-validation-message') && // the most important check
                (elem.target.textContent||'').indexOf('Your title is') === -1 // let's not keep adding our own stuff
               ) {
                // let's keep the first part
                splitmsg = (elem.target.textContent || '.').split('.');
                // add the title length at the end
                elem.target.textContent = splitmsg[0] +
                    '. Your title is ' +
                    targetNode.value.length  +
                    ' characters';
            }
        }
    });

    // we're not interested in attribute changes
    var config = { attributes:false, childList: true, subtree: true };
    if (targetNode) {
        observer.observe(targetNode.parentElement.parentElement, config);
    }

})();

