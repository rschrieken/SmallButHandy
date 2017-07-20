// ==UserScript==
// @name         chat entries search
// @namespace    http://stackoverflow.com/users/578411/rene
// @version      0.2
// @description  search all rooms for your messages
// @author       rene
// @match        *://chat.stackoverflow.com/users/*
// @match        *://chat.stackexchange.com/users/*
// @match        *://chat.meta.stackexchange.com/users/*
// @grant        none
// ==/UserScript==
/* jshint -W097 */
/*global $, fkey */
'use strict';

var backlog = [], // holds all functions to be executed
    interval,     // interval handle
    pending = 0,  //  pending handlers
    user = parseInt(/.*\.com\/users\/(\d+)\/.*/.exec(document.location)[1], 10); // which user

// parse the events array for the current user_id
function handleEvents(events) {
    var i,
        found = 0;
    for(i = 1; i < events.length; i = i + 1) {
        if (events[i].user_id === user ) {
            found = found + 1;
        }
    }
    return found;
}

// handle a room, optionally for messages before a certain id
function handleRoom(room, roomName) {

    var msgcnt = 0, roomStat, tick = 0, ticks = ['-','\\','|','/'];

    function postEvents(data, callback) {
        pending++;
        $.post('/chats/' + room + '/events', data,  callback).always(function() { pending--; });
    }

    function createCard() {
        var link = $('<a></a>').prop('href','/rooms/' + room).text(roomName + '(processing)');
        $('#user-roomcards-container').append(
            $('<div></div>').append(link)
        );
        return link;
    }

    function roomProcessingReady() {
        if (msgcnt>0) {
            roomStat.text(roomName + ' (' + msgcnt.toString()+ ')');
        } else {
            roomStat.parent().remove();
        }
    }

    function roomProcessingTick() {
        roomStat.text(roomName + ' ' + ticks[tick]);
        tick++;
        tick = tick % ticks.length;
    }

    function processEvents(events) {
        // if the user is found
        msgcnt = msgcnt + handleEvents(events);
        // scan the remaining events
        backlog.push(function() { getRoomEvents(room, events[0].message_id); });
    }

    function handleEventsResponse(response) {
        var cnt;
        if (response.events && response.events[0]) {
            roomProcessingTick();
            processEvents(response.events);
        } else {
            roomProcessingReady();
        }
    }

    function getRoomEvents(room, before) {
        var data = {
            fkey: fkey().fkey,
            msgCount: 500,
            mode: 'Messages',
            before: before
        };
        postEvents(data, handleEventsResponse);
    }

    roomStat = createCard();

    postEvents(
        { fkey: fkey().fkey,
          msgCount: 500,
          mode: 'Messages' },
        handleEventsResponse);
}

// handle all rooms on page
function handleRooms(page) {
    var maxrooms = 0;
    // get 60 rooms sorted on activity
    pending++;
    $.post('/rooms',
        {tab:'all', sort:'active',pageSize:60, page:page,nohide:true},
        function (data) {
            $(data).find('.room-header').each(function () {
                var roomLink = $(this).find('a'),
                    roomParse = /.*\/(\d+)\/.*/.exec(roomLink.prop('href')),
                    room = roomParse !== null ? parseInt(roomParse[1],10) : Number.NaN;
                maxrooms++;
                if (!Number.isNaN(room)) {
                    backlog.push( function () { handleRoom(room, roomLink.text()); });
                }
            });
        // as long as we found 60 rooms ...
        if (maxrooms === 60) {
           // ... fetch the next page with rooms
           backlog.push( function () {handleRooms(page + 1); });
        }
    }).always( function () { pending--;});
}

// start working
backlog.push(function () {handleRooms(1); });

// takes a function from the backlog
// every 4 seconds
interval = setInterval(function() {
    var f = backlog.shift();
    if (f === undefined ) {
        if (pending === 0 ) {
           $('#user-roomcards-container').append($('<div></div>').text('done!'));
           clearInterval(interval);
        }
    } else {
        f();
    }
}, 4000);
