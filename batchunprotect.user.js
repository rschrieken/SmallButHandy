// ==UserScript==
// @name         Unprotect questions
// @namespace    https://meta.stackexchange.com/users/158100/rene
// @version      0.3
// @description  Unprotect questions in a batch
// @author       rene
// @match        https://*.stackexchange.com/tools/protected-questions*
// @grant        none
// ==/UserScript==

(function(fkey) {
    'use strict';

    // this determines which question to select, available fields are: 'title','questionDate','displayname','protectedDate','answerCount','deletedCount'
    const filter = (i) =>  i.protectedDate < Date.parse('2017-11-01'); // && i.displayname === 'rene';


    // I need the question id, so regex it out of the url
    const parseUserOrQuestionId = /.*(?:\/(?:questions|users)\/(\d+))/g;

    // map each TD to a property of a question object
    function mapRow2Question(tr) {
        // this are the TD elements
        var qitems = tr.children;
        var q = {};
        // map a column to a property, with a few to spare at the end
        var key = ['title','questionDate','displayname','protectedDate','answerCount','deletedCount','qurl','dummy', 'uurl','questionid', 'dummy2', 'userid'];
        for (var j=0; j<qitems.length; j++) {
            var qitem = qitems[j];
            if ( j === 0 || j === 2) {
                // this td contains an anchor element
                // I keep the text and the href in separate properties
                qitem = qitem.children[0];
                // the href hold the id (question or user)
                var m = parseUserOrQuestionId.exec(qitem.href);
                if (m !== null) {
                  // map to the right column
                  q[key[j+9]] = m[1];
                }
                q[key[j+6]] = qitem.href;
                q[key[j]] = qitem.textContent;
            } else if (j === 1 || j === 3)  {
                // these are date columns
                q[key[j]] = Date.parse(qitem.textContent);
            } else {
                // these are integer columns
                q[key[j]] = Number.parseInt(qitem.textContent, 10);
            }
        }
        q.src = tr; // for feedback in the UI
        return q;
    }

    function search(filter) {
        var questions = document.getElementById('content').querySelectorAll('tbody')[0].children;
        var qlist = [],
            selected =[];

        for(var i=0; i<questions.length; i++) {
            qlist.push(mapRow2Question(questions[i]));
        }

        // apply the filter, keep the new array around
        selected = qlist.filter(filter);
        // add checkboxes so you can deselect a question
        selected.forEach( (i) => {
            var qtd = i.src.children[0];
            var cb = document.createElement('input');
            i.selected = true;
            cb.type='checkbox';
            cb.checked ='checked';
            cb.addEventListener('click', function() { i.selected = !i.selected; });
            qtd.insertBefore(cb, qtd.children[0]);
        });
        return selected;
    }

    // clumsy way to add the buttons in the header
    function addButton(txt, handler) {
        var tabs = document.getElementById('tabs');
        var hdr = tabs.parentNode;
        var btn = document.createElement('button');
        btn.addEventListener('click', handler);
        btn.textContent = txt;
        btn.style.margin = "5px";
        hdr.insertBefore(btn, tabs);
        return btn;
    }

    // this will unprotect the question for real
    function unprotect(qid, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/question/unprotect');
        xhr.addEventListener('load', function() {
            if (xhr.status !== 200) {
                console.log('no success for ', qid);
                if (callback) callback();
            }
        });
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        console.log('about to do post /question/unprotect', "id=" + qid.toString() + "&fkey=" + fkey.toString());
        // uncomment the next line to actual call un-protect
        // xhr.send("id=" + qid.toString() + "&fkey=" + fkey.toString());
    }

    // add the buttons and wire the click events
    function init() {
        var timer,
            questionsToUnprotect = [],
            unprotectBtn,
            start;

        start = addButton('search', function() {
            questionsToUnprotect = search(filter);
            unprotectBtn.disabled = false;
            start.disabled = true;
        });
        unprotectBtn = addButton('unprotect', function() {
            unprotectBtn.disabled = true; // we don't want to fire multiple times
            // get all protected questions that are selected
            var work = questionsToUnprotect.filter( (i) => i.selected);
            // to prevent throttle, go over them every 5 seconds
            timer = setInterval(function() {
                var item = work.shift();
                if (item === null || item === undefined) {
                    clearInterval(item);
                    start.disabled = false;
                } else {
                    if (item.selected) {
                      unprotect(item.questionid, function() {
                          // error handling
                          item.src.children[0].style.backgroundColor = 'red';
                          clearInterval(timer); // make sure to stop
                      });
                      item.src.children[0].children[0].checked = false;
                    }
                }
            }, 5000);
        });
        unprotectBtn.disabled = true;
    }

    init();

})(StackExchange.options.user.fkey);
