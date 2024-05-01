// ==UserScript==
// @name         ChatSupport
// @namespace    https://meta.stackexchange.com/users/158100/rene
// @version      2024-05-01
// @description  subscribes to websocket events record
// @author       rene
// @match        https://chat.stackexchange.com/rooms/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=stackexchange.com
// @grant        none
// ==/UserScript==

/*global $:false, fkey:false, CHAT:false*/

(function() {
    'use strict';
    const room = parseInt(/https:\/\/(\w+\.)*\w+\/rooms\/(\S+?)(\/|$)/.exec(document.location.href)[2], 10);

    const stars = [];

    function handleEvents(chatEvents) {
       // console.log(chatEvents);
        for(const star of chatEvents) {
            stars.push({msgId:star.message_id, time_stamp: star.time_stamp })
        }
        if (stars.length > 0) {
            const minmax = stars.reduce((acc, cur) => {
                if (cur.time_stamp < acc.min) acc.min = cur.time_stamp;
                if (cur.time_stamp > acc.max) acc.max = cur.time_stamp;
                return acc;
            }, {min:stars[0].time_stamp, max:stars[0].time_stamp})
            const low = minmax.max - 40000 // 40 seconds
            console.log(minmax, low, stars.filter( star => star.time_stamp >= low), stars);
            if (stars.filter( star => star.time_stamp >= low).length > 1) {
                
                if (!document.title.startsWith('✨')) {
                    $('#jplayer').jPlayer("volume", 1);
                    $('#jplayer').jPlayer("play", 0);
                    setTimeout(()=> {$('#jplayer').jPlayer("play", 0); } ,100);
                    document.title = '✨ ' + document.title;
                }
                while(stars.shift());
            }
        }
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
            console.log(au);
            // start the webscoket
            var ws = new WebSocket(au.url + '?l=' + eve.time.toString());
            ws.onmessage = handleOnMessage(roomid);
            ws.onerror = function (e) { console.log(e); };
        }
    }

    function handleEventsSuccess (roomId) {
        return function(eve) {
            console.log(eve.time);
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
