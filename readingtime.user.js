// ==UserScript==
// @name         Add reading time
// @namespace   https://meta.stackexchange.com/users/158100/rene
// @version      0.3
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
        var wordsregex = /\b(\w+)\b/g,
            match,
            tot = 0;
        while ((match = wordsregex.exec(text)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches, as found on https://regex101.com/r/byXy4H/1/
            if (match.index === wordsregex.lastIndex) {
                regex.lastIndex++;
            }
            tot++;
        }
        // console.log('words: ' + tot);
        return tot;
    }

    function numberOfImages($post) {
        var tagCount = 0;
        ['img', 'svg'].forEach(function(elem) {
            tagCount += $post.find(elem).length;
        });
        // console.log('images: ' + tagCount);
        return tagCount;
    }

    function readingTimeInMinutes(wordCount, imageCount) {
        // words is 275 per minute, no idea how images influence that
        const WPM = 275;
        const SecondsPerImage = 15;
        var wordMinutes = ((wordCount || 0) / WPM),
            imageMinutes = ((imageCount || 0) * SecondsPerImage) / 60;

        // add and ceil()
        return Math.ceil(wordMinutes + imageMinutes, 1);
    }

    $('.post-text').each(function () {
        var words = numberOfWords(this.textContent);
        var images = numberOfImages($(this));
        var minutes = readingTimeInMinutes(words, images);
        // giant S
        var minutelabel = minutes === 1 ? "minute": "minutes";
        if (minutes > 1) {
            $(this)
                .prepend(
                $('<span>')
                .text(minutes + ' min read')
                .prop('title', minutes + ' ' + minutelabel +' reading time for ' + words + ' words and ' + images + ' images')
                .addClass('label-key')
            );
        } else {
            console.log('no reading time shown for ' + minutes + ' ' + minutelabel +' reading time for ' + words + ' words and ' + images + ' images');
        }
    });
})($);
