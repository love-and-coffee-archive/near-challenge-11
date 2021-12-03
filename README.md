# Tic Tac Toe 
## Step by Step Guide on building a game on NEAR blockchain

This step by step guide will go through making Tic Tac Toe game on NEAR blockchain with web interface!

You can try it out right now - https://martintale.github.io/near-challenge-11/

# Features

-   Playable Game
-   Storing, updating and viewing game state from NEAR blockchain
-   Web <-> NEAR blockchain interactions

# Setup

1. Follow NEAR Hackaton guide to setup development environment - https://docs.near.org/docs/develop/basics/hackathon-startup-guide
2. Clone or download this repository
3. Update `CONTRACT_NAME` in `src\config.js` with your NEAR account
4. Install dependencies with the command below

```
yarn install
```

# Run your local version

Call method below
```
yarn dev
```
and open http://localhost:1234/ in your browser. You should see the whole game running on NEAR testnet with fronted being served from your local dev environment.

# Smart Contract

Essentially, this is a program (in our case - game server) that runs on blockchain. We will go through Tic Tac Toe contract step by step after which you should be able to make your own modifications and deploy your improved version of Tic Tac Toe or make a whole new game.

# Lets Dig In!

Open up `assembly\main.ts` file right at the beginning I setup few data structures required by our Voting System.

## Board class
We will use this class to create new board for every player and store it on NEAR blockchain.

```
@nearBindgen
class Board {
	cells: string[] = ['', '', '', '', '', '', '', '', ''];

	currentTurnMark: string = 'X';

	winner: string = '';
```

First line `@nearBindgen` is a special as it allows NEAR serialize our Board objects to be serialized on blockchain.

After that we define few properties (`cells`, `currentTurnMark`, `winner`) our game will use to manage Board state.

In addition, we define several methods on our Board that will help manage its state. Lets go over them one by one.


### isFull

Checks if board has been filled.

```
isFull(): boolean {
    for (let i = 0; i < this.cells.length; i += 1) {
        if (this.cells[i] == '') {
            return false;
        }
    }

    return true;
}
```

### cellIsMarked

Checks if cell in the board has been marked by Player

```
cellIsMarked(x: number, y: number): boolean {
    const cellIndex = this.getCellIndex(x, y);

    if (this.cells[cellIndex] == '') {
        return false;
    }

    return true;
}
```

### getCellIndex

As we're using one dimensional array to store our Board cell data we need to convert x/y coordinates into cell index that we can use to access correct cell.

```
getCellIndex(x: number, y: number): i32 {
	return i32(x + y * 3);
}
```

### markCell

When marking a cell we check who's turn it is to add the correct mark to the cell

```
markCell(x: number, y: number): void {
    const cellIndex = this.getCellIndex(x, y);

    this.cells[cellIndex] = this.currentTurnMark;

    if (this.currentTurnMark == 'X') {
        this.currentTurnMark = 'O';
    } else {
        this.currentTurnMark = 'X';
    }
}
```

### getWinner

Checks the board to see if a win condition has been reached. If yes, then it return Player mark that won, otherwise, it returns a TIE.


## CallResponse class

When creating backend systems you always want to have a robust and consistent way you can get data back to be manipulated or displayed on frontend so we define this basic structure to be used in all out call functions.

```
@nearBindgen
class CallResponse {
	constructor(
		public success: boolean,
		public message: string,
	) {

	}
}
```

`success` property indicates if request was successful to know how and which response to display to user in a user friendly way.
`message` in our case explain what went wrong with out request to end user or communicate other information :)

## Data Storage

In order for system to work and not just forget what it knows after each command is executed we need to preserve that data somewhere. We store our boards for all Players in `PersistentUnorderedMap`. You can read more about and other storage options here - https://docs.near.org/docs/concepts/data-storage#persistentunorderedmap

```
const boards = new PersistentUnorderedMap<string, Board>("m");
```

Important thing to keep in mind in case you want to store multiple persistent objects is to specify different name (`
m`, `n`, `b`) for each one of them. Otherwise, they all will point to the same data causing unexpected results.

## Helpers

In order to keep the rest of the code cleaner it's often useful to create some helper functions that handle repeated tasks for you.

These kind of functions are very useful in a case where at some point you want to change how they work then you only have to do it in one place instead of digging through the whole code.

### Responses

Another common function I tend to use is `response` which makes it easy to return your function call responses in a predictable and consistent way.

```
function response(messages: string[], success: boolean): CallResponse {
	return new CallResponse(success, messages)
}
```

### Creating and Retrieving Player Board

Game related functions that will help us create new or retrieve existing Player boards.

This helper creates and stores fresh Player board in persistent storage for user with `accountId`.
```
function createPlayerBoard(accountId: string): Board {
	const newPlayerBoard = new Board();
	boards.set(accountId, newPlayerBoard);

	return newPlayerBoard;
}
```

Player board might not exist so it's possible that it will return `null` instead of player board. In this case we want to create a new board for that player before proceeding.
```
function getPlayerBoard(accountId: string): Board | null {
	return boards.get(accountId);
}
```

Often we just want to get a board whether they have one or not yet. So we combine two above functions into one where we return existing board or create a new one for user with `accountId`.
```
function getOrCreatePlayerBoard(accountId: string): Board {
	const existingPlayerBoard = getPlayerBoard(accountId);

	if (existingPlayerBoard) {
		return existingPlayerBoard;
	}

	return createPlayerBoard(accountId);
}
```

## External Functions

These are functions that anyone with NEAR account can call to view data about our game state or manipulate it in some way. It can be done through CLI or in our case from a website using Javascript.


### markCell

Main function that lets player mark cell for the current turn mark.
```
export function markCell(x: string, y: string): CallResponse {
	const playerBoard = getOrCreatePlayerBoard(context.sender);
```

`context.sender` is available on all call requests that indicates which NEAR account is calling this function.

```
	if (playerBoard.cellIsMarked(parseInt(x), parseInt(y))) {
		return response('Cell is already marked!', false);
	}
```

We first need to double check that cell is empty because we don't want Players cheating their way to victory :)

```
	const mark = playerBoard.currentTurnMark;

	playerBoard.markCell(parseInt(x), parseInt(y));
```

Now, we can safely mark the cell in Player chosen location.

```
	if (playerBoard.isFull()) {
		const winner = playerBoard.getWinner();

		playerBoard.winner = winner;
		boards.set(context.sender, playerBoard);

		if (winner == 'TIE') {
			return response('Game ended in a tie!', true);
		} else {
			return response(winner + ' won the game!', true);
		}
```

In a case where board becomes full - we want to end the game. So we check who the winner is (or if it's a tie) - update board state and respond back to user that game is over.

```
	} else {
		const winner = playerBoard.getWinner();

		if (winner != 'TIE') {
			playerBoard.winner = winner;
			boards.set(context.sender, playerBoard);
	
			return response(winner + ' won the game!', true);
		}
	}
```

Otherwise, we check if there is a winner even if board is not full. If there is then we mark board as finished and respond back to client who won the game.

```
	boards.set(context.sender, playerBoard);

	return response('Cell ' + x.toString() + ',' + y.toString() + ' marked with ' + mark + '!', true);
}
```

Finally, we update the game board with the new mark if it hasn't been done before because game is not finished yet and respond to client with location and mark that was placed.

### viewBoard

View functions are special because you don't need a NEAR account to access/call them but it's important to note that `context.sender` isn't available either so we need to pass in `accountId` for it to know which board to return.

```
export function viewBoard(accountId: string): Board | null {
	return getPlayerBoard(accountId);
}
```

### startNewGame

And finally, ability to start a new game - because we want our Players to play through multiple games on a single account.

```
export function startNewGame(): CallResponse {
	createPlayerBoard(context.sender);

	return response('New game started!', true);
}
```

# Frontend

We have gone through our Smart Contract so lets check out some important parts of our frontend.

In `/src/index.html` you can see the structure of our website/game. It contains two blocks - one for logged in users and one for logged out ones. Logged in users see basic information about the game and can sign in. Signed in users can view the game board and UI, information about which NEAR account they used to login as well messages received from blockchain and ability to sign out.

In `/src/global.css` you will find all the styling for our website/game.

Now, lets have a look at Javascript files that are important for our project and some snippets of core functionality.

In `/src/config.js` you will need to update your NEAR account id as it will be used to deploy your Smart Contract to NEAR blockchain. Rest of the script is just configuration and common urls NEAR SDK uses.

## Utility Functions

You can find some NEAR related utility function in `/src/utils.js`.

`initContract()` function initializes a connection with NEAR wallet and store information about  currently logged in user and their wallet in global variables (e.g. `window.accountId`).

In addition, it sets up necessery functionality for your contract as shown below.

```
// Initializing our contract APIs by contract name and configuration
window.contract = await new Contract(
    window.walletConnection.account(),
    nearConfig.contractName,
    {
        // View methods are read only. They don't modify the state, but usually return some value.
        viewMethods: [
            "viewBoard",
        ],
        // Change methods can modify the state. But you don't receive the returned value when called.
        changeMethods: [
            "markCell",
            "startNewGame",
        ],
        sender: window.walletConnection.account(), // account object to initialize and sign transactions.
    }
);
```

You will have to define your external function from you Smart Contract in `viewMethods` and `changeMethods` arrays for them to be usable with NEAR SDK.

Then there are two more common functions `logout` and `login` which are self explanatory.

## Game Code

We will now have a look at important parts of game code in `/src/index.js`.


### Gas

When making `call` (change) requests to blockchain you need to provide gas aka small payment for action you're about to perform. In our case, start a new game or mark a cell.

For simplicity we just define maximum amount of gas you can use per request.

```
const BOATLOAD_OF_GAS = "300000000000000";
```

### Loading Indicator

When performing actions on servers or blockchain they don't complete instantly so for better user experience we want to show a loading indicator. We simply replace the content of cell or button with a loading SVG and prevent user from clicking/tapping it twice until request has been executed.

```
function startLoadingButton(button) {
	button.innerHTML = LOADING_SVG;
	button.style.pointerEvents = "none";
}

function stopLoadingButton(button) {
	button.style.pointerEvents = "inherit";
}
```

### Start New Game

This button is only visible when user's game is over.

As you can see we're using one of the functions we defined in `/src/utils.js`. To start a new game we don't need to pass in any parameters so we provide an empty object `{}`. We make sure that we wait for request to complete before proceeding by prefixing the function call with `await`. When request has been executed we update the response for user to see and update the board state.

```
startNewGameElement.onclick = async () => {
	try {
		startLoadingButton(startNewGameElement);
		const response = await window.contract.startNewGame(
			{},
			BOATLOAD_OF_GAS
		);

		updateResponse(response.message, response.success);
		updateBoard();
		stopLoadingButton(startNewGameElement);
	} catch (e) {
		console.log(e);
		alert(
			"Something went wrong! " +
			"Maybe you need to sign out and back in? " +
			"Check your browser console for more info."
		);
		throw e;
	}
}
```

### Update Board

We call this function as soon as user is logged in. If he doesn't have a board yet then `viewBoard` call will return `null` meaning that we need to start a new game before proceeding.

```
async function updateBoard() {
	const board = await window.contract.viewBoard({
		accountId: window.accountId,
	});

	if (board == null) {
		try {
			const response = await window.contract.startNewGame(
				{},
				BOATLOAD_OF_GAS
			);
	
			updateResponse(response.message, response.success);
			updateBoard();
		} catch (e) {
			console.log(e);
			alert(
				"Something went wrong! " +
				"Maybe you need to sign out and back in? " +
				"Check your browser console for more info."
			);
			throw e;
		}
```

Otherwise, we update the board with its current state received from blockchain and add ability to mark empty cells.

Have a look at `src/index.js` yourself to see how game state is visualized.


# That's It Folks!

That covers all the main functionality in our game!

Now that we have gone through the code - we want to build and deploy our game to NEAR.

Deploy
======

Every smart contract in NEAR has its [own associated account][NEAR accounts]. When you run `yarn dev`, your smart contracts get deployed to the live NEAR TestNet with a throwaway account. When you're ready to make it permanent, here's how.


Step 0: Install near-cli
--------------------------

You need near-cli installed globally. Here's how:

    npm install --global near-cli

This will give you the `near` [CLI] tool. Ensure that it's installed with:

    near --version


Step 1: Create an account for the contract
------------------------------------------

Visit [NEAR Wallet] and make a new account. You'll be deploying these smart contracts to this new account.

Now authorize NEAR CLI for this new account, and follow the instructions it gives you:

    near login


Step 2: set contract name in code
---------------------------------

Modify the line in `src/config.js` that sets the account name of the contract. Set it to the account id you used above.

    const CONTRACT_NAME = process.env.CONTRACT_NAME || 'your-account-here!'


Step 3: change remote URL if you cloned this repo 
-------------------------

Unless you forked this repository you will need to change the remote URL to a repo that you have commit access to. This will allow auto deployment to Github Pages from the command line.

1) go to GitHub and create a new repository for this project
2) open your terminal and in the root of this project enter the following:

    $ `git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git`


Step 4: deploy!
---------------

One command:

    yarn deploy

As you can see in `package.json`, this does two things:

1. builds & deploys smart contracts to NEAR TestNet
2. builds & deploys frontend code to GitHub using [gh-pages]. This will only work if the project already has a repository set up on GitHub. Feel free to modify the `deploy` script in `package.json` to deploy elsewhere.



  [NEAR]: https://nearprotocol.com/
  [yarn]: https://yarnpkg.com/
  [AssemblyScript]: https://docs.assemblyscript.org/
  [React]: https://reactjs.org
  [smart contract docs]: https://docs.nearprotocol.com/docs/roles/developer/contracts/assemblyscript
  [asp]: https://www.npmjs.com/package/@as-pect/cli
  [jest]: https://jestjs.io/
  [NEAR accounts]: https://docs.nearprotocol.com/docs/concepts/account
  [NEAR Wallet]: https://wallet.nearprotocol.com
  [near-cli]: https://github.com/nearprotocol/near-cli
  [CLI]: https://www.w3schools.com/whatis/whatis_cli.asp
  [create-near-app]: https://github.com/nearprotocol/create-near-app
  [gh-pages]: https://github.com/tschaub/gh-pages
