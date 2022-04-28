// ==UserScript==
// @name         Fix chat icons
// @namespace    https://meta.stackexchange.com/users/158100/rene
// @version      0.1
// @description  Fix chat icons in site switcher
// @author       rene
// @match        https://chat.meta.stackexchange.com/
// @match        https://chat.stackexchange.com/
// @match        https://chat.stackoverflow.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=stackexchange.com
// @icon         https://www.google.com/s2/favicons?sz=64&domain=stackoverflow.com
// @grant        none
// ==/UserScript==

(function() {
    (new MutationObserver(function(mutations) {
        document.querySelector('.topbar-wrapper').classList.add('s-topbar');
    })).observe(document.querySelector('.js-topbar-dialog-corral'), {
        childList: true,
        subtree: true
    });
})();
