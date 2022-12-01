"use strict";

console.log("╦╔═┌─┐┬─┐┌┬┐┌─┐");
console.log("╠╩╗├─┤├┬┘ ││└─┐");
console.log("╩ ╩┴ ┴┴└──┴┘└─┘");
console.log("Alan | V1.5 2021")

/* <=================================== Elements / Variables ===================================> */
const e_mainContainer = document.getElementById('main-container');
const e_cardsContainer = document.getElementById('cards-container');

const e_sidebar = document.getElementById('sidebar');
const e_sidebarButton = document.getElementById('sidebar-button');
const e_sidebarClose = document.getElementById('sidebar-close');

const e_addCardText = document.getElementById('add-card-text');
const e_addCardButton = document.getElementById('add-card-button');

const e_boardsList = document.getElementById('boards-list');
const e_addBoardText = document.getElementById('add-board-text');
const e_addBoardButton = document.getElementById('add-board-button');

const e_autoSaveButton = document.getElementById('auto-save');
const e_saveButton = document.getElementById('save-button');
const e_settingsButton = document.getElementById('settings-button');
const e_deleteButton = document.getElementById('delete-button');

const e_cardContextMenu = document.getElementById('card-context-menu');
const e_cardContextMenuDelete = document.getElementById('card-context-menu-delete');
const e_cardContextMenuClear = document.getElementById('card-context-menu-clear');
const e_cardContextMenuDuplicate = document.getElementById('card-context-menu-duplicate');

const e_alerts = document.getElementById('alerts');

const e_title = document.getElementById('title');

// Auto save enabled as default
let autoSaveInternalId = setInterval(function (){
    saveData();
}, 5000);

var appData = {
    'boards': [],
    'settings': {
        'userName': "User",
        //[not yet] 'defaultTheme': "blue",
        'dataPersistence': true
    },
    'currentBoard': 0,  // The index of the currently open board.
    'identifier': 0
};

function currentCards() {
    return appData.boards[appData.currentBoard].cards;
}

function currentBoard() {
    return appData.boards[appData.currentBoard];
}

/* <=================================== Extensions ===================================> */
Array.prototype.move = function(from, to) {
    /* Move an item from the array to a specific index of the array. */

    this.splice(to, 0, this.splice(from, 1)[0]);
};

Array.prototype.insert = function(index, item) {
    /* Insert an item to a specific index of the array. */

    this.splice( index, 0, item );
};

/* <=================================== Utility Functions ===================================> */
function uniqueID() {
    appData.identifier += 1;
    return 'b' + appData.identifier;
}

function getMouseOverCard() {
    // The card the mouse cursor is currently over.
    return document.querySelectorAll('.parent-card:hover')[0];
}

function getMouseOverItem() {
    // The task the mouse cursor is currently over.
    return document.querySelectorAll('.parent-card > ul > li:hover')[0];
}

function getItemFromElement(element) {
    /* Get an Item object from a list item element. */

    for (let _card of currentCards()) {
        for (let _item of _card.items) {
            if (_item.id === element.id) {
                return _item;
            }
        }
    }
}

function getCardFromElement(element) {
    /* Get a Card object from a card div element. */

    return currentCards().find(e => e.id === element.id);
}

function getBoardFromId(id) {
    /* Get a board object from its unique id. */

    return appData.boards.find(_b => _b.id === id);
}

function listBoards() {
    /* List all the boards in the sidebar. */

    e_boardsList.innerHTML = '';
    for (let _board of appData.boards) {
        let _boardTitle = document.createElement('li');
        _boardTitle.innerText = _board.name;
        _boardTitle.id = _board.id;
        if (_board.id === currentBoard().id) _boardTitle.classList.add('is-active');
        _boardTitle.addEventListener('click', () => {
            renderBoard(_board);
            listBoards();
        });
        e_boardsList.appendChild(_boardTitle);
    }
}

function renderBoard(board) {
    appData.currentBoard = appData.boards.indexOf(board);
    document.title = 'Kards | ' + currentBoard().name;
    e_title.innerText = currentBoard().name;
    //e_title.addEventListener('click'), allow editing board name
    // To-Do: set theme
    renderAllCards();
}

function renderAllCards() {
    /* Refreshes the whole cards container. */

    for (let _card of e_cardsContainer.querySelectorAll('.parent-card')) {

        // Remove all the cards from the cards container.
        _card.remove();
    }

    for (let _card of currentCards()) {
        // Regenerate each card.
        let _generated = _card.generateElement();
        // Put them in the container right before the last child (text box for new card).
        e_cardsContainer.insertBefore(_generated, e_cardsContainer.childNodes[e_cardsContainer.childNodes.length - 2]);
        // Update the card for event listeners and etc...
        _card.update();
    }
}

function renderCard(cardID) {
    let _card = currentCards().find(e => e.id === cardID);

    if (!_card) {
        // If card no longer exists in data. (ie: deleted but still rendered in DOM)
        // Remove it from the DOM
        let _currentCardElement = document.getElementById(cardID);
        _currentCardElement.parentNode.removeChild(_currentCardElement);
        return;
    }

    // Get current card element if it exists.
    let _currentCardElement = document.getElementById(_card.id);
    if (_currentCardElement != null) {
        let _generated = _card.generateElement();
        // Replace the card from the container.
        _currentCardElement.parentNode.replaceChild(_generated, _currentCardElement);
    } else {
        let _generated = _card.generateElement();
        // Put them in the container right before the last child (text box for new card).
        e_cardsContainer.insertBefore(_generated, e_cardsContainer.childNodes[e_cardsContainer.childNodes.length - 2]);
    }

    // Update the event listeners.
    _card.update();
}

function toggleHoverStyle(show) {
    /* Sets whether hovering over cards/items changes their colors or not. */

    if (show) {

        // Create a new style element.
        let _hoverStyle = document.createElement('style');
        _hoverStyle.id = "dragHover";

        // Card and item should turn slightly darker when move over.
        // This gives a visual feedback that makes it easier for the user to know positions during drag and drop.
        _hoverStyle.innerHTML = ".parent-card:hover {background-color: #c7cbd1;}.parent-card > ul > li:hover {background-color: #d1d1d1;}";
        document.body.appendChild(_hoverStyle);
    } else {

        // Get rid of the style element.
        // This effectively prevents the elements from turning darker on hover.
        let _hoverStyle = document.getElementById('dragHover');
        _hoverStyle.parentNode.removeChild(_hoverStyle);
    }
}

function addBoard() {
    /* Adds a new board based on the input in the sidebar. */

    let _boardTitle = e_addBoardText.value;
    if (!_boardTitle) return createAlert("Type a name for the board!");  // We don't create a board if it has no name.
    if (appData.boards.length >= 512) return createAlert("Max limit for boards reached.")  // or if there are already too many boards
    e_addBoardText.value = '';

    let _newBoard = new Board(_boardTitle, uniqueID(), {'theme': null});
    appData.boards.push(_newBoard);
    listBoards();
}

/* <=================================== Classes ===================================> */
class Item {

    constructor(title, description=null, id, parentCardId) {
        this.title = title;
        this.description = description;  // A field for a future version, perhaps v2
        this.id = id;
        this.isDone = false;
        this.parentCardId = parentCardId;
    }

    getParentCard() {
        return document.getElementById(this.parentCardId);
    }

    check(chk=true) {
        this.isDone = chk;
        if (chk) {

            // Strikethrough the text if clicked on.
            // NOTE02: Might remove this feature as its not really needed.
            document.getElementById(this.id).style.textDecoration = 'line-through';
        } else {

            // Remove the strikethrough from the text.
            document.getElementById(this.id).style.textDecoration = 'none';
        }
    }

    update() {
        let _element = document.getElementById(this.id);

        _element.getElementsByTagName('p')[0].addEventListener('click', () => {
            if (this.isDone) {
                this.check(false);
            } else {
                this.check(true);
            }
        });

        _element.addEventListener('mousedown', cardDrag_startDragging, false);
        this.check(this.isDone);
    }
}

class Card {

    constructor(name, id, parentBoardId) {
        this.name = name;
        this.items = [];
        this.id = id;
        this.parentBoardId = parentBoardId;
    }

    addItem(item) {
        this.items.push(item);
        renderCard(this.id);
    }

    removeItem(item) {
        this.items = this.items.filter(val => val !== item);
        renderCard(this.id);
    }

    update() {
        for (let _item of this.items) {
            _item.update();
        }
    }

    renderItems() {
        let _newItemList = document.createElement('ul');
        _newItemList.id = this.id + '-ul';
        for (let _item of this.items) {
            let _newItem = document.createElement('li');
            _newItem.id = _item.id;
            
            // Item Title
            let _newItemTitle = document.createElement('p');
            _newItemTitle.innerText = _item.title;
            _newItemTitle.classList.add('item-title', 'text-fix', 'unselectable');
            
            // Housing for the edit and delete buttons.
            let _newItemButtons = document.createElement('span');

            // Edit button. Allows the user to rename the item.
            let _newItemEditButton = document.createElement('i');
            _newItemEditButton.ariaHidden = true;
            _newItemEditButton.classList.add('fa', 'fa-pencil');
            _newItemEditButton.addEventListener('click', () => {
                
                // Card item editing functionality.
                let _input = document.createElement('textarea');
                _input.value = _newItemTitle.textContent;
                _input.classList.add('item-title');
                _input.maxLength = 256;
                _newItemTitle.replaceWith(_input);

                let _save = () => {
                    _item.title = _input.value;
                    renderCard(this.id);
                };

                _input.addEventListener('blur', _save, {
                    once: true,
                });
                _input.focus();
            });

            // Delete button. ALlows the user to delete the item from the card.
            let _newItemDeleteButton = document.createElement('i');
            _newItemDeleteButton.ariaHidden = true;
            _newItemDeleteButton.classList.add('fa', 'fa-trash');
            _newItemDeleteButton.addEventListener('click', () => {
                createConfirmDialog("Are you sure to delete this task?", () => this.removeItem(_item));
            });

            // Add both the buttons to the span tag.
            _newItemButtons.appendChild(_newItemEditButton);
            _newItemButtons.appendChild(_newItemDeleteButton);

            // Add the title, span tag to the item and the item itself to the list.
            _newItem.appendChild(_newItemTitle);
            _newItem.appendChild(_newItemButtons);
            _newItemList.appendChild(_newItem);
        }

        return _newItemList;
    }

    generateElement() {

        /* The structure of the card element. */

        //  <div class="parent-card">
        //    <span>
        //        <h2>
        //            {this.name}
        //        </h2>
        //        <i class="fa fa-bars" aria-hidden="true"></i>
        //    </span>
        //    <ul>
        //        <li><p>{this.items[0]}</p> <span></span>
        //        {more_items...}
        //    </ul>  
        //  </div>

        // This was somewhat of a bad idea...
        // Editing the style of the cards or items are made quite difficult.
        // I should've wrote all this as HTML and put it in the .innerHTML
        // But this gives me more flexibility, so I had to make a choice.

        let _newCardHeader = document.createElement('span');
        let _newCardHeaderTitle = document.createElement('h2');
        _newCardHeaderTitle.id = this.id + '-h2';
        _newCardHeaderTitle.innerText = this.name;
        _newCardHeaderTitle.classList.add('text-fix', 'card-title');

        // A better, more flexible alternative to contentEditable.
        // We replace the text element with an input element.
        _newCardHeaderTitle.addEventListener('click', (e) => {
            let _input = document.createElement('input');
            _input.value = _newCardHeaderTitle.textContent;
            _input.classList.add('card-title');
            _input.maxLength = 128;
            _newCardHeaderTitle.replaceWith(_input);

            let _save = () => {
                this.name = _input.value;
                renderCard(this.id);
            };

            _input.addEventListener('blur', _save, {
                once: true,
            });
            _input.focus();
        });

        // Hamburger menu icon next to card title to enter card's context menu.
        // *Feature not complete yet.*
        let _newCardHeaderMenu = document.createElement('i');
        _newCardHeaderMenu.ariaHidden = true;
        _newCardHeaderMenu.classList.add("fa", "fa-bars");
        _newCardHeader.append(_newCardHeaderTitle);
        _newCardHeader.append(_newCardHeaderMenu);
        _newCardHeaderMenu.addEventListener('click', cardContextMenu_show);

        // Input area for typing in the name of new tasks for the card.
        let _newInput = document.createElement('input');
        _newInput.id = this.id + '-input';
        _newInput.maxLength = 256;
        _newInput.type = 'text';
        _newInput.name = "add-todo-text";
        _newInput.placeholder = "Add Task...";
        _newInput.addEventListener('keyup', (e) => {
            if (e.code === "Enter") _newButton.click();
        });

        // Button next to input to convert the text from the _newInput into an actual item in the card.
        let _newButton = document.createElement('button');
        _newButton.id = this.id + '-button';
        _newButton.classList.add("plus-button");
        _newButton.innerText = '+';
        _newButton.addEventListener('click', () => {
            let _inputValue = _newInput.value;
            if (!_inputValue) return createAlert("Type a name for the item!");
            let _item = new Item(_inputValue, null, getBoardFromId(this.parentBoardId).uniqueID(), this.id);
            this.addItem(_item);
            _newInput.value = '';
            _newInput.focus(); // wont because the card is being re-rendered
        });

        let _newCard = document.createElement('div');
        _newCard.id = this.id;
        _newCard.classList.add('parent-card');
        _newCard.appendChild(_newCardHeader);

        if (this.items) {
            // If the card has items in it.

            // Render the items of the card.
            let _newItemList = this.renderItems();

            // Add the list to the card.
            _newCard.appendChild(_newItemList);
        }

        // Add the input and button to add new item at the end.
        _newCard.appendChild(_newInput);
        _newCard.appendChild(_newButton);

        return _newCard;
    }
}

class Board {

    constructor(name, id, settings, identifier=0) {
        this.name = name;
        this.id = id;
        this.settings = settings;
        this.cards = [];  // All the cards that are currently in the container as Card objects.
        this.identifier = identifier === null ? Date.now() : identifier;  // All elements within this board will carry an unqiue id.
    }

    uniqueID() {
        this.identifier += 1;
        return 'e' + this.identifier.toString();
    }

    addCard() {
        let _cardTitle = e_addCardText.value;
        e_addCardText.value = '';
    
        // If the user pressed the button without typing any name, we'll default to "Untitled Card {cards length +1}"
        if (!_cardTitle) _cardTitle = `Untitled Card ${this.cards.length + 1}`;
    
        let _card = new Card(_cardTitle, this.uniqueID(), this.id);
        this.cards.push(_card);

        let _newCard = _card.generateElement();
        e_cardsContainer.insertBefore(_newCard, e_cardsContainer.childNodes[e_cardsContainer.childNodes.length - 2]);
    }
}

/* <=================================== Items Drag n' Drop ===================================> */
var cardDrag_mouseDown = false;  // Whether the user has clicked down on a card item.
var cardDrag_mouseDownOn = null;  // The card item that is being held.

const cardDrag_update = (e) => {

    // Only update if the mouse is held down, and on an item element.
    if (!cardDrag_mouseDown && !cardDrag_mouseDownOn) return;

    // The card must be at the same coordinates as the mouse cursor.
    // This simulates the effect of the card being grabbed by the cursor.
    cardDrag_mouseDownOn.style.left = e.pageX + 'px';
    cardDrag_mouseDownOn.style.top = e.pageY + 'px';
};

const cardDrag_startDragging = (e) => {

    // Only grab elements that are list items.
    // Otherwise we'll be able to individually grab child elements of the list item.
    // Which is quite funny but it breaks the code so, nah.
    if (e.target.tagName !== 'LI') return;

    cardDrag_mouseDown = true;
    cardDrag_mouseDownOn = e.target;

    // Set the position of the item to absolute
    // This allows us to take the element out of the document flow and play with its coordinates.
    cardDrag_mouseDownOn.style.position = 'absolute';

    // Enable hover style css, which makes other cards and items darker when hovered over.
    toggleHoverStyle(true);
};

const cardDrag_stopDragging = (e) => {

    // Only run the stop dragging code if the mouse was previously held down on an item element.
    if (!cardDrag_mouseDown) return;

    // Disable hover style css, which prevents cards and items from getting darker when hovered over.
    toggleHoverStyle(false);

    let _hoverCard = getMouseOverCard();
    if (_hoverCard) {
        let _hoverItem = getMouseOverItem();

        // Get the object from the card element the mouse is over.
        let _hoverCardObject = getCardFromElement(_hoverCard);
        // Get the object from the item element the mouse is holding.
        let _heldItemObject = getItemFromElement(cardDrag_mouseDownOn);
        
        if (_hoverCard === _heldItemObject.getParentCard()) {
            // If the card the mouse is over is the same as the parent card of the item being held.
            // We only have to deal with vertical drag and drop.
            // Ie: The user is only changing the order of items around.

            if (_hoverItem) {
                // If an item is being hovered over.

                if (_hoverItem !== cardDrag_mouseDownOn) {
                    // As long as the mouse isn't over the item being dragged.
                    // NOTE01: 
                    // This check is in place because there is a chance that the '_hoverItem' ends up being the item being held.
                    // This hasn't actually happened to me yet but I've sort of emulated it, so I know that it could happen under certain circumstances.
                    // I haven't around to fixing this yet primarily because it is extremely rare, and doesn't affect the functioning of the app.
                    let _hoverItemObject = getItemFromElement(_hoverItem);
                    // Move the position of the held item to the position of whichever item was hovered over.
                    // This will push the item that was hovered over down, with the item that was being held taking its place.
                    _hoverCardObject.items.move(_hoverCardObject.items.indexOf(_heldItemObject), _hoverCardObject.items.indexOf(_hoverItemObject));
                }
            }

            renderCard(_heldItemObject.getParentCard().id);

        } else {
            // If the card the mouse is over is not the same as the parent card of the item being held.
            // The user also gets the the ability to displace an item from the different card.
            // So we'll be dealing with both logic here, ie: Between cards and displacing item if hovered over one.

            if (_hoverItem) {
                // If an item is being hovered over.

                if (_hoverItem !== cardDrag_mouseDownOn) {
                    // As long as the mouse isn't over the item being dragged.
                    // See "NOTE01" above for clarification.

                    let _hoverItemObject = getItemFromElement(_hoverItem);

                    // Get the object of the parent card of the item being hovered over.
                    let _hoverItemParentObject = getCardFromElement(_hoverItemObject.getParentCard());

                    // Insert the held item into the position of the item that was being hovered over.
                    // This will push the item being hovered over down, with the item being held taking its place.
                    _hoverItemParentObject.items.insert(_hoverItemParentObject.items.indexOf(_hoverItemObject), _heldItemObject);

                    // Remove the held item from its original card.
                    getCardFromElement(_heldItemObject.getParentCard()).removeItem(_heldItemObject);
                    // Give the held item a new parent card id.
                    _heldItemObject.parentCardId = _hoverItemParentObject.id;
                }
            } else {
                // If an item wasn't being hovered and instead just the card.

                // Directly push the item being held to the items list of the card being hovered.
                _hoverCardObject.items.push(_heldItemObject);

                // Remove the held item from its original card.
                getCardFromElement(_heldItemObject.getParentCard()).removeItem(_heldItemObject);
                // Give the held item a new parent card id.
                _heldItemObject.parentCardId = _hoverCardObject.id;
            }

            renderCard(_hoverCardObject.id);
            renderCard(_heldItemObject.getParentCard().id);
        }
        // renderAllCards();
        // renderCard(originCard);
        // renderCard(targetCard);
    }
    cardDrag_mouseDown = false;
    cardDrag_mouseDownOn.style.position = 'static';
    cardDrag_mouseDownOn = null;
};

// Adding the event listeners.
// NOTE03: It would be a better idea to make a single mouseMove/mouseLeave/mouseUp function
// to handle both the drag scroll and card item dragging.
// It'll save unnecessary processing + less event listeners. 
e_mainContainer.addEventListener('mousemove', cardDrag_update);
e_mainContainer.addEventListener('mouseleave', cardDrag_stopDragging, false);
window.addEventListener('mouseup', cardDrag_stopDragging, false);

/* <=================================== Drag Scrolling ===================================> */
// This feature allows the user to hold and drag the main cards container to scroll instead of holding the scrollbar.
// Inspired by Trello but its really handy.

let scroll_mouseDown = false;
let scroll_startX, scroll_scrollLeft;

const scroll_startDragging = (e) => {
    scroll_mouseDown = true;
    scroll_startX = e.pageX - e_mainContainer.offsetLeft;
    scroll_scrollLeft = e_mainContainer.scrollLeft;
};

const scroll_stopDragging = (e) => {
    scroll_mouseDown = false;
};

const scroll_update = (e) => {
    e.preventDefault();
    if(!scroll_mouseDown || cardDrag_mouseDown) return;

    let _scroll = (e.pageX - e_mainContainer.offsetLeft) - scroll_startX;
    e_mainContainer.scrollLeft = scroll_scrollLeft - _scroll;
};

// Add the event listeners
e_mainContainer.addEventListener('mousemove', scroll_update);
e_mainContainer.addEventListener('mousedown', scroll_startDragging, false);
e_mainContainer.addEventListener('mouseup', scroll_stopDragging, false);
e_mainContainer.addEventListener('mouseleave', scroll_stopDragging, false);


/* <=================================== Card Context Menu ===================================> */


let cardContextMenu_currentCard;
const cardContextMenu_show = (e) => {

    cardContextMenu_currentCard = getMouseOverCard();

    // To-Do: Change the coords of the context menu to card button's exact coordinates.
    // Use cardElement.getBoundingClientRect(); or something like that...
    // Also, prevent the context menu from going out of bounds by normalizing the coordinates.
    const { clientX: mouseX, clientY: mouseY } = e;
    e_cardContextMenu.style.top = mouseY + 'px';
    e_cardContextMenu.style.left = mouseX + 'px';

    e_cardContextMenu.classList.remove('visible');
    setTimeout(() => {
        e_cardContextMenu.classList.add('visible');
    });

};

const cardContextMenu_hide = (e) => {
    // As long as the user isn't clicking on a context menu, we can hide it.
    if (e.target.offsetParent != e_cardContextMenu && e_cardContextMenu.classList.contains('visible')) {
        e_cardContextMenu.classList.remove("visible");
    }
};

const cardContextMenu_clearCard = () => {
    createConfirmDialog('Are you sure to clear this board', () => {
        let _currentCardObject = getCardFromElement(cardContextMenu_currentCard);

        _currentCardObject.items.length = 0;
        renderCard(_currentCardObject.id);
    });
};

const cardContextMenu_deleteCard = () => {
    createConfirmDialog('Are you sure to delete this card', () => {
        let _currentCardObject = getCardFromElement(cardContextMenu_currentCard);

        // Remove the card from the cards list based on its index position.
        currentCards().splice(currentCards().indexOf(_currentCardObject), 1);
        cardContextMenu_hide({target:{offsetParent:'n/a'}}); // this is really stupid but it works, LoL

        renderCard(_currentCardObject.id);
    });
}

const cardContextMenu_duplicateCard = () => {
    let _currentCardObject = getCardFromElement(cardContextMenu_currentCard);

    currentBoard().addCard();

    let _cIndex = currentBoard().cards.length - 1;
    currentBoard().cards[_cIndex].items = _currentCardObject.items;
    currentBoard().cards[_cIndex].name = _currentCardObject.name + ' Copy';

    renderCard(currentBoard().cards[_cIndex].id);
}


document.body.addEventListener('click', cardContextMenu_hide);
e_cardContextMenuClear.addEventListener('click', cardContextMenu_clearCard);
e_cardContextMenuDelete.addEventListener('click', cardContextMenu_deleteCard);
e_cardContextMenuDuplicate.addEventListener('click', cardContextMenu_duplicateCard);

/* <=================================== Persistent Data Storage ===================================> */
function saveData() {
    window.localStorage.setItem('kards-appData', JSON.stringify(appData));
}

function getDataFromLocalStorage() {
    return window.localStorage.getItem('kards-appData');
}

function loadData() {
    let _data = window.localStorage.getItem('kards-appData');
    if (_data) {
        let _appData = JSON.parse(_data);

        // Since JSON doesn't store functions and such.
        // We'll have to reinitailize the classes with the loaded data.
        appData.settings = _appData.settings;
        appData.currentBoard = _appData.currentBoard >= 0 ? appData.currentBoard : 0;
        appData.identifier = _appData.identifier !== null ? appData.identifier : 0;
        
        // Fill the data with boards.
        for (let _board of _appData.boards) {
            let _newBoard = new Board(_board.name, _board.id, _board.settings, _board.identifier);

            // Fill the board with cards.
            for (let _card of _board.cards) {
                let _newCard = new Card(_card.name, _card.id, _board.id);

                // Fill the cards with items.
                for (let _item of _card.items) {
                    let _newItem = new Item(_item.title, _item.description, _item.id, _card.id);
                    // Push the item into the card.
                    _newCard.items.push(_newItem);
                }
                // Push the card into the board.
                _newBoard.cards.push(_newCard);
            }
            // Push the board into app data.
            appData.boards.push(_newBoard);
        }

        // Generate the board.
        renderBoard(appData.boards[appData.currentBoard]);
    } else {
        appData.currentBoard = 0;
        let _defaultBoard = new Board("Untitled Board", 'b0', {'theme': null});
        appData.boards.push(_defaultBoard);
    }
    listBoards();
}

function clearData() {
    window.localStorage.clear();
}

loadData();

/* <=================================== Other Events ===================================> */
e_addCardText.addEventListener('keyup', (e) => {
    if (e.code === "Enter") currentBoard().addCard();
});

e_addCardButton.addEventListener('click', () => currentBoard().addCard());

e_addBoardText.addEventListener('keyup', (e) => {
    if (e.code === "Enter") addBoard();
});

e_addBoardButton.addEventListener('click', addBoard);

e_autoSaveButton.addEventListener('change',  function (event) {
    if (this.checked) {
        autoSaveInternalId = setInterval(function (){
            saveData();
        }, 5000);
    } else {
        window.clearInterval(autoSaveInternalId);
    }
})
//e_saveButton.addEventListener('click', saveData);
e_saveButton.addEventListener('click', () => {saveData(); createAlert("Data successfully saved.")});

e_deleteButton.addEventListener('click', () => {
    createConfirmDialog('Are you sure to delete this board?', () => {
        let _boardName = currentBoard().name;

        // Delete the current board.
        appData.boards.splice(appData.currentBoard, 1);
        if (appData.currentBoard !== 0) {
            appData.currentBoard--;
        }

        if (appData.boards.length === 0) {
            let _defaultBoard = new Board("Untitled Board", 'b0', {'theme': null});
            appData.boards.push(_defaultBoard);
            appData.currentBoard = 0;
        }

        listBoards();
        renderBoard(appData.boards[appData.currentBoard]);

        createAlert(`Deleted board "${_boardName}"`)
    });
});

window.onbeforeunload = function () {
    if (JSON.stringify(appData) !== getDataFromLocalStorage()) {
        return confirm();
    }
}
/* <=================================== Sidebar ===================================> */
function toggleSidebar() {
    if (('toggled' in e_sidebar.dataset)) {
        delete e_sidebar.dataset.toggled;
        e_sidebar.style.width = "0";
        e_sidebar.style.boxShadow = "unset";

        // Remove listen click outside of side
        document.removeEventListener('click', listenClickOutside);
    } else {
        e_sidebar.dataset.toggled = '';
        e_sidebar.style.width = "250px";
        e_sidebar.style.boxShadow = "100px 100px 0 100vw rgb(0 0 0 / 50%)";
        // Listen click outside of sidebar
        setTimeout(() => {
            document.addEventListener('click', listenClickOutside);
        }, 300);
    }
}

e_sidebarButton.addEventListener('click', toggleSidebar);
e_sidebarClose.addEventListener('click', toggleSidebar);

/* Alerts */

function createAlert(text) {
    let _e = document.createElement('div');
    let _p = document.createElement('p');
    _p.innerText = text;
    _e.classList.add('alert');
    _e.appendChild(_p);

    e_alerts.appendChild(_e);
    setTimeout(function(){
        _e.classList.add('animate-hidden');
    }, 3500);
    setTimeout(function(){
        _e.parentNode.removeChild(_e);
    }, 4500);
}

function listenClickOutside(event) {
    const _withinBoundaries = event.composedPath().includes(e_sidebar);
    if (!_withinBoundaries && e_sidebar.style.width === "250px") {
        toggleSidebar();
    }
}

function createConfirmDialog(text, onConfirm) {

    // Hide any context menus that might be open.
    cardContextMenu_hide({target:{offsetParent:'n/a'}});

    var _modal = document.getElementById("confirm-dialog");
    var _span = document.getElementById("confirm-dialog-close");
    var _dialogText = document.getElementById('confirm-dialog-text');
    var _cancelButton = document.getElementById('confirm-dialog-cancel');
    var _confirmButton = document.getElementById('confirm-dialog-confirm');

    _modal.style.display = "block";
    _dialogText.textContent = text;

    _span.onclick = function() {
        _modal.style.display = "none";
    }
    
    _cancelButton.onclick = () => {
        _modal.style.display = "none";
    }

    _confirmButton.onclick = () => {
        _modal.style.display = "none";
        onConfirm && onConfirm();
    }

    window.onclick = (event) => {
        if (event.target === _modal) {
            _modal.style.display = "none";
        }
    }
}