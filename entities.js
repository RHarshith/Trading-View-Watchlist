const Constants = Object.freeze({
    DEFAULT_EXCHANGE: 'NSE:',
    DEFAULT_WATCHLIST_NAME: 'watchlist',
})

const StorageKeys = Object.freeze({
    WATCHLISTS: 'watchlist_4c70dd20-2688-4a0f-bfc1-ff6a8eff097d',
    CONFIGURABLES: 'configurables'
})

const WatchlistConfigurables = Object.freeze({
    SELECTED_WATCHLIST: 'selected_watchlist',
    WATCHLISTS: 'watchlists'
})

function UpdateStorage(key, value) {
    obj = {}
    obj[key] = value;
    chrome.storage.local.set(obj, function () { console.log("Updated storage:", key, value) });
}

class Watchlist {
    static BATCHSIZE = 10;

    constructor(name=Constants.DEFAULT_WATCHLIST_NAME) {
        // console.log(name);
        this.name = name;
        this.stocks = [];
        this.currentIndex = 0;
    }
    addStocks(symbols){
        symbols = symbols.map(function (value) {
            return value.trim()
        });
        symbols = symbols.filter(item => item !== "");

        var newStocks = symbols.map(symbol => {
            symbol = symbol.replace(/\s+/g, '');
            if (!symbol.includes(':'))
                symbol = Constants.DEFAULT_EXCHANGE + symbol;
            return symbol;
        });
        this.stocks = this.stocks.concat(newStocks);
        this.updateStorage();
        return newStocks;
    }

    deleteStock(symbol) {
        const index = this.stocks.indexOf(symbol);
        if (index > -1) { // only splice array when item is found
            this.stocks.splice(index, 1); // 2nd parameter means remove one item only
            this.updateStorage();
        }
    }

    async fetchStocksFromStorage(){
        var stocks = await chrome.storage.local.get(this.name);
        if (stocks.hasOwnProperty(this.name)){
            this.stocks = stocks[this.name];
        }
        return this;
    }

    updateStorage() {
        UpdateStorage(this.name, this.symbols);
    }

    get symbols() {
        return this.stocks;
    }

    sendSymbolBatch() {
        console.log("sending batch", this.symbols.slice(this.currentIndex, this.currentIndex + Watchlist.BATCHSIZE))
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { visible_symbols: this.symbols.slice(this.currentIndex, this.currentIndex + Watchlist.BATCHSIZE) }, function (response) {
            });
        });
        this.currentIndex += Watchlist.BATCHSIZE;
        if (this.currentIndex > this.stocks.length) this.currentIndex = 0;
    }
}


class Configurables {
    static SORT_TYPE = {Unsorted: 'unsorted', Asc: 'asc', Desc: 'desc'}
    static PRICE_UPDATE_METHOD = {OnScroll: 'onscroll', RoundRobin: 'roundrobin'}
    static SELECTED_WATCHLIST_KEY = 'selected_watchlist'
    static SORT_TYPE_KEY = 'sort_status'
    static WATCHLISTS_KEY = 'watchlists'
    static PRICE_UPDATE_METHOD_KEY = 'price_update_method'

    constructor() {
        this.selectedWatchlist = null;
        this.watchlists = [Constants.DEFAULT_WATCHLIST_NAME];
        this.sortType = Configurables.SORT_TYPE.Unsorted;
        this.priceUpdateMethod = Configurables.PRICE_UPDATE_METHOD.OnScroll;
    }

    async getConfigurablesFromStorage() {
        var configurables = await chrome.storage.local.get(
            StorageKeys.CONFIGURABLES
        )

        if (configurables.hasOwnProperty(StorageKeys.CONFIGURABLES)){
            configurables = configurables[StorageKeys.CONFIGURABLES]
            this.watchlists = configurables[Configurables.WATCHLISTS_KEY]
            // console.log(configurables[Configurables.SELECTED_WATCHLIST_KEY])
            this.selectedWatchlist = await new Watchlist(
                configurables[Configurables.SELECTED_WATCHLIST_KEY]
            ).fetchStocksFromStorage()
            console.log()
            this.sortType = configurables[Configurables.SORT_TYPE]
            this.priceUpdateMethod = configurables[Configurables.PRICE_UPDATE_METHOD_KEY]
        }
        else {
            this.selectedWatchlist = await new Watchlist(this.watchlists[0]).fetchStocksFromStorage();
            this.updateStorage();
        }

    }
    updateStorage() {
        const obj = {
            [Configurables.WATCHLISTS_KEY]: this.watchlists,
            [Configurables.SELECTED_WATCHLIST_KEY]: this.selectedWatchlist.name,
            [Configurables.PRICE_UPDATE_METHOD_KEY]: this.priceUpdateMethod,
            [Configurables.SORT_TYPE_KEY]: this.sortType
        };
        UpdateStorage(StorageKeys.CONFIGURABLES, obj);
    }
    async deleteWatchlist(watchlistName) {
        const index = this.watchlists.indexOf(watchlistName);
        if (index > -1) { // only splice array when item is found
            this.watchlists.splice(index, 1); // 2nd parameter means remove one item only
            if (this.watchlists.length > 0)
            this.selectedWatchlist = await new Watchlist(
                this.watchlists[0]
            ).fetchStocksFromStorage();
            this.updateStorage();
        }

    }
    async selectWatchlist(watchlistName){
        console.log(watchlistName);
        this.selectedWatchlist = await new Watchlist(watchlistName).fetchStocksFromStorage();
        console.log('new watchlist selected', this.selectedWatchlist)
        this.updateStorage();
    }
    async addWatchlist(watchlistName){
        if (watchlistName && !this.watchlists.includes(watchlistName)){
            console.log('adding watchlist', watchlistName);
            this.watchlists.push(watchlistName);
            await this.selectWatchlist(watchlistName);
        }
    }
}

class WatchlistInterface {
    static tableBody = document.querySelector("#myTable tbody");
    static scrollPriceUpdateTimer = null;

    static appendSymbolToTable(symbol, deleteSymbolEventListener) {
        // Create a table row (<tr> element)
        var tableRow = document.createElement('tr');
        tableRow.setAttribute('data-name', symbol);
        tableRow.setAttribute('change-pct', -101); // assign lowest change in price for sorting
        // Create a table header cell (<th> element) with the "scope" attribute
        var th = document.createElement('td');
        th.setAttribute('scope', 'row');
        th.textContent = symbol.split(':')[1];
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
        closeButton.addEventListener('click', deleteSymbolEventListener);

        // Append the button to its cell
        buttonCell.appendChild(closeButton);

        // Append all cells to the table row
        tableRow.appendChild(th);
        tableRow.appendChild(td1);
        tableRow.appendChild(td2);
        tableRow.appendChild(td3);
        tableRow.appendChild(buttonCell);

        tableRow.addEventListener("click", WatchlistInterface.openChartEventListener);
        WatchlistInterface.tableBody.appendChild(tableRow);

    }

    static clearTable() {
        while (WatchlistInterface.tableBody.firstChild) {
            WatchlistInterface.tableBody.removeChild(WatchlistInterface.tableBody.firstChild);
        }
    }

    static createTable(symbols, eventListener) {
        console.log(symbols);
        symbols.forEach(symbol => {
            WatchlistInterface.appendSymbolToTable(symbol, eventListener)
        });
    }

    static openChartEventListener(event) {
        console.log('clicked row');
        var clickedRow = event.target.closest('tr');
        console.log(clickedRow);
        if (!clickedRow) return;
        var symbol = clickedRow.getAttribute('data-name');
        console.log(symbol);
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { symbol: symbol }, function (response) { });
        });
    }

    static deleteSymbol(event) {
        var clickedRow = event.target.parentNode.parentNode; // Get the row of clicked button
        if (!clickedRow) return;
        var symbol = clickedRow.getAttribute('data-name');
        clickedRow.parentNode.removeChild(clickedRow);
        event.stopPropagation();
        return symbol;
    }
    static getVisibleElements() {
        if (WatchlistInterface.scrollPriceUpdateTimer !== null) {
            clearTimeout(WatchlistInterface.scrollPriceUpdateTimer);
        }
        WatchlistInterface.scrollPriceUpdateTimer = setTimeout(function () {
            const allElements = document.querySelectorAll('#symbolList tr');
            let elements = [];
            allElements.forEach(function (node) {
                let clientRect = node.getBoundingClientRect();
                if (!(window.innerHeight <= clientRect.top || (clientRect.top <= 0 && clientRect.bottom <= 0))) {
                    // console.log(node, node.children);
                    if (node.getAttribute('data-name') != null)
                        elements.push(node.getAttribute('data-name'));
                }
            });
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { visible_symbols: elements }, function (response) { });
            });
        }, 400);

    };

    static updateLivePrices(symbolList) {
        symbolList = symbolList.map(symbol => {
            if (isNaN(parseInt(symbol['change'].charAt(0), 10))) {
                // console.log()
                symbol['change'] = parseFloat(symbol['change'].slice(1)) * -1
                symbol['changepct'] = parseFloat(symbol['changepct'].slice(1)) * -1
            }
            else {
                symbol['change'] = parseFloat(symbol['change'])
                symbol['changepct'] = parseFloat(symbol['changepct'])
            }
            return symbol
        })
        symbolList.forEach(symbol => {
            // console.log('symbol to search', symbol)
            if (document.querySelector(`#symbolList tr[data-name='${symbol['symbol']}'`)) {
                var row = document.querySelector(`#symbolList tr[data-name='${symbol['symbol']}'`)
                row.setAttribute('change-pct', symbol['changepct']);
                row.children.item(1).textContent = symbol['last'];
                row.children.item(2).textContent = symbol['change'];
                row.children.item(3).textContent = symbol['changepct'] + '%';
                if (symbol['change'] < 0) {
                    row.children.item(2).classList.remove('price_green');
                    row.children.item(2).classList.add('price_red');
                    row.children.item(3).classList.remove('price_green');
                    row.children.item(3).classList.add('price_red');
                }
                else {
                    row.children.item(2).classList.remove('price_red');
                    row.children.item(2).classList.add('price_green');
                    row.children.item(3).classList.remove('price_red');
                    row.children.item(3).classList.add('price_green');
                }
            }
        })
        WatchlistInterface.sortSymbolsByPriceChange();
    }

    static sortSymbolsByPriceChange() {
        var list = document.getElementById('symbolList');
        var items = list.childNodes;
        var itemsArr = [];
        for (var i in items) {
            if (items[i].nodeType == 1) { // get rid of the whitespace text nodes
                itemsArr.push(items[i]);
            }
        }
        itemsArr.sort(function (a, b) {
            return b.getAttribute('change-pct') - a.getAttribute('change-pct');
        });

        for (i = 0; i < itemsArr.length; ++i) {
            list.appendChild(itemsArr[i]);
        }
    }
}

class WatchlistOptionsInterface {

    static deleteWatchlist(event) {
        var clickedRow = event.target.parentNode; // Get the row of clicked button
        if (!clickedRow) return null;
        var symbol = clickedRow.getAttribute('data-name');
        clickedRow.parentNode.removeChild(clickedRow);
        event.stopPropagation();
        return symbol;

    }

    static setSelectedWatchlistButton(watchlistName) {
        var watchlistButton = document.getElementById("navbarDropdownMenuLink");
        watchlistButton.textContent = watchlistName;
    }

    static listWatchlists(watchlists, selectEventListener, deleteEventListener) {
        watchlists.forEach(
            watchlist => {
                WatchlistOptionsInterface.appendToWatchlistNames(watchlist,selectEventListener, deleteEventListener);
            }
        );
    }

    static appendToWatchlistNames(name, selectWatchlistEventListener, deleteWatchlistEventListener) {
        var list = document.getElementById("entries");
        var listItem = document.createElement('li');
        listItem.setAttribute('data-name', name);
        // Create an anchor (<a> element) with the specified class and href
        var anchor = document.createElement('a');
        anchor.classList.add('dropdown-item');
        anchor.setAttribute('href', '#');
        anchor.textContent = name;
        listItem.addEventListener("click", selectWatchlistEventListener);
        var closeButton = document.createElement('button');
        closeButton.setAttribute('type', 'button');
        closeButton.classList.add('btn-close');
        closeButton.classList.add('btn-sm');
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.addEventListener('click', deleteWatchlistEventListener);
        // Append the anchor to the list item
        listItem.appendChild(anchor);
        listItem.appendChild(closeButton);
        list.appendChild(listItem);
    }

    static clearTable() {
        var list = document.getElementById("entries");
        while (list.firstChild) {
            list.removeChild(list.firstChild);
        }
    }

}


class MasterInterface{
    constructor(){
        this.configurables = new Configurables();
    }
    async init(){
        await this.configurables.getConfigurablesFromStorage();
        await this.configurables.selectedWatchlist.fetchStocksFromStorage();
        document.getElementById("inputSubmit").addEventListener("click", this.addNewStocks.bind(this));
        document.getElementById("createWatchlist").addEventListener("click", this.createWatchlist.bind(this));
        document.querySelector(".table-container").addEventListener("scroll", WatchlistOptionsInterface.getVisibleElements);
        // toggleSwitch = document.getElementById("toggleSort");
        // if (this.configurables.priceUpdateMethod==Configurables.PRICE_UPDATE_METHOD.RoundRobin) {
        //     toggleSwitch.setAttribute("checked", "")
        // }
        // toggleSwitch.addEventListener("click", toggleSort);
        this.initWatchlistOptions();
        this.initWatchlist();
        chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
            if (msg.livePrices != null) {
                // console.log('found live prices', msg.livePrices)
                WatchlistInterface.updateLivePrices(msg.livePrices);
                sendResponse("done");
            }
            return true;
        });

    }
    async selectWatchlistEventListener(event){
        console.log(event.target);
        var watchlist = event.currentTarget.getAttribute('data-name');
        console.log('clicked on watchlist', watchlist);
        await this.configurables.selectWatchlist(watchlist);
        console.log(this.configurables.selectedWatchlist);
        WatchlistOptionsInterface.setSelectedWatchlistButton(this.configurables.selectedWatchlist.name);
        this.initWatchlist();
    }

    async deleteWatchlistEventListener(event){
        var deletedWatchlist = await WatchlistOptionsInterface.deleteWatchlist(event);
        console.log("deleting watchlist", deletedWatchlist);
        this.configurables.deleteWatchlist(deletedWatchlist);
        if(this.configurables.watchlists.length > 0)
        WatchlistOptionsInterface.setSelectedWatchlistButton(
                this.configurables.selectedWatchlist.name
            )
    }

    deleteSymbolEventListener(event){
        var deletedSymbol = WatchlistInterface.deleteSymbol(event);
        this.configurables.selectedWatchlist.deleteStock(deletedSymbol);
    }

    initWatchlist(){
        WatchlistInterface.clearTable();
        WatchlistInterface.createTable(
            this.configurables.selectedWatchlist.symbols,
            this.deleteSymbolEventListener.bind(this)
        );
        WatchlistInterface.getVisibleElements();

    }

    initWatchlistOptions(){
        WatchlistOptionsInterface.clearTable();
        WatchlistOptionsInterface.listWatchlists(
            this.configurables.watchlists,
            this.selectWatchlistEventListener.bind(this),
            this.deleteWatchlistEventListener.bind(this)
        );
        WatchlistOptionsInterface.setSelectedWatchlistButton(
            this.configurables.selectedWatchlist.name
        );
    }

    addNewStocks(){
        var inputField = prompt("Enter symbols (comma separated to add multiple symbols)");
        if (inputField == null) inputField = "";
        var inputValue = inputField.trim(); // Remove leading/trailing spaces
        if (inputValue !== "") {
            var values = inputValue.split(",");
            values = this.configurables.selectedWatchlist.addStocks(values);
            console.log('adding values', values)
            WatchlistInterface.createTable(
                values,
                this.deleteSymbolEventListener.bind(this)
            );
            WatchlistInterface.getVisibleElements();
        }
    }

    async createWatchlist() {
        var entryName = prompt("Enter watchlist name:");
        if (entryName) {
            await this.configurables.addWatchlist(entryName);
            console.log(this.configurables.selectedWatchlist);
            this.initWatchlistOptions();
            this.initWatchlist();
        }
    }
}


masterInterface = new MasterInterface();
masterInterface.init();