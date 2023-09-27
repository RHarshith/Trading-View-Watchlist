var symbols = [];
const pageSize = 30;
var currPage = 0;
var init = false;
var prev_scroll = null;
const delay = ms => new Promise(res => setTimeout(res, ms));

async function scrollTrigger() {
  var el = this;
  var sc = el.scrollTop / (el.scrollHeight - el.clientHeight);
  if (sc === 0)
    if (currPage>0) {
      currPage-=1;
      await updateWatchlist();
    }
  if (sc > 0.99) {
    console.log('End of scroll');
    if ((currPage+1)*pageSize<symbols.length) {
      currPage+=1;
      await updateWatchlist();
    }
  }
}


chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.visible_symbols != null) {
      addSymbols(msg.visible_symbols)
      sendResponse("done")
    }
    else if (msg.symbol != null)
    {
      symbol = msg.symbol;
      searchForSymbol(symbol).then(function() {sendResponse("done")});
    }
    else if (msg.init != null && !init){
      init=true;
      fetchWatchlistFromStorage();
      sendResponse("done");

    }
    else if (msg.update != null){
      fetchWatchlistFromStorage();
      sendResponse("done");

    }
    // else if (msg.activate_fetch != null) {
    //   window.setInterval
    // }
    return true;
  });

async function searchForSymbol(symbol) {
    console.log('searching', symbol);
    button = document.getElementById("header-toolbar-symbol-search");
    button.click();
    handlePopup(symbol, '[data-name="symbol-search-items-dialog"]');
}


async function handlePopup(symbol, query) {
    // Check if the popup is open (you may need to adjust this condition based on your actual popup)
    popup = document.querySelectorAll(query);
    if (popup != null && popup.length>0) {
        console.log(popup)
      // Find the input field in the popup
      const inputField = document.getElementsByClassName('search-ZXzPWcCf')[0];

      // Update the text in the input field
      console.log('setting value', symbol);
      inputField.value = symbol;

      // Create a new "Enter" key event
      const enterKeyEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        keyCode: 13,
        bubbles: true,
        cancelable: true,
      });
      inputField.dispatchEvent(enterKeyEvent);
      close_btn = document.querySelectorAll('[data-name="close"]');
      if (close_btn != null && close_btn.length>0) close_btn[0].click();
      // Dispatch the "Enter" key event on the input field
    //   setTimeout(function() {inputField.dispatchEvent(enterKeyEvent)}, 2000);
    } else {
      // Wait for a short time and check again
      setTimeout(function(){handlePopup(symbol, query)}, 100);
    }
  }

function addSymbols(symbol_list) {
  console.log('adding symbols', symbol_list)
  var symbolList = symbol_list.join();
  button = document.querySelectorAll('[data-name="add-symbol-button"]');
  if (button != null && button.length>0) {
    button[0].click();
    handlePopup(symbolList, '[data-name="watchlist-symbol-search-dialog"]');
    const escKeyEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      keyCode: 27,
      bubbles: true,
      cancelable: true,
    });
  }
  }

// window.setInterval(
//   sendLivePrices,
//   5000
// )

function sendLivePrices() {
  dataList = []
  container = document.getElementsByClassName("listContainer-MgF6KBas");
  if (container != null && container.length>0) {
    symbolElements = container[0].firstChild.childNodes;
    if(symbolElements != null && symbolElements.length>0){
      symbolElements.forEach(element => {
        try {
          symbolElement = element.firstChild.firstChild;
          symbolName = symbolElement.getAttribute('data-symbol-full');
          last = symbolElement.children.item(2).firstChild.textContent;
          change = symbolElement.children.item(3).firstChild.textContent;
          changepct = symbolElement.children.item(4).firstChild.textContent;
          dataList.push({symbol: symbolName, last: last, change: change, changepct: changepct})
        }
        catch(err){
          console.log("wrong element", element);
        }
      }
      )
      };
  }
  chrome.runtime.sendMessage({
    livePrices: dataList
  });
}

function waitForElm(selector) {
  return new Promise(resolve => {
      if (document.querySelector(selector)) {
          return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver(mutations => {
          if (document.querySelector(selector)) {
              observer.disconnect();
              resolve(document.querySelector(selector));
          }
      });

      observer.observe(document.body, {
          childList: true,
          subtree: true
      });
  });
}
// waitForElm('[data-name="symbol-list-wrap"] .listContainer-MgF6KBas').then((elm) => {
//   console.log('found scroll');
//   elm.addEventListener('scroll', scrollTrigger);
// });

function fetchWatchlistFromStorage(){
  chrome.storage.local.get('selected_watchlist', function(res) {
    if (res.hasOwnProperty('selected_watchlist')) {
      console.log(res.selected_watchlist);
      fetchWatchlistSymbolsFromStorage(res['selected_watchlist']);
    }

  })
}

function fetchWatchlistSymbolsFromStorage(watchlistName){
  console.log(watchlistName)
  chrome.storage.local.get(watchlistName, function(res) {
    if (res.hasOwnProperty(watchlistName)) {
      console.log(res);
      symbols = res[watchlistName];
      updateWatchlist();
    }
  })
}

async function updateWatchlist(bottom=false) {
  clearWatchlist(bottom);

}

async function clearWatchlist(bottom) {
  container = document.querySelector(".listContainer-MgF6KBas");
  symbolElements = null;
  if (container) symbolElements = container.firstChild;
  if (symbolElements) console.log('total elements to clear',symbolElements.childNodes.length )
  counter = 0;
  while(symbolElements && symbolElements.childElementCount>2){

    children = symbolElements.children;
    index = 1;
    if(bottom) index = children.length -2;
    await delay(0.001);
    symbolElement = children.item(index).firstChild.firstChild;
    // console.log(symbolElement.getAttribute('data-symbol-full'));
    symbolElement.children.item(7).firstChild.click();
    container = document.querySelector(".listContainer-MgF6KBas");
    // console.log(container);
    symbolElements = null;
    if (container) symbolElements = container.firstChild;
    counter +=1
  }
  console.log('total cleared', counter)
        // try{
        //   symbolElement = element.firstChild.firstChild;
        //   symbolElement.children.item(7).firstChild.click();
        //   console.log('cleared', symbolElement);
        // }
        // catch(err){
        //   console.log("wrong element", element);
        // }
  console.log('cleared watchlist');
  start = pageSize*currPage;
  end = Math.min(symbols.length, start+pageSize);
  if (end-start+1 < pageSize){
    start = Math.max(0, end-pageSize+1)
  }
  addSymbols(symbols.slice(start, end));

  waitForElm('[data-name="symbol-list-wrap"] .listContainer-MgF6KBas').then((elm) => {
    console.log('found scroll');
    elm.addEventListener('scroll', scrollTrigger);
  });


}