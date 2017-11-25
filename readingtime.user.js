// ==UserScript==
// @name         Add reading time
// @namespace   https://meta.stackexchange.com/users/158100/rene
// @version      0.2
// @description  adds reading time to each question and answer
// @author       rene
// @match        https://*.stackoverflow.com/questions/*
// @match        https://*.stackexchange.com/questions/*
// @match        https://*.superuser.com/questions/*
// @match        https://*.serverfault.com/questions/*
// @match        https://*.askubuntu.com/questions/*
// @match        https://*.stackapps.com/questions/*
// @match        https://*.mathoverflow.net/questions/*
// @grant        none
// ==/UserScript==

(function($) {
    'use strict';

    function numberOfWords(text) {
        // let's do the simplest that can work first
        return text.split(' ').length;
    }

    function readingTimeInMinutes(wordCount, imageCount) {
        // words is 275 per minute, no idea how images influence that
        var wordMinutes = ((wordCount || 0) / 275),
            imageMinutes = (imageCount || 0);

        // add and round (maybe ceil()?)
        return Math.ceil(wordMinutes + imageMinutes, 1);
    }

    $('.post-text').each(function () {
        var minutes = readingTimeInMinutes(numberOfWords(this.textContent));
        // giant S
        var minutelabel = minutes === 1 ? "minute": "minutes";
        $(this)
            .prepend(
                $('<span>')
                    .text(minutes + ' min read')
                    .prop('title', minutes + ' ' + minutelabel +' reading time')
                    .addClass('label-key')
        );
    });
})($);
