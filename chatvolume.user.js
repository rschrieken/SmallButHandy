// ==UserScript==
// @name         Chat Volume
// @namespace    http://stackoverflow.com/users/578411/rene
// @version      0.1
// @description  Chat Volume control
// @author       rene
// @downloadURL  https://github.com/rschrieken/SmallButHandy/raw/master/chatvolume.user.js
// @match        *://chat.meta.stackexchange.com/rooms/*
// @match        *://chat.stackexchange.com/rooms/*
// @match        *://chat.stackoverflow.com/rooms/*
// @grant        none
// ==/UserScript==

// slider inspired on http://stackoverflow.com/a/7191095 from RoToRa

(function ($, window) {
    var slider = $('<div style=" border-radius: 2px;background-color: white;height: 7px;width:0%"></div>'), // slider div
        key = 'ChatVolume-' + window.CHAT.CURRENT_ROOM_ID,
        storedVolume = window.localStorage.getItem(key);

    // set the volume on the slider
    function setVolume(vol) {
        slider.css('width', (vol * 100).toString() +'%');
    }

    if (storedVolume !== null) {
        $('#jplayer').jPlayer('volume', storedVolume); // set our volume from localStorage
    }

    $('#sound').on('click', function () {
        // wait for the dialog to be inserted in the dom
        window.setTimeout(function() {
            setVolume($('#jplayer').jPlayer('option','volume')); // current volume
            $('div.popup > ul').append(
                $('<li style="margin-top: 2px;"></li>').append(
                    $('<div style="background-color: #4e82c2;padding: 2px; border-radius: 5px;box-shadow: 0px 2px 0 #3767a1"></div>').append( // outer div
                        slider
                    ).on('click', function (e) {
                        // clicking the outer div set the volume
                        var volnew = e.offsetX / $(e.delegateTarget).width(); // between 0 and 1
                        volnew = volnew < 0 ? 0: volnew > 1 ? 1 : volnew; // normalize
                        $('#jplayer').jPlayer('volume', volnew); // set our new volume
                        window.localStorage.setItem(key, volnew);
                        setVolume(volnew);
                    })
                )
            );
        }, 100);
    });
} ($|| unsafeWindow.$, window || unsafeWindow));
