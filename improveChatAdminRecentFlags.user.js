// ==UserScript==
// @name         ImproveChatAdminRecentFlags
// @namespace    https://meta.stackexchange.com/users/158100/rene
// @version      0.9
// @description  Sorting and filtering for Chat Admin Recent flags
// @author       rene
// @match        https://chat.stackexchange.com/admin/recent-flags
// @match        https://chat.stackoverflow.com/admin/recent-flags
// @match        https://chat.meta.stackexchange.com/admin/recent-flags
// @match        https://chat.stackexchange.com/admin
// @match        https://chat.stackoverflow.com/admin
// @match        https://chat.meta.stackexchange.com/admin
// @match        https://chat.stackexchange.com/users/*/*
// @match        https://chat.stackoverflow.com/users/*/*
// @match        https://chat.meta.stackexchange.com/users/*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=stackexchange.com
// @updateURL    https://github.com/rschrieken/SmallButHandy/raw/master/improveChatAdminRecentFlags.user.js
// @downloadURL  https://github.com/rschrieken/SmallButHandy/raw/master/improveChatAdminRecentFlags.user.js
// @grant        none
// ==/UserScript==

(function() {

     const knownPaths = {
        admin:'/admin',
        recentFlags: '/admin/recent-flags',
        getMessages: '/users/get-messages/',
        roomsInfo: '/rooms/info/',
        transcriptMessage: '/transcript/message/'
    }

    function appendToHead(element) {
        document.getElementsByTagName('head')[0].appendChild(element)
    }

    function appendCss(cssText) {
        const css = document.createElement('style');
        appendToHead(css);
        css.textContent = cssText;
    }

    function recentFlags() {
        'use strict';
        const idColumn = 0;
        const flagdateColumn = 5;
        const roomColumn = 6;
        const authorColumn = 7;
        const table = document.getElementsByTagName('table')[0];
        const tbody = document.getElementsByTagName('tbody')[0];
        const theadRow = tbody.firstChild;
        const thead = document.createElement('thead');
        const filter = {};

        function createDeletedFilter(currentIndex, th) {
            if (currentIndex === idColumn) {
                const check = document.createElement('input');
                check.setAttribute('type', 'checkbox');
                check.setAttribute('title', 'only non-deleted');
                th.appendChild(check);
                check.addEventListener('change', (ev) => {
                    if (ev.target.checked) {
                        filter[currentIndex] = { showNonDeleted: true };
                    } else if (filter[currentIndex].showNonDeleted) {
                        delete filter[currentIndex]
                    }
                    applyFilter();
                });
            }
        }

        function createFilterColumn(currentIndex) {
            const th = document.createElement('th');
            const input = document.createElement('input');
            input.setAttribute('placeholder', 'filter');
            th.appendChild(input);
            input.addEventListener('keyup', (ev) => {
                if (ev.target.value) {
                    filter[currentIndex] = ev.target.value;
                } else {
                    delete filter[currentIndex]
                }
                applyFilter();
            });
            createDeletedFilter(currentIndex, th);
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
                return val.toString().padStart(2, '0');
            }

            function toDateString(anyDate) {
                const yearIndex = 0;
                const monthIndex = 1;
                var dtm = ['getFullYear','getMonth', 'getDate', 'getHours', 'getMinutes', 'getSeconds'].reduce((dateValue, dateFunction, i) => {
                    const value = anyDate[dateFunction]() + (i === monthIndex ? 1: 0);
                    dateValue[dateFunction.substring(3)] = zeroPad(value);
                    return dateValue;
                }, {});
                return `${dtm.FullYear}-${dtm.Month}-${dtm.Date} ${dtm.Hours}:${dtm.Minutes}.${dtm.Seconds}`
            }

            for(const row of tbody.childNodes) {
                const td = row.childNodes[flagdateColumn];
                if (td) {
                    td.textContent = toDateString(new Date(td.textContent));
                }
            }
        }

        function applyConditionalFormatting() {
            const cols = [roomColumn, authorColumn];
            for(const col of cols) {
                const valueCounts = {};
                let total = 0;
                for(const row of tbody.childNodes) {
                    const td = row.childNodes[col];
                    if (td) {
                        if (valueCounts[td.textContent]) {
                            if (valueCounts[td.textContent] === 1 ){
                                total = total + 1;
                            }
                            valueCounts[td.textContent] = valueCounts[td.textContent] + 1;
                        } else {
                            valueCounts[td.textContent] = 1;
                        }
                    }
                }
                for(const row of tbody.childNodes) {
                    const td = row.childNodes[col];
                    if (td) {
                        var count = valueCounts[td.textContent];
                        if (count > 1 && total > 1) {
                            var perc = Math.round(count / total * 100);
                            var rp = (100-perc);
                            var yp = (100-perc) / 2;
                            var wp = (100-perc) / 4;
                            td.style.background = `linear-gradient(to right, white ${wp}%, yellow ${yp}%, red ${rp}%)`
                        }
                    }
                }
            }
        }

        function applyFilterForColumn(key, col) {
            if (key === idColumn.toString() && filter[key].showNonDeleted) {
                const link = col.firstChild;
                if (link.getAttribute('href').indexOf('/history') !== -1) {
                    return true;
                }
            } else {
                let sourceText;
                if (col.hasChildNodes()) {
                    sourceText = col.innerHTML;
                } else {
                    sourceText = col.textContent;
                }
                return sourceText.indexOf(filter[key]) === -1;
            }
            return false;
        }

        function applyFilterRow(row) {
            row.classList.remove('filtered');
            for(const key in filter) {
                if (applyFilterForColumn(key, row.childNodes[key])) {
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
            addMetaCharset();
            addCss();
            addTitle();
            for(const th of theadRow.childNodes) {
                th.addEventListener('click', handleSortColumn)
            }
            addTableHead();
            setSort(0, 'desc');
            fixDates();
            applyConditionalFormatting();
        }

        function addTitle() {
            const title = document.createElement('title');
            appendToHead(title);
            title.textContent = 'Recent Flags';
        }

        function addMetaCharset() {
            const meta = document.createElement('meta');
            meta.setAttribute('charset', 'utf-8');
            appendToHead(meta);
        }

        function addCss() {
           appendCss(`
      h1 {font-size: 16px;  }
      table {font-size: 14px; border-collapse: collapse;}
      th:hover {
        cursor: pointer;
      }
      thead tr th {
        border: 1px solid #F6F6F6;
      }
      thead tr th:nth-child(6) {
        width: 150px;
      }
      th.js-sort-asc::after {
         content: '▲';
         color: blue;
         padding-left: 3px;
      }
      th.js-sort-desc::after {
         content: '▼';
         color: blue;
         padding-left: 3px;
      }
      td {
        border: 1px solid #F6F6F6;
        margin: 2px;
        padding: 1px;
        padding-left: 5px;
        padding-right: 5px;
        border-collapse: collapse;
        cursor: default;
      }
      .filtered {
         display: none;
      }
      thead tr th input {
        width: 100%;
        border: none
      }
      thead tr th:first-child {
        text-align:left;
      }
      thead tr th:first-child input:first-child {
        width: 70%;
        display:inline;
        border: none
      }
      thead tr th:first-child input:not(:first-child) {
        width: 20%;
        display:inline;
        border: none
      }
      thead tr th input::placeholder {
        color:light-grey;
        opacity: 0.5;
      }
    `);
        }

        init();
    }

    function initAdmin(){
        const content = document.getElementById('content')
        const ul = content.querySelector('div > ul')
        const li = document.createElement('li')
        const a = document.createElement('a')
        a.setAttribute('href', knownPaths.recentFlags)
        a.textContent = 'recent flags'
        li.appendChild(a)
        ul.appendChild(li)
    }

    function initGetMessages() {
        function addStyle() {
            appendCss(`
              .s-table td:nth-child(3) { word-break: break-all;}
              .s-table-container {padding-right: 2px;}
             `);
        }

        function replaceHeaders() {
            const headersMap = {
                'Parent Message Id': 'Parent Id',
                'Mod Flag Count': '#Flags'
            };

            const headers = document.querySelectorAll('.s-table > thead > tr > th > button');
            for(const hdr of headers) {
                const value = headersMap[hdr.textContent.trim()];
                if (value) {
                    hdr.textContent = value;
                }
            }
        }

        function replaceCellWithLink(cell, href, text, title) {

            function decorateLinkTitle(link, title) {
                if (title) {
                    if (typeof title === 'string') {
                        link.title = title;
                    } else {
                        title.then((text) => {
                            link.title = text;
                        });
                    }
                }
                return link;
            }

            function createLink(text, href) {
                const link = document.createElement('a');
                link.textContent = text;
                link.href = href
                link.target = '_blank';
                return link;
            }

            cell.removeChild(cell.firstChild)
            cell.appendChild(decorateLinkTitle(createLink(text, href), title));
        }

        function decorateRows() {
            const rows = document.querySelectorAll('.s-table > tbody > tr');
            for(const row of rows) {
                decorateCreationDate(row);
                decorateRoomId(row);
                decorateParentId(row);
            }
        }

        function buildRoomInfoPromise(roomId) {

            const roomKey = `improveChatAdminRecentFlags-${roomId}`;
            const fetchKey = `improveChatAdminRecentFlags-${roomId}-fetching`;

            const cachedRoomTitle = sessionStorage.getItem(roomKey);
            if (cachedRoomTitle) {
                return cachedRoomTitle;
            }

            return new Promise((resolve)=> {

                function tryAndResolveRoomTitle() {
                    const cachedRoomTitle = sessionStorage.getItem(roomKey);
                    if (cachedRoomTitle) {
                        resolve(cachedRoomTitle);
                        return true;
                    }
                    return false;
                }

                function parseRoomTitle(html) {
                    const info = document.createElement('chr');
                    info.innerHTML= html;
                    let title = info.querySelector('h1').textContent;

                    function getRoomType(info) {
                        const roomTypeSpan = info.querySelector('#content .roomcard-xxl h1 span.sprite');
                        let roomType = '';
                        if (roomTypeSpan) {
                            const specialRoom = Array.from(roomTypeSpan.classList).reduce((a,i)=> a?a:i.startsWith('sprite-sec-')?i:a, '').split('-');
                            roomType = (specialRoom.length >1 ? ` (${specialRoom[2]})` : '')
                        }
                        return roomType
                    }

                    return title + getRoomType(info);
                }

                function parseStoreAndResolveRoomTitle(html) {
                    const fetchedRoomTitle = parseRoomTitle(html);
                    sessionStorage.setItem(roomKey, fetchedRoomTitle);
                    resolve(fetchedRoomTitle);
                }

                const isRoomTitleFetching = sessionStorage.getItem(fetchKey);
                if (isRoomTitleFetching) {
                    const interval = setInterval(() => {
                        if (tryAndResolveRoomTitle()) {
                            clearInterval(interval);
                        }
                    }, 50);
                } else {
                    if (!tryAndResolveRoomTitle()) {
                        sessionStorage.setItem(fetchKey, true);
                        fetch(`${knownPaths.roomsInfo}${roomId}?tab=general`)
                            .then((response)=> response.text())
                            .then((html)=> {
                               parseStoreAndResolveRoomTitle(html);
                               sessionStorage.removeItem(fetchKey);
                        });
                    }
                }
            });
        }

        function decorateRoomId(row) {
            // having #RoomId on all cells is out-of-spec for HTML 5.
            // but we (ab)use it here to our advantage
            // RoomId is the 4th column in case this ever needs fixing
            const roomCell = row.querySelector('#RoomId');
            if (roomCell) {
                const roomId = roomCell.textContent;
                const roomTitle = buildRoomInfoPromise(roomId);
                replaceCellWithLink(roomCell, knownPaths.roomsInfo + roomId, roomId, roomTitle);
            }
        }

        function decorateCreationDate(row) {
            // CreationDate is the 2nd column
            const creationDateCell = row.querySelector('#CreationDate');
            // SelectItem is the 1st column, it has an input element with a value propety set to the chat messageId
            const selectItemCellInput = row.querySelector('#SelectItem > input[name="select-item"]');
            if (creationDateCell && selectItemCellInput) {
                replaceCellWithLink(creationDateCell, knownPaths.transcriptMessage + selectItemCellInput.value, creationDateCell.textContent);
            }
        }

        function decorateParentId(row) {
            // ParentId is the 5th column
            const parentIdCell = row.querySelector('#ParentId');
            if (parentIdCell && parentIdCell.textContent) {
                replaceCellWithLink(parentIdCell, knownPaths.transcriptMessage + parentIdCell.textContent, parentIdCell.textContent);
            }
        }

        addStyle();
        replaceHeaders();
        decorateRows();
    }

    function decorateModPopup() {
        appendCss(`div.popup a[href^='${knownPaths.getMessages}'].button { display:inline-block;}`);
    }

    if (document.location.pathname.endsWith(knownPaths.recentFlags)) {
        recentFlags()
    } else if (document.location.pathname.endsWith(knownPaths.admin)) {
        initAdmin()
    } else if (document.location.pathname.indexOf(knownPaths.getMessages) === 0) {
        initGetMessages()
    } else if (/^\/users\/(\d+)\//.exec(document.location.pathname)) {
        decorateModPopup()
    }
})();
