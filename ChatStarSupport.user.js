// ==UserScript==
// @name         Chat Star Support
// @namespace    https://meta.stackexchange.com/users/158100/rene
// @version      0.2
// @description  subscribes to websocket events record stars
// @author       rene
// @match        https://chat.stackexchange.com/rooms/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=stackexchange.com
// @updateURL    https://github.com/rschrieken/SmallButHandy/raw/master/ChatStarSupport.user.js
// @downloadURL  https://github.com/rschrieken/SmallButHandy/raw/master/ChatStarSupport.user.js
// @grant        none
// ==/UserScript==

/*global $:false, fkey:false, CHAT:false*/

(function() {
    'use strict';
    const starsThreshold = 2;
    const secondsThreshold = 40;

    const room = parseInt(/https:\/\/(\w+\.)*\w+\/rooms\/(\S+?)(\/|$)/.exec(document.location.href)[2], 10);

    const stars = [];

    function notifyUser() {
        if (document.title.indexOf('✨') === -1) {
            $('#jplayer').jPlayer("volume", 1);
            $('#jplayer').jPlayer("play", 0);
            setTimeout(()=> {$('#jplayer').jPlayer("play", 0); } ,100);
            document.title = '✨ ' + document.title;
        }
    }

    function checkStarsThreshold() {
        if (stars.length > 0) {
            const minmax = stars.reduce((acc, cur) => {
                if (cur.time_stamp < acc.min) acc.min = cur.time_stamp;
                if (cur.time_stamp > acc.max) acc.max = cur.time_stamp;
                return acc;
            }, {min:stars[0].time_stamp, max:stars[0].time_stamp})
            const low = minmax.max - secondsThreshold * 1000
            return (stars.filter( star => star.time_stamp >= low).length > starsThreshold);
        }
        return false;
    }

    function handleStarring(starEvents) {
        for(const star of starEvents) {
            stars.push({msgId:star.message_id, msgTime_stamp: star.time_stamp, time_stamp: Date.now() })
        }
        if (checkStarsThreshold()) {
            notifyUser();
            while(stars.shift());
        }
    }

    function handleEvents(chatEvents) {
       handleStarring(chatEvents.filter( ev => ev.event_type === 6))
    }

    function handleOnMessage (roomId) {
        return function(e) {
            // you get alle messages for all rooms you're in
            // make sure we only respond to message this bot is running in
            var fld = 'r' + roomId.toString(), roomevent = JSON.parse(e.data)[fld], ce;
            if (roomevent && roomevent.e) {
                ce = roomevent.e;
                handleEvents(ce);
            }
        }
    };

    function handleWsAuthSuccess (eve, roomid) {

        return function(au) {
            // start the webscoket
            var ws = new WebSocket(au.url + '?l=' + eve.time.toString());
            ws.onmessage = handleOnMessage(roomid);
            ws.onerror = function (e) { console.log(e); };
        }
    }

    function handleEventsSuccess (roomId) {
        return function(eve) {
            // call ws-auth to get the websocket url
            $.post('/ws-auth', { roomid: roomId, fkey: fkey().fkey })
                .success(handleWsAuthSuccess(eve, roomId));
        }
    }

    function init(roomId) {
        // get a time marker by getting the latest message
        $.post('/chats/' + roomId.toString() + '/events', {
            since: 0,
            mode: 'Messages',
            msgCount: 1,
            fkey: fkey().fkey
        }).success(handleEventsSuccess(roomId));
    }

    init(room);
})();
