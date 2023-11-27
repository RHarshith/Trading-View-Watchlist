const Constants = Object.freeze({
    DEFAULT_EXCHANGE: 'NSE:',
    DEFAULT_WATCHLIST_NAME: 'watchlist',
    SCAN_API: "https://scanner.tradingview.com/india/scan"
})
var responseGlobal = null;
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

class Utils {
    static getElementIndex(elem){
        var  i= 1;
        while((elem=elem.previousSibling)!=null) ++i;
        return i;
    }
}

class Watchlist {

    constructor(name=Constants.DEFAULT_WATCHLIST_NAME) {
        // console.log(name);
        this.name = name;
        this.stocks = [];
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
}


class Configurables {
    static SORT_TYPE = {Unsorted: 'unsorted', Asc: 'asc', Desc: 'desc'}
    static PRICE_UPDATE_METHOD = {None: 'none', OnScroll: 'onscroll', RoundRobin: 'roundrobin'}
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
            if(Object.values(Configurables.SORT_TYPE).includes(configurables[Configurables.SORT_TYPE_KEY])){
                console.log(configurables[Configurables.SORT_TYPE_KEY]);
                this.sortType = configurables[Configurables.SORT_TYPE_KEY]
            }
            if(typeof(configurables[Configurables.PRICE_UPDATE_METHOD_KEY], "string"))
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
    static selectedSymbol = null;

    static appendSymbolToTable(symbol, deleteSymbolEventListener) {
        // Create a table row (<tr> element)
        var tableRow = document.createElement('tr');
        tableRow.setAttribute('data-name', symbol);
        tableRow.setAttribute('change-pct', null); // assign lowest change in price for sorting
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
        tableRow.addEventListener("click", WatchlistInterface.selectedWatchlistEventListener)
        WatchlistInterface.tableBody.appendChild(tableRow);

    }
    static symbolKeyboardEventListener(event){
        if (!['ArrowUp', 'ArrowDown', 'Delete'].includes(event.key))
            return;
        if (event.key === "Delete") {
            if (WatchlistInterface.selectedSymbol !== null){
                document.querySelector(`#symbolList tr:nth-child(${WatchlistInterface.selectedSymbol}) .delete-symbol`).click()
            }
        }

        if (event.key === "ArrowUp") {
            var prevRow = document.querySelector(`#symbolList > tr`);
            if (WatchlistInterface.selectedSymbol !== null){
                prevRow = document.querySelector(`#symbolList tr:nth-child(${WatchlistInterface.selectedSymbol})`).previousElementSibling;
            }
            if(prevRow) prevRow.click();
        }
        else if (event.key === "ArrowDown") {
            var nextRow = document.querySelector(`#symbolList > tr`);
            if (WatchlistInterface.selectedSymbol !== null){
                nextRow = document.querySelector(`#symbolList tr:nth-child(${WatchlistInterface.selectedSymbol})`).nextElementSibling;
            }
            if(nextRow) nextRow.click();
        }

    }
    static selectedWatchlistEventListener(event) {
        var row = event.currentTarget;
        if(WatchlistInterface.selectedSymbol !== null){
            var prevRow = document.querySelector(`#symbolList tr:nth-child(${WatchlistInterface.selectedSymbol})`)
            prevRow.classList.remove("selected-symbol");
        }
        row.classList.add("selected-symbol");
        WatchlistInterface.selectedSymbol = Utils.getElementIndex(row);
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
        var nextRow = clickedRow.nextElementSibling;
        WatchlistInterface.selectedSymbol = null;
        if(nextRow !== null){
            nextRow.click();
        }
        clickedRow.parentNode.removeChild(clickedRow);
        event.stopPropagation();
        return symbol;
    }


    static updateLivePrices(symbolList, sortType) {
        console.log(symbolList);
        symbolList.forEach(symbol => {
            // console.log('symbol to search', symbol)
            if (document.querySelector(`#symbolList tr[data-name='${symbol['symbol']}']`)) {
                var row = document.querySelector(`#symbolList tr[data-name='${symbol['symbol']}']`)
                row.setAttribute('change-pct', symbol['changepct']);
                row.children.item(1).textContent = symbol['last'];
                row.children.item(2).textContent = symbol['change'];
                row.children.item(3).textContent = symbol['changepct']+'%';
            }
            else{
                console.log('symbol not found', symbol)
            }
        })
        WatchlistInterface.sortSymbolsByPriceChange(sortType);
        WatchlistInterface.colorPriceChange();
    }

    static sortSymbolsByPriceChange(sortType) {
        if (sortType === Configurables.SORT_TYPE.Unsorted) return;
        var defaultPrice = -101; // If sort in desc, then undefined values should go at bottom
        if (sortType === Configurables.SORT_TYPE.Asc)
            defaultPrice = 10000; // If sort in asc, then undefined values should go at bottom
        var list = document.getElementById('symbolList');
        var items = list.childNodes;
        console.log(items);
        var itemsArr = [];
        for (var i in items) {
            if (items[i].nodeType == 1) { // get rid of the whitespace text nodes
                if (isNaN(items[i].getAttribute('change-pct')))
                    items[i].setAttribute('change-pct', defaultPrice);
                var item = {
                    'data-name': items[i].getAttribute('data-name'),
                    'symbol': items[i].children.item(0).textContent,
                    'last': items[i].children.item(1).textContent,
                    'change': items[i].children.item(2).textContent,
                    'changepct': items[i].children.item(3).textContent,
                    'change-pct': items[i].getAttribute('change-pct'),
                }
                itemsArr.push(item);
            }
        }
        itemsArr.sort(function (a, b) {
            if(sortType === Configurables.SORT_TYPE.Asc)
                return a['change-pct'] - b['change-pct'];
            return b['change-pct'] - a['change-pct'];
        });

        console.log(itemsArr[i]);
        for (i = 0; i < itemsArr.length; ++i) {
            items[i].setAttribute('data-name', itemsArr[i]['data-name']);
            items[i].setAttribute('change-pct', itemsArr[i]['change-pct']);
            items[i].children.item(0).textContent = itemsArr[i]['symbol'];
            items[i].children.item(1).textContent = itemsArr[i]['last'];
            items[i].children.item(2).textContent = itemsArr[i]['change'];
            if(itemsArr[i]['change-pct'] === defaultPrice){
                items[i].children.item(3).textContent = '-';
                items[i].setAttribute('change-pct', null);
            }
            else
                items[i].children.item(3).textContent = itemsArr[i]['change-pct'] +'%';
            // list.appendChild(itemsArr[i]);
        }
    }

    static colorPriceChange(){
        var symbolList = document.getElementById('symbolList');
        var rows = symbolList.childNodes;
        rows.forEach(
            row => {
                if (row.getAttribute('change-pct') < 0) {
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
        )
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
    static PRICEUPDATEINTERVAL = 10000;
    static BATCHSIZE = 30;

    constructor(){
        this.configurables = new Configurables();
        this.currentIndex = 0;
    }
    async init(){
        await this.configurables.getConfigurablesFromStorage();
        await this.configurables.selectedWatchlist.fetchStocksFromStorage();
        document.getElementById("inputSubmit").addEventListener("click", this.addNewStocks.bind(this));
        document.getElementById("createWatchlist").addEventListener("click", this.createWatchlist.bind(this));
        document.getElementById("priceSortButton").addEventListener("click", this.priceSortMethodEventListener.bind(this));
        this.initWatchlistOptions();
        this.initWatchlist();
        document.addEventListener('keydown', WatchlistInterface.symbolKeyboardEventListener);
        console.log(this.configurables);
        this.initLivePrices();
        if(true || MasterInterface.isTradingHours())
            setInterval(
                this.initLivePrices.bind(this),
                MasterInterface.PRICEUPDATEINTERVAL
            )
    }

    async initLivePrices(){
        var ApiResponses = [];
        this.configurables.selectedWatchlist.symbols.forEach(
            symbol => {
                var payload = JSON.stringify({"filter":[{"left":"name","operation":"match","right":symbol.split(':')[1]},{"left":"exchange","operation":"equal","right":symbol.split(':')[0]}],"options":{"lang":"en"},"markets":["india"],"columns":["logoid","name","close","change","change_abs","volume","Value.Traded","market_cap_basic","sector","description", "average_volume_60d_calc"]})
                // console.log(payload)
                ApiResponses.push(
                    fetch(Constants.SCAN_API, {
                        method: "POST",
                        body: payload,
                        headers: {
                            "Content-type": "application/json; charset=UTF-8"
                        }
                    })
                    .then(response => response.json())
                    .then(json => {
                        if(!json["data"]){
                            return null;
                        }
                        for(let idx in json["data"]) {
                            var data = json["data"][idx]["d"];
                            var apiSymbol = json["data"][idx]["s"];
                            if(apiSymbol === symbol)
                                return { symbol: symbol, last: data[2].toFixed(2), change: data[4].toFixed(2), changepct: data[3].toFixed(2) }
                        }
                        return null;

                    })
                )
            }
        )
        var responses = await Promise.all(ApiResponses);
        console.log(responses);
        WatchlistInterface.updateLivePrices(responses.filter(val => val !== null), this.configurables.sortType);

    }

    async selectWatchlistEventListener(event){
        console.log(event.target);
        var watchlist = event.currentTarget.getAttribute('data-name');
        console.log('clicked on watchlist', watchlist);
        await this.configurables.selectWatchlist(watchlist);
        console.log(this.configurables.selectedWatchlist);
        WatchlistOptionsInterface.setSelectedWatchlistButton(this.configurables.selectedWatchlist.name);
        this.initWatchlist();
        this.initLivePrices();
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
        var sortSvg = document.querySelector(".sortsvg");
        if (this.configurables.sortType === Configurables.SORT_TYPE.Asc){
            sortSvg.setAttribute('src', 'up-arrow.svg');
            sortSvg.classList.remove('hidden');
        }
        else if (this.configurables.sortType === Configurables.SORT_TYPE.Desc){
            sortSvg.setAttribute('src', 'down-arrow.svg');
            sortSvg.classList.remove('hidden');
        }
        WatchlistInterface.selectedSymbol = null;
        WatchlistInterface.clearTable();
        WatchlistInterface.createTable(
            this.configurables.selectedWatchlist.symbols,
            this.deleteSymbolEventListener.bind(this)
        );

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

    priceSortMethodEventListener(){
        var sortSvg = document.querySelector(".sortsvg");
        if (this.configurables.sortType === Configurables.SORT_TYPE.Unsorted) {
            sortSvg.setAttribute('src', 'down-arrow.svg');
            sortSvg.classList.remove('hidden');
            this.configurables.sortType = Configurables.SORT_TYPE.Desc;
        }
        else if (this.configurables.sortType === Configurables.SORT_TYPE.Desc) {
            sortSvg.setAttribute('src', 'up-arrow.svg');
            sortSvg.classList.remove('hidden');
            this.configurables.sortType = Configurables.SORT_TYPE.Asc;
        }
        else {
            sortSvg.classList.add('hidden');
            this.configurables.sortType = Configurables.SORT_TYPE.Unsorted;
        }
        this.configurables.updateStorage();
        WatchlistInterface.sortSymbolsByPriceChange(this.configurables.sortType);
    }

    static isTradingHours(){
        // Get the current date and time
        const now = new Date();
        // Check if it's Saturday or Sunday
        const day = now.getDay(); // 0 is Sunday, 6 is Saturday
        const isWeekend = day === 0 || day === 6;
        // Check if the time is not between 9:00 and 15:30
        const hour = now.getHours();
        const minute = now.getMinutes();
        const isBeforeNine = hour < 9 || (hour === 9 && minute < 0);
        const isAfterThreeThirty = hour > 15 || (hour === 15 && minute >= 30);

        if (isWeekend || isBeforeNine || isAfterThreeThirty) return false;
        return true;
    }

}


var masterInterface = new MasterInterface();
masterInterface.init();