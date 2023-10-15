
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.visible_symbols != null) {
      clearWatchlist(msg.visible_symbols);
      sendResponse("done");
    }
    else if (msg.symbol != null) {
      symbol = msg.symbol;
      searchForSymbol(symbol).then(function () { sendResponse("done") });
    }
    else{
      console.log('caught a wild message', msg)
      sendResponse("Message handler not supported");
    }
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
  if (popup != null && popup.length > 0) {
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
    if (close_btn != null && close_btn.length > 0) close_btn[0].click();
    // Dispatch the "Enter" key event on the input field
    //   setTimeout(function() {inputField.dispatchEvent(enterKeyEvent)}, 2000);
  } else {
    // Wait for a short time and check again
    setTimeout(function () { handlePopup(symbol, query) }, 100);
  }
}

function addSymbols(symbols) {
  var symbolList = symbols.join();
  button = document.querySelectorAll('[data-name="add-symbol-button"]');
  if (button != null && button.length > 0) {
    button[0].click();
    handlePopup(symbolList, '[data-name="watchlist-symbol-search-dialog"]');
    const escKeyEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      keyCode: 27,
      bubbles: true,
      cancelable: true,
    });
    // document.body.dispatchEvent(escKeyEvent);
    // close_btn = document.querySelectorAll('[data-name="close"]');
    // if (close_btn != null && close_btn.length>0) close_btn[0].click();
  }
}

window.setInterval(
  sendLivePrices,
  1000
)

function sendLivePrices() {
  dataList = []
  container = document.getElementsByClassName("listContainer-MgF6KBas");
  if (container != null && container.length > 0) {
    symbolElements = container[0].firstChild.childNodes;
    if (symbolElements != null && symbolElements.length > 0) {
      symbolElements.forEach(element => {
        try {
          symbolElement = element.firstChild.firstChild;
          symbolName = symbolElement.getAttribute('data-symbol-full');
          last = symbolElement.children.item(2).firstChild.textContent;
          change = symbolElement.children.item(3).firstChild.textContent;
          changepct = symbolElement.children.item(4).firstChild.textContent;
          dataList.push({ symbol: symbolName, last: last, change: change, changepct: changepct })
        }
        catch (err) {
          // console.log("wrong element", element);
        }
      }
      )
    };
  }
    chrome.runtime.sendMessage({
      livePrices: dataList
    }).catch(err => {});

}

async function clearWatchlist(symbols) {
  symbols = symbols.map(str => {
    if (!str.startsWith('NSE:')) {
      return 'NSE:' + str;
    }
    return str;
  });
  nodes = document.querySelectorAll(".listContainer-MgF6KBas .symbol-RsFlttSS");
  container = document.querySelector(".listContainer-MgF6KBas");
  symbolElements = null;
  if (container) symbolElements = container.firstChild;
  if (symbolElements) console.log('total elements to clear', symbolElements.childNodes.length, nodes.length)
  counter = 0;
  while (symbolElements && symbolElements.childElementCount > 2) {
    children = symbolElements.children;
    index = children.length - 2;
    // await delay(0.001);
    symbolElement = children.item(index).firstChild.firstChild;
    // console.log(symbolElement.getAttribute('data-symbol-full'));
    symbolElement.children.item(7).firstChild.click();
    container = document.querySelector(".listContainer-MgF6KBas");
    // console.log(container);
    symbolElements = null;
    if (container) symbolElements = container.firstChild;
    counter += 1
  }
  console.log('total cleared', counter)
  addSymbols(symbols)
}

const delay = ms => new Promise(res => setTimeout(res, ms));