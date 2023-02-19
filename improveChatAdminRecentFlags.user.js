// ==UserScript==
// @name         ImproveChatAdminRecentFlags
// @namespace    https://meta.stackexchange.com/users/158100/rene
// @version      0.1
// @description  Sorting for Chat Admin Recent flags
// @author       rene
// @match        https://chat.stackexchange.com/admin/recent-flags
// @match        https://chat.stackoverflow.com/admin/recent-flags
// @match        https://chat.meta.stackexchange.com/admin/recent-flags
// @icon         https://www.google.com/s2/favicons?sz=64&domain=stackexchange.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var flagdateColumn = 5;
    var table = document.getElementsByTagName('table')[0];
    var tbody = document.getElementsByTagName('tbody')[0];
    var theadRow = tbody.firstChild;
    var thead = document.createElement('thead');

    function addTableHead() {
        tbody.removeChild(theadRow);
        thead.appendChild(theadRow);
        table.insertBefore(thead, tbody);
    }

    function fixDates() {
        // replace 2/16/2023 8:58:00 PM with YYYY-MM-DD HH:mm.ss
       function zeroPad(val) {
           var str = '0' + val;
           return str.substring(str.length - 2);
       }

        for(var row of tbody.childNodes) {
            var td = row.childNodes[flagdateColumn];
            if (td) {
                var dtm = new Date(td.textContent);
                td.textContent = `${dtm.getFullYear()}-${zeroPad(dtm.getMonth() + 1)}-${zeroPad(dtm.getDate())} ${zeroPad(dtm.getHours())}:${zeroPad(dtm.getMinutes())}.${zeroPad(dtm.getSeconds())}`
            }
        }
    }

    function sortBodyOnColumn(colIndex, dir) {
        // lets do this as inefficient as possible
        var dataRows = [];
        var sortdir = dir === 'asc'? 1: -1;

        for(var row of tbody.childNodes) {
            dataRows.push(row);
        }

        while( tbody.firstChild) {
            tbody.removeChild(tbody.firstChild)
        }

        function val(tr) {
            var td = tr.childNodes[colIndex];
            console.log(td);
            if (!td) return;
            return td.textContent;
        }

        dataRows.sort( (l,r) => {
            var left = val(l);
            var right = val(r);
            if (left > right) {
                return sortdir
            }
            if (left < right) {
                return -sortdir
            }
            return 0

        });
        for(var sortedRow of dataRows) {
            tbody.appendChild(sortedRow);
        }
    }

    function handleSortColumn(ev) {
        var col = ev.target
        var colIndex = 0;
        for(var targetCol of theadRow.childNodes) {
            if (targetCol === col) {
                break;
            }
            colIndex++;
        }
        var dir = getSort(colIndex);
        setSort(colIndex, dir);
        sortBodyOnColumn(colIndex, dir);
    }

    function getSort(idx) {
        var thsort = theadRow.childNodes[idx];
        if (thsort.classList.contains('js-sort-asc')) {
            return 'desc'
        }
        return 'asc'
    }


    function setSort(idx, dir) {
        for (var th of theadRow.childNodes) {
            th.classList.remove('js-sort-asc');
            th.classList.remove('js-sort-desc');
            th.classList.remove('js-sort');
            th.classList.add('js-sort');
        }
        var thsort = theadRow.childNodes[idx];
        thsort.classList.add('js-sort-' + dir);
    }

    function init() {
        addCss();
        for(var th of theadRow.childNodes) {
            th.addEventListener('click', handleSortColumn)
        }
        addTableHead();
        setSort(0, 'desc');

        fixDates();
    }

    function addCss() {
        var head = document.getElementsByTagName('head')[0];
        var css = document.createElement('style');
        head.appendChild(css);
        css.textContent = `
      h1 {font-size: 16px;  }
      table {font-size: 14px; border-collapse: collapse;}
      th:hover {
        cursor: pointer;
      }
      thead tr th:nth-child(6) {
        width: 150px;
      }
      th.js-sort::after {
      padding-left: 10px;
      }
      th.js-sort-asc::after {
         content: '▲';
      }
      th.js-sort-desc::after {
         content: '▼';
      }
      td {
        border: 1px solid grey;
        margin: 2px;
        padding: 1px;
        padding-left: 5px;
        padding-right: 5px;
        border-collapse: collapse;
      }
      tr {
      margin-top: 2 px;
      }
    `;
    }

    init();
})();
