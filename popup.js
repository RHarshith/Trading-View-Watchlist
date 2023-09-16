var selectedWatchlist = null;
const WATCHLIST_KEY = 'watchlist_4c70dd20-2688-4a0f-bfc1-ff6a8eff097d';
var watchlistNames = [];
var symbolsInCurrentWatchlist = [];

function initv2() {
    chrome.storage.local.get(WATCHLIST_KEY, function(res) {
        if (res.hasOwnProperty(WATCHLIST_KEY)) {
            watchlistNames = res[WATCHLIST_KEY];
            console.log("fetched all watchlists:", watchlistNames);
            selectedWatchlist = watchlistNames[0];
            setSelectedWatchlistButton(selectedWatchlist);
            listWatchlists(watchlistNames);
            init_watchlist(selectedWatchlist);
        }
        else {
            selectedWatchlist = 'watchlist';
            watchlistNames = ['watchlist'];
            listWatchlists(watchlistNames);
            init_watchlist(selectedWatchlist);
            UpdateStorage(WATCHLIST_KEY, watchlistNames);
        }

    })
    document.getElementById("inputSubmit").addEventListener("click", addToArray);
    document.getElementById("createWatchlist").addEventListener("click", createWatchlist);
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
    chrome.storage.local.get(watchlist_name, function(res) {
        console.log("Symbols fetched from storage: ", res)
        if (res.hasOwnProperty(watchlist_name)) {
            symbolsInCurrentWatchlist = res[watchlist_name];
            createTable(symbolsInCurrentWatchlist);
        }

    })
}

function createWatchlist() {
    var entryName = prompt("Enter watchlist name:");
    if (entryName) {
        selectedWatchlist = entryName;
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
        values.filter(item => item !== "");
        createTable(values);
        AddSymbolsToSelectedWatchlist(values);

    }
}

function createTable(dataArray) {
    var tableBody = document.querySelector("#myTable tbody");
    for (var i = 0; i < dataArray.length; i++) {
        appendSymbolToTable(dataArray[i], tableBody);
        // var row = document.createElement("tr");

        // // Iterate through the object properties to populate the columns
        // for (var key of ['Symbol', 'Last', 'Chg', 'ChgPercent']) {
        //     var cell = document.createElement("td");
        //     cell.textContent = dataArray[i][key];
        //     row.appendChild(cell);
        // }

        // // Add a click event listener to each row with a closure

        // row.addEventListener("click", rowClickHandler);

        // tableBody.appendChild(row);
    }
}


function rowClickHandler(event) {
  var clickedRow = event.target.closest('tr');
  if (!clickedRow) return;
  var symbol = clickedRow.cells[0].textContent;
  // Wuery the active tab, which will be only one tab and inject the script in it.
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    url = tabs[0].url;
    main_url = url.split(/[=]/)[0];
    main_url = main_url + "=" + symbol;
    chrome.tabs.update(undefined, { url: main_url });
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

    // Create a table header cell (<th> element) with the "scope" attribute
    var th = document.createElement('td');
    th.setAttribute('scope', 'row');
    th.textContent = Symbol;

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
        console.log(event.target.textContent);
        selectedWatchlist = event.target.textContent;
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
    var symbol = clickedRow.cells[0].textContent;
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
    UpdateStorage(WATCHLIST_KEY, watchlistNames);
    event.stopPropagation();

}

initv2();

