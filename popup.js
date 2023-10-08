var selectedWatchlist = null;
const WATCHLIST_KEY = 'watchlist_4c70dd20-2688-4a0f-bfc1-ff6a8eff097d';
const SELECTED_WATCHLIST = 'selected_watchlist'
var watchlistNames = [];
var symbolsInCurrentWatchlist = [];
var timer = null;
var sortPriceInterval = null;
var sortPrices = true;
var currentIndex = 0;
const BATCHSIZE = 10;
var sortPricePeriod = 10000;


async function initv3() {
    document.getElementById("inputSubmit").addEventListener("click", addToArray);
    document.getElementById("createWatchlist").addEventListener("click", createWatchlist);
    document.getElementById("toggleSort").addEventListener("click", toggleSort);

    const storage_watchlist = await chrome.storage.local.get(WATCHLIST_KEY);
    watchlistNames = ['watchlist'];
    if(
        storage_watchlist.hasOwnProperty(WATCHLIST_KEY)
        && storage_watchlist[WATCHLIST_KEY].length > 0
    ){
        watchlistNames = storage_watchlist[WATCHLIST_KEY];
    }
    else UpdateStorage(WATCHLIST_KEY, watchlistNames);

    selectedWatchlist = watchlistNames[0];
    const storage_selected_watchlist = await chrome.storage.local.get(SELECTED_WATCHLIST);
    if(storage_selected_watchlist.hasOwnProperty(SELECTED_WATCHLIST)){
        selectedWatchlist = storage_selected_watchlist[SELECTED_WATCHLIST]
    }
    else UpdateStorage(SELECTED_WATCHLIST, selectedWatchlist);
    listWatchlists(watchlistNames);
    init_watchlist(selectedWatchlist);
    chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
        if (msg.livePrices != null) {
            // console.log('found live prices', msg.livePrices)
            updateLivePrices(msg.livePrices)
            sendResponse("done")
        }
        return true;
        });
    sortPriceInterval = setInterval(
        sendSymbolBatch,
        sortPricePeriod,
    )

}

function toggleSort() {
    if (sortPrices) {
        sortPrices = false;
        document.querySelector(".table-container").addEventListener("scroll", getVisibleElements);
        clearInterval(sortPriceInterval);
    }
    else{
        sortPrices = true;
        document.querySelector(".table-container").removeEventListener("scroll", getVisibleElements);
        sortPriceInterval = setInterval(
            sendSymbolBatch,
            sortPrivePeriod,
        )
    }

}

function setSelectedWatchlistButton(watchlistName) {
    var watchlistButton = document.getElementById("navbarDropdownMenuLink");
    watchlistButton.textContent = watchlistName;
}

function listWatchlists(watchlistNames){
    var entriesList = document.getElementById("entries");
    for(var entryName of watchlistNames){
        appendToWatchlistNames(entryName, entriesList);
    }
}

function init_watchlist(watchlist_name) {
    clearTable();
    symbolsInCurrentWatchlist = []
    chrome.storage.local.get(watchlist_name, function(res) {
        console.log("Symbols fetched from storage: ", res)
        if (res.hasOwnProperty(watchlist_name)) {
            symbolsInCurrentWatchlist = res[watchlist_name];
            createTable(symbolsInCurrentWatchlist);
            if(symbolsInCurrentWatchlist.length)
                getVisibleElements();
        }

    })
}

function createWatchlist() {
    var entryName = prompt("Enter watchlist name:");
    if (entryName) {
        selectedWatchlist = entryName;
        UpdateStorage(SELECTED_WATCHLIST, selectedWatchlist);
        setSelectedWatchlistButton(selectedWatchlist);
        init_watchlist(selectedWatchlist);
        listWatchlists([entryName]);
        AddWatchlist(entryName);
    }
}
function AddWatchlist(watchlistName) {
    watchlistNames.push(watchlistName);
    UpdateStorage(WATCHLIST_KEY, watchlistNames);
}
function UpdateStorage(key, value) {
    obj = {}
    obj[key] = value;
    chrome.storage.local.set(obj, function (){console.log("Updated storage:", key, value)});
}
function AddSymbolsToSelectedWatchlist(symbols) {
    symbolsInCurrentWatchlist = symbolsInCurrentWatchlist.concat(symbols);
    symbolsInCurrentWatchlist = symbolsInCurrentWatchlist.filter(function(item, i, ar){ return ar.indexOf(item) === i; });
    UpdateStorage(selectedWatchlist, symbolsInCurrentWatchlist);
}
function addToArray() {
    var inputField = prompt("Enter symbols (comma separated to add multiple symbols)");
    if(inputField == null) inputField = "";
    var inputValue = inputField.trim(); // Remove leading/trailing spaces
    if (inputValue !== "") {
        var values = inputValue.split(",");
        values = values.map(function (value) {
            return value.trim()
        });
        values = values.filter(item => item !== "");
        symbols = symbols.map(str => {
            str = str.replace(/\s+/g, '');
            if (!(str.startsWith('NSE:') || str.startsWith('BSE:'))) {
              return 'NSE:' + str;
            }
            return str;
          });
        createTable(values);
        AddSymbolsToSelectedWatchlist(values);

    }
}

function createTable(dataArray) {
    var tableBody = document.querySelector("#myTable tbody");
    for (var i = 0; i < dataArray.length; i++) {
        appendSymbolToTable(dataArray[i], tableBody);
    }
}


function rowClickHandler(event) {
  var clickedRow = event.target.closest('tr');
  if (!clickedRow) return;
  var symbol = clickedRow.cells[0].getAttribute('data-name');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {symbol: symbol}, function(response) {});
    });

}

function clearTable(){
    var tableBody = document.querySelector("#myTable tbody");
    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }
}

function appendSymbolToTable(Symbol, tableBody) {
    // Create a table row (<tr> element)
    var tableRow = document.createElement('tr');
    tableRow.setAttribute('data-name', Symbol);
    tableRow.setAttribute('change-pct', -101); // assign lowest change in price for sorting
    // Create a table header cell (<th> element) with the "scope" attribute
    var th = document.createElement('td');
    th.setAttribute('scope', 'row');
    th.textContent = Symbol.split(':')[1];
    // observer.observe(th);
    // Create regular table cells (<td> elements) for the other columns
    var td1 = document.createElement('td');
    td1.textContent = '-';

    var td2 = document.createElement('td');
    td2.textContent = '-';

    var td3 = document.createElement('td');
    td3.textContent = '-';

    // Create a cell for the button
    var buttonCell = document.createElement('td');

    // Create the button element
    var closeButton = document.createElement('button');
    closeButton.setAttribute('type', 'button');
    closeButton.classList.add('btn-close');
    closeButton.classList.add('btn-sm');
    closeButton.classList.add('p-2');
    closeButton.classList.add('delete-symbol');
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.addEventListener('click', deleteSymbolFromWatchlist);

    // Append the button to its cell
    buttonCell.appendChild(closeButton);

    // Append all cells to the table row
    tableRow.appendChild(th);
    tableRow.appendChild(td1);
    tableRow.appendChild(td2);
    tableRow.appendChild(td3);
    tableRow.appendChild(buttonCell);

    // Append the table row to a table element with the id "myTable" (assuming such a table exists)
    tableRow.addEventListener("click", rowClickHandler);
    tableBody.appendChild(tableRow);

}

function appendToWatchlistNames(name, list){
    var listItem = document.createElement('li');

    // Create an anchor (<a> element) with the specified class and href
    var anchor = document.createElement('a');
    anchor.classList.add('dropdown-item');
    anchor.setAttribute('href', '#');
    anchor.textContent = name;
    listItem.addEventListener("click", (event) => {
        // console.log(event.target.textContent);
        selectedWatchlist = event.target.textContent;
        UpdateStorage(SELECTED_WATCHLIST, selectedWatchlist);
        setSelectedWatchlistButton(selectedWatchlist);
        init_watchlist(event.target.textContent)
    });
    var closeButton = document.createElement('button');
    closeButton.setAttribute('type', 'button');
    closeButton.classList.add('btn-close');
    closeButton.classList.add('btn-sm');
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.addEventListener('click', deleteWatchlist);
    // Append the anchor to the list item
    listItem.appendChild(anchor);
    listItem.appendChild(closeButton);
    list.appendChild(listItem);
}

function deleteSymbolFromWatchlist(event){
    var clickedRow = event.target.parentNode.parentNode; // Get the row of clicked button
    if (!clickedRow) return;
    var symbol = clickedRow.cells[0].getAttribute('data-name');
    const index = symbolsInCurrentWatchlist.indexOf(symbol);
    clickedRow.parentNode.removeChild( clickedRow );

    if (index > -1) { // only splice array when item is found
        symbolsInCurrentWatchlist.splice(index, 1); // 2nd parameter means remove one item only
    }
    UpdateStorage(selectedWatchlist, symbolsInCurrentWatchlist);
    event.stopPropagation();

}

function deleteWatchlist(event){
    var clickedRow = event.target.parentNode; // Get the row of clicked button
    if (!clickedRow) return;
    var symbol = clickedRow.firstChild.textContent;
    const index = watchlistNames.indexOf(symbol);
    clickedRow.parentNode.removeChild(clickedRow);

    if (index > -1) { // only splice array when item is found
        watchlistNames.splice(index, 1); // 2nd parameter means remove one item only
    }
    if (watchlistNames.length > 0) {
        selectedWatchlist = watchlistNames[0];
        UpdateStorage(SELECTED_WATCHLIST, selectedWatchlist);
        setSelectedWatchlistButton(selectedWatchlist);
        init_watchlist(selectedWatchlist);
    }

    UpdateStorage(WATCHLIST_KEY, watchlistNames);
    event.stopPropagation();

}

function csvToJSON(csv) {
    var lines = csv.split("\n");
    var result = [];
    var headers;
    headers = lines[0].split(",");

    for (var i = 1; i < lines.length; i++) {
        var obj = {};

        if(lines[i] == undefined || lines[i].trim() == "") {
            continue;
        }

        var words = lines[i].split(",");
        for(var j = 0; j < words.length; j++) {
            obj[headers[j].trim()] = words[j];
        }

        result.push(obj);
    }
    console.log(result);
}

function updateLivePrices(symbolList) {
    tableBody = document.getElementById("symbolList");
    symbolList = symbolList.map(symbol => {
        if (isNaN(parseInt(symbol['change'].charAt(0), 10))){
            // console.log()
            symbol['change'] = parseFloat(symbol['change'].slice(1)) * -1
            symbol['changepct'] = parseFloat(symbol['changepct'].slice(1)) * -1
        }
        else{
            symbol['change'] = parseFloat(symbol['change'])
            symbol['changepct'] = parseFloat(symbol['changepct'])
        }
        return symbol
    })
    symbolList.forEach(symbol => {
        // console.log('symbol to search', symbol)
        if (document.querySelector(`#symbolList tr[data-name='${symbol['symbol']}'`)){
            row = document.querySelector(`#symbolList tr[data-name='${symbol['symbol']}'`)
            row.setAttribute('change-pct', symbol['changepct']);
            row.children.item(1).textContent = symbol['last'];
            row.children.item(2).textContent = symbol['change'];
            row.children.item(3).textContent = symbol['changepct'] + '%';
            if (symbol['change']<0){
                row.children.item(2).classList.remove('price_green');
                row.children.item(2).classList.add('price_red');
                row.children.item(3).classList.remove('price_green');
                row.children.item(3).classList.add('price_red');
            }
            else{
                row.children.item(2).classList.remove('price_red');
                row.children.item(2).classList.add('price_green');
                row.children.item(3).classList.remove('price_red');
                row.children.item(3).classList.add('price_green');
            }
        }
    })
    sortSymbolsByPriceChange();
}

initv3();

function sortSymbolsByPriceChange(){
    var list = document.getElementById('symbolList');

    var items = list.childNodes;
    itemsArr = []
    for (var i in items) {
        if (items[i].nodeType == 1) { // get rid of the whitespace text nodes
            itemsArr.push(items[i]);
        }
    }
    itemsArr.sort(function(a, b) {
    return b.getAttribute('change-pct') - a.getAttribute('change-pct');
    });

    for (i = 0; i < itemsArr.length; ++i) {
        list.appendChild(itemsArr[i]);
    }
}

function getVisibleElements( ) {
    if(timer !== null) {
        clearTimeout(timer);
    }
    timer = setTimeout(function() {
        const allElements = document.querySelectorAll('#symbolList tr');
        let elements = [];
        allElements.forEach(function(node){
            let clientRect = node.getBoundingClientRect();
            if (!(window.innerHeight <= clientRect.top || (clientRect.top <= 0 && clientRect.bottom <= 0)) ) {
            // console.log(node, node.children);
            if (node.getAttribute('data-name') != null)
                elements.push(node.getAttribute('data-name'));
            }
        });
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {visible_symbols: elements}, function(response) {});
        });
  }, 400);

};

function sendSymbolBatch(){
    console.log("sending batch", symbolsInCurrentWatchlist.slice(currentIndex, currentIndex+BATCHSIZE))
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {visible_symbols: symbolsInCurrentWatchlist.slice(currentIndex, currentIndex+BATCHSIZE)}, function(response) {
        });
    });
    currentIndex+=BATCHSIZE;
    if (currentIndex > symbolsInCurrentWatchlist.length) currentIndex = 0;
}
