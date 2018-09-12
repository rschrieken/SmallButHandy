// ==UserScript==
// @name         Unstar/unpin for room owners
// @namespace    http://stackoverflow.com/users/578411/rene
// @version      0.1
// @description  unstar
// @author       rene
// @match        *://chat.stackoverflow.com/transcript/*
// @match        *://chat.stackexchange.com/transcript/*
// @match        *://chat.meta.stackexchange.com/transcript/*
// @match        *://chat.stackoverflow.com/rooms/*
// @grant        none
// ==/UserScript==
/* jshint -W097 */
/*global $ */
'use strict';

// http://meta.stackexchange.com/a/262239/158100
function unstar(node) {
    var fkey = document.getElementById('fkey').value,
        id = node.parentElement.id.split('-')[1];
    $.post('/messages/' + id + '/unstar', {fkey: fkey}, function (data, status, xhr) {
       if (status !== 'success' || data !== 'ok') {
           alert('Not OK? ' + status + ' | ' + data);  
       } else {
           node.remove();
       }
    });
}

function unpinBuilder(node) {
    var outer = document.createElement('span'),
        sprite = document.createElement('span'),
        text = document.createTextNode("unpin/cancel stars (RO only)");
    
    sprite.className = "sprite sprite-ownerstar-off"
    outer.className = "star";
    outer.appendChild(sprite);
    outer.appendChild(text);
    
    outer.addEventListener(
        "click", 
        function () {
            unstar(node);
        }, 
        false);
    return outer;
}

function addUnstar(node) {
    var prevNode,
        currentNode,
        i;
    
    for(i = 0; i < node.childNodes.length; i = i + 1) {
        currentNode = node.childNodes[i];
        if (currentNode.nodeType === 1 && currentNode.nodeName === 'SMALL') {
            if (prevNode.nodeName === 'span') {
                // already added
            } else {
                node.insertBefore(
                    unpinBuilder(node),
                    currentNode);            
            }
            break;
        } else {
            prevNode = currentNode;
        }
    }
}

function processMutationRecord(record) {
    var node;
    if (record.addedNodes) {
        for(var i = 0; i < record.addedNodes.length; i = i + 1) {
            node = record.addedNodes[i];
            if (node.nodeType === 1 && node.nodeName === 'DIV' && node.className === 'popup') {
                addUnstar(node);
            }
        }
    }
}

var mut = new MutationObserver(function(items, src) {
    for(var i=0; i < items.length; i = i +1) {
        processMutationRecord(items[i]);
    }
});

if (document.getElementById('transcript')) {
    mut.observe(document.getElementById('transcript'), { childList: true, subtree: true });
}
