var selectedWatchlist = null;
const WATCHLIST_KEY = 'watchlist';
var watchlistNames = [];
var symbolsInCurrentWatchlist = [];

function initv2() {
    chrome.storage.local.get(WATCHLIST_KEY, function(res) {
        if (res.hasOwnProperty(WATCHLIST_KEY)) {
            watchlistNames = res[WATCHLIST_KEY];
            console.log("fetched all watchlists:", watchlistNames);
            listWatchlists(watchlistNames);
            init_watchlist(watchlistNames[0]);
        }

    })
    document.getElementById("inputSubmit").addEventListener("click", addToArray);
    document.getElementById("createWatchlist").addEventListener("click", createWatchlist);
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
    UpdateStorage(selectedWatchlist, symbolsInCurrentWatchlist);
}
function addToArray() {
    var inputField = document.getElementById("inputField");
    var inputValue = inputField.value.trim(); // Remove leading/trailing spaces
    if (inputValue !== "") {
        var values = inputValue.split(",");
        values = values.map(function (value) {
            return { Symbol: value.trim(), Last: 150.25, Chg: 2.75, ChgPercent: 1.85 }
        });
        inputField.value = ""; // Clear the input field
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
    var th = document.createElement('th');
    th.setAttribute('scope', 'row');
    th.textContent = Symbol['Symbol'];

    // Create regular table cells (<td> elements) for the other columns
    var td1 = document.createElement('td');
    td1.textContent = Symbol['Last'];

    var td2 = document.createElement('td');
    td2.textContent = Symbol['Chg'];

    var td3 = document.createElement('td');
    td3.textContent = Symbol['Chg%'];

    // Create a cell for the button
    var buttonCell = document.createElement('td');

    // Create the button element
    var closeButton = document.createElement('button');
    closeButton.setAttribute('type', 'button');
    closeButton.classList.add('btn-close');
    closeButton.setAttribute('aria-label', 'Close');

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
        init_watchlist(event.target.textContent)
    });
    // Append the anchor to the list item
    listItem.appendChild(anchor);
    list.appendChild(listItem);
}

initv2();

