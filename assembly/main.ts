import {
	context,
	PersistentUnorderedMap,
} from "near-sdk-as";

@nearBindgen
class Board {
	cells: string[] = ['', '', '', '', '', '', '', '', ''];
	// eslint-disable-next-line @typescript-eslint/no-inferrable-types
	currentTurnMark: string = 'X';
	// eslint-disable-next-line @typescript-eslint/no-inferrable-types
	winner: string = '';

	isFull(): boolean {
		for (let i = 0; i < this.cells.length; i += 1) {
			if (this.cells[i] == '') {
				return false;
			}
		}

		return true;
	}

	cellIsMarked(x: number, y: number): boolean {
		const cellIndex = this.getCellIndex(x, y);

		if (this.cells[cellIndex] == '') {
			return false;
		}

		return true;
	}

	getCellIndex(x: number, y: number): i32 {
		return i32(x + y * 3);
	}

	markCell(x: number, y: number): void {
		const cellIndex = this.getCellIndex(x, y);

		this.cells[cellIndex] = this.currentTurnMark;

		if (this.currentTurnMark == 'X') {
			this.currentTurnMark = 'Y';
		} else {
			this.currentTurnMark = 'X';
		}
	}

	getWinner(): string {
		const players = ['X', 'Y'];

		for (let i = 0; i < players.length; i += 1) {
			const playerMark = players[i];

			// 1st row
			if (this.cells[0] == playerMark && this.cells[1] == playerMark && this.cells[2] == playerMark) {
				return playerMark;
			}

			// 2nd row
			if (this.cells[3] == playerMark && this.cells[4] == playerMark && this.cells[5] == playerMark) {
				return playerMark;
			}

			// 3rd row
			if (this.cells[6] == playerMark && this.cells[7] == playerMark && this.cells[8] == playerMark) {
				return playerMark;
			}

			// 1st column
			if (this.cells[0] == playerMark && this.cells[3] == playerMark && this.cells[6] == playerMark) {
				return playerMark;
			}

			// 2nd column
			if (this.cells[1] == playerMark && this.cells[4] == playerMark && this.cells[7] == playerMark) {
				return playerMark;
			}

			// 3rd column
			if (this.cells[2] == playerMark && this.cells[5] == playerMark && this.cells[8] == playerMark) {
				return playerMark;
			}

			// diagonal top left to bottom right
			if (this.cells[0] == playerMark && this.cells[4] == playerMark && this.cells[8] == playerMark) {
				return playerMark;
			}

			// diagonal bottom left to top right
			if (this.cells[6] == playerMark && this.cells[4] == playerMark && this.cells[2] == playerMark) {
				return playerMark;
			}
		}

		return 'TIE';
	}
}

@nearBindgen
class CallResponse {
	constructor(
		public success: boolean,
		public message: string,
	) {

	}
}

const boards = new PersistentUnorderedMap<string, Board>("m");

function response(message: string, success: boolean): CallResponse {
	return new CallResponse(success, message)
}

function createPlayerBoard(accountId: string): Board {
	const newPlayerBoard = new Board();
	boards.set(accountId, newPlayerBoard);

	return newPlayerBoard;
}

function getPlayerBoard(accountId: string): Board | null {
	return boards.get(accountId);
}

function getOrCreatePlayerBoard(accountId: string): Board {
	const existingPlayerBoard = getPlayerBoard(accountId);

	if (existingPlayerBoard) {
		return existingPlayerBoard;
	}

	return createPlayerBoard(accountId);
}

export function markCell(x: string, y: string): CallResponse {
	const playerBoard = getOrCreatePlayerBoard(context.sender);
	
	if (playerBoard.cellIsMarked(parseInt(x), parseInt(y))) {
		return response('Cell is already marked!', false);
	}

	const mark = playerBoard.currentTurnMark;

	playerBoard.markCell(parseInt(x), parseInt(y));

	if (playerBoard.isFull()) {
		const winner = playerBoard.getWinner();

		playerBoard.winner = winner;
		boards.set(context.sender, playerBoard);

		if (winner == 'TIE') {
			return response('Game ended in a tie!', true);
		} else {
			return response(winner + ' won the game!', true);
		}
	} else {
		const winner = playerBoard.getWinner();

		if (winner != 'TIE') {
			playerBoard.winner = winner;
			boards.set(context.sender, playerBoard);
	
			return response(winner + ' won the game!', true);
		}
	}

	boards.set(context.sender, playerBoard);

	return response('Cell ' + x.toString() + ',' + y.toString() + ' marked with ' + mark + '!', true);
}

export function viewBoard(accountId: string): Board | null {
	return getPlayerBoard(accountId);
}

export function startNewGame(): CallResponse {
	createPlayerBoard(context.sender);

	return response('New game started!', true);
}
