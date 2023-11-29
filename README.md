Chrome extension to provide stock watchlist for trading view website.

## Features:
* Add multiple symbols into watchlist using comma-separated values.
* No limit on number of symbols per watchlist*.
* Create multiple watchlist without any limits*.
* Switch between stocks at blazingly high speeds(Almost equal to actual trading view watchlist speeds)
* Live stock prices (NEW!!)
* Use arrow keys to navigate( Up, down keys to cycle through stocks)
* Bookmark stocks with 3 different colors (Press keys 1,2,3)
* Edit, delete, rename watchlist (Coming soon!)
* Arrange symbols in watchlist (Coming soon!)

## How to install and use
1. Download this project by clicking on Code -> Download zip file
   <img width="698" alt="image" src="https://github.com/RHarshith/Trading-View-Watchlist/assets/43510025/b2d32a5f-1aa8-4a83-b4cb-ecfd283f3c5b">
2. Extract the files into a folder. Let's call the folder Trading_view_watchlist. Remember this name as it will be used in further steps.
3. Open Chrome browser**, and go to the chrome extensions store by following the url [chrome://extensions](chrome://extensions).
4. On the extensions page, turn on developer mode button at the top right corner
   <img width="947" alt="image" src="https://github.com/RHarshith/Trading-View-Watchlist/assets/43510025/c6b4e305-d198-41d1-a49a-549b448efd0b">
5. Once developer mode is turned on, you'll see some new buttons appear on the left side of the screen. Click on "Load Upacked" button.
   <img width="460" alt="image" src="https://github.com/RHarshith/Trading-View-Watchlist/assets/43510025/2a99d512-da6e-4ae0-a6e4-326818580204">
6. It should open windows explorer and prompt you to select a folder. Select the Trading_view_watchlist folder and hit Enter.
7. You should be able to see the extension loaded in the extensions page. Toggle the extension to enable it.
   <img width="920" alt="image" src="https://github.com/RHarshith/Trading-View-Watchlist/assets/43510025/bf45b6a3-1dc9-4c6b-99c6-c08e2f74de0d">
8. Go to trading view website and open supercharts(I hope I don't need to explain this :p).
9. Click on the extensions icon at the top right corner of browser and select the Trading view watchlist extension
    <img width="407" alt="image" src="https://github.com/RHarshith/Trading-View-Watchlist/assets/43510025/cc583651-a611-4291-92dd-36b7edbc272e">
10. It should open a popup window. Right click on the popup to click on "inspect". It will open a new chrome tab. Just keep that tab aside and go back to Trading view. DON'T CLOSE THE DEVELOPER TAB.(See end notes to know why this is done)***.
    <img width="308" alt="image" src="https://github.com/RHarshith/Trading-View-Watchlist/assets/43510025/8685bb8a-9c46-4d29-b4e6-94821c09bfb9">
11. You are ready to use the watchlist. Add stocks by clicking on the '+' symbol at the top, and create new watchlist by clicking on 'Create new' button in the watchlist dropdown.
    <img width="200" alt="image" src="https://github.com/RHarshith/Trading-View-Watchlist/assets/43510025/00abedfa-347a-49d7-b12f-dd6fcbb0910f">

12. Navigate between stocks using up/down arrow keys or by clicking on the stocks.
13. Delete stocks or watchlist by clicking on the 'x' button that appears when you hover over a stock or watchlist.
14. Use 1,2,3 keyboard keys to bookmark stocks in 3 colors.

\* There are no limits set on number of watchlists or symbols per watchlist, but there is an internal limit on amount of storage a chrome extension can use, which is 10MB.
  Read more on this [here](https://developer.chrome.com/docs/extensions/reference/storage/#property-local)

** Only tested on chrome browser, no guarantee on how it would work on other browsers. Volunteers who can help make this extension cross platform gladly welcomed.

*** Why do we need to right click and open the developer inspect tab for the watchlist? It's because every time you click outside the popup(Maybe to interact with the stock chart), the popup will close and you'll have to open it again to use it. I couldn't find a way to keep it open progammatically. Just keep the inspect tab running in the background.



   


