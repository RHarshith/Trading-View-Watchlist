chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    symbol = msg.symbol
    searchForSymbol(symbol).then(function() {sendResponse("done")});
    return true;
  });

async function searchForSymbol(symbol) {
    console.log('searching', symbol);
    button = document.getElementById("header-toolbar-symbol-search");
    button.click();
    handlePopup(symbol);
}


async function handlePopup(symbol) {
    // Check if the popup is open (you may need to adjust this condition based on your actual popup)
    popup = document.querySelectorAll('[data-name="symbol-search-items-dialog"]');
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
      // Dispatch the "Enter" key event on the input field
    //   setTimeout(function() {inputField.dispatchEvent(enterKeyEvent)}, 2000);
    } else {
      // Wait for a short time and check again
      setTimeout(function(){handlePopup(symbol)}, 100);
    }
  }