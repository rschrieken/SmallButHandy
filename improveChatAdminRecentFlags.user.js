// ==UserScript==
// @name         ImproveChatAdminRecentFlags
// @namespace    https://meta.stackexchange.com/users/158100/rene
// @version      0.2
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
    const flagdateColumn = 5;
    const table = document.getElementsByTagName('table')[0];
    const tbody = document.getElementsByTagName('tbody')[0];
    const theadRow = tbody.firstChild;
    const thead = document.createElement('thead');
    const filter = {};

    function createFilterColumn(currentIndex) {
        const th = document.createElement('th');
        const input = document.createElement('input');
        th.appendChild(input);
        input.addEventListener('keyup', (ev) => {
            if (ev.target.value) {
                filter[currentIndex] = ev.target.value;
            } else {
                delete filter[currentIndex]
            }
            applyFilter();
        });
        return th;
    }

    function addFilter(){
        const filterRow = document.createElement('tr');
        thead.appendChild(filterRow);
        let index = 0;
        for(const item of theadRow.childNodes) {
            filterRow.append(createFilterColumn(index));
            index++;
        }
    }

    function addTableHead() {
        tbody.removeChild(theadRow);
        thead.appendChild(theadRow);
        table.insertBefore(thead, tbody);
        addFilter();
    }

    function fixDates() {
        // replace 2/16/2023 8:58:00 PM with YYYY-MM-DD HH:mm.ss
       function zeroPad(val) {
           const str = '0' + val;
           return str.substring(str.length - 2);
       }

        for(const row of tbody.childNodes) {
            const td = row.childNodes[flagdateColumn];
            if (td) {
                const dtm = new Date(td.textContent);
                td.textContent = `${dtm.getFullYear()}-${zeroPad(dtm.getMonth() + 1)}-${zeroPad(dtm.getDate())} ${zeroPad(dtm.getHours())}:${zeroPad(dtm.getMinutes())}.${zeroPad(dtm.getSeconds())}`
            }
        }
    }

    function applyFilterRow(row) {
        row.classList.remove('filtered');
        for(const key in filter) {
            if (row.childNodes[key].textContent.indexOf(filter[key]) === -1 ) {
                row.classList.add('filtered');
            }
        }
    }

    function applyFilter() {
        for(const row of tbody.childNodes) {
            if (row.nodeType === 1) {
                applyFilterRow(row);
            }
        }
    }

    function prepareRowsForSort() {
        const dataRows = [];
        for(const row of tbody.childNodes) {
            if (row.nodeType === 1) {
                dataRows.push(row);
            }
        }
        while( tbody.firstChild) {
            tbody.removeChild(tbody.firstChild)
        }
        return dataRows;
    }

    function completeRowsForSort(dataRows) {
        for(const sortedRow of dataRows) {
            tbody.appendChild(sortedRow);
        }
        applyFilter();
    }

    function sortBodyOnColumn(colIndex, dir) {
        // lets do this as inefficient as possible
        const dataRows = prepareRowsForSort();
        const sortdir = dir === 'asc'? 1: -1;

        function val(tr) {
            const td = tr.childNodes[colIndex];
            if (!td) return;
            return td.textContent;
        }

        dataRows.sort((l,r) => {
            const left = val(l);
            const right = val(r);
            if (left > right) {
                return sortdir
            }
            if (left < right) {
                return -sortdir
            }
            return 0
        });
        completeRowsForSort(dataRows);
    }

    function handleSortColumn(ev) {
        const col = ev.target
        let colIndex = 0;
        for(const targetCol of theadRow.childNodes) {
            if (targetCol === col) {
                break;
            }
            colIndex++;
        }
        const dir = getSort(colIndex);
        setSort(colIndex, dir);
        sortBodyOnColumn(colIndex, dir);
    }

    function getSort(idx) {
        const thsort = theadRow.childNodes[idx];
        if (thsort.classList.contains('js-sort-asc')) {
            return 'desc'
        }
        return 'asc'
    }

    function setSort(idx, dir) {
        for (const th of theadRow.childNodes) {
            th.classList.remove('js-sort-asc');
            th.classList.remove('js-sort-desc');
            th.classList.remove('js-sort');
            th.classList.add('js-sort');
        }
        const thsort = theadRow.childNodes[idx];
        thsort.classList.add('js-sort-' + dir);
    }

    function init() {
        addCss();
        addTitle();
        for(const th of theadRow.childNodes) {
            th.addEventListener('click', handleSortColumn)
        }
        addTableHead();
        setSort(0, 'desc');

        fixDates();
    }

    function addTitle() {
        const head = document.getElementsByTagName('head')[0];
        const title = document.createElement('title');
        head.appendChild(title);
        title.textContent = 'Recent Flags';
    }

    function addCss() {
        const head = document.getElementsByTagName('head')[0];
        const css = document.createElement('style');
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
      .filtered {
         display: none;
      }
      thead tr th input {
        width: 100%;
      }
    `;
    }

    init();
})();
