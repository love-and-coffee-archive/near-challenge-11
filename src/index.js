import "regenerator-runtime/runtime";

import { initContract, login, logout } from "./utils";

const BOATLOAD_OF_GAS = "300000000000000";

const avatarContainer = document.getElementById("avatar-container");
let currentAvatar = Date.now().toString();
let currentName = "Martin Tale";

const LOADING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" class="loading" viewBox="0 0 24 24"><path d="M13.75 22c0 .966-.783 1.75-1.75 1.75s-1.75-.784-1.75-1.75.783-1.75 1.75-1.75 1.75.784 1.75 1.75zm-1.75-22c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zm10 10.75c.689 0 1.249.561 1.249 1.25 0 .69-.56 1.25-1.249 1.25-.69 0-1.249-.559-1.249-1.25 0-.689.559-1.25 1.249-1.25zm-22 1.25c0 1.105.896 2 2 2s2-.895 2-2c0-1.104-.896-2-2-2s-2 .896-2 2zm19-8c.551 0 1 .449 1 1 0 .553-.449 1.002-1 1-.551 0-1-.447-1-.998 0-.553.449-1.002 1-1.002zm0 13.5c.828 0 1.5.672 1.5 1.5s-.672 1.501-1.502 1.5c-.826 0-1.498-.671-1.498-1.499 0-.829.672-1.501 1.5-1.501zm-14-14.5c1.104 0 2 .896 2 2s-.896 2-2.001 2c-1.103 0-1.999-.895-1.999-2s.896-2 2-2zm0 14c1.104 0 2 .896 2 2s-.896 2-2.001 2c-1.103 0-1.999-.895-1.999-2s.896-2 2-2z"/></svg>`;


function startLoadingButton(button) {
	button.innerHTML = LOADING_SVG;
	button.style.pointerEvents = "none";
}

function stopLoadingButton(button) {
	button.style.pointerEvents = "inherit";
}

const cellElements = [];
const messageElement = document.getElementById('message');
const startNewGameElement = document.getElementById('start-new-game');

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

for (let i = 0; i < 9; i += 1) {
	const cellElement = document.getElementById('cell-' + i);
	
	cellElements.push(cellElement);
}

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
	} else {
		for (let i = 0; i < board.cells.length; i += 1) {
			const cell = board.cells[i];

			if (cell == 'X') {
				cellElements[i].innerHTML = '❌';
				cellElements[i].classList.toggle('empty', false);
				
				if (board.winner == 'X') {
					cellElements[i].classList.toggle('won', true);
					cellElements[i].classList.toggle('lost', false);
				}
				if (board.winner == 'O') {
					cellElements[i].classList.toggle('won', false);
					cellElements[i].classList.toggle('lost', true);
				}
			} else if (cell == 'O') {
				cellElements[i].innerHTML = '⭕';
				cellElements[i].classList.toggle('empty', false);
				
				if (board.winner == 'X') {
					cellElements[i].classList.toggle('won', false);
					cellElements[i].classList.toggle('lost', true);
				}
				if (board.winner == 'O') {
					cellElements[i].classList.toggle('won', true);
					cellElements[i].classList.toggle('lost', false);
				}
			} else {
				cellElements[i].innerHTML = '';
				cellElements[i].classList.toggle('empty', true);
				cellElements[i].classList.toggle('won', false);
				cellElements[i].classList.toggle('lost', false);

				cellElements[i].onclick = async () => {
					try {
						startLoadingButton(cellElements[i]);
						const response = await window.contract.markCell(
							{
								x: (i % 3).toString(),
								y: Math.floor(i / 3).toString(),
							},
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
			}
		}

		if (board.winner == 'X') {
			messageElement.innerHTML = "❌ won!";
		} else if (board.winner == 'O') {
			messageElement.innerHTML = "⭕ won!";
		} else if (board.winner == 'TIE') {
			messageElement.innerHTML = "It's a tie!";
		} else if (board.currentTurnMark == 'X') {
			messageElement.innerHTML = "It's ❌ turn";
		} else if (board.currentTurnMark == 'O') {
			messageElement.innerHTML = "It's ⭕ turn";
		}

		if (board.winner == '') {
			startNewGameElement.style.display = 'none';
		} else {
			startNewGameElement.style.display = 'inherit';
		}
	}
}

document.querySelector("#sign-in-button").onclick = login;
document.querySelector("#sign-out-button").onclick = logout;

// Display the signed-out-flow container
function signedOutFlow() {
	document.querySelector("#signed-out-flow").style.display = "block";
}

// Displaying the signed in flow container and fill in account-specific data
function signedInFlow() {
	document.querySelector("#signed-in-flow").style.display = "block";

	document.querySelectorAll("[data-behavior=account-id]").forEach((el) => {
		el.innerText = window.accountId;
	});

	updateBoard();
}

const responseContainer = document.getElementById("response");

function updateResponse(message, success) {
	responseContainer.classList.toggle("error", success === false);
	responseContainer.classList.toggle("success", success === true);
	responseContainer.classList.add("shake");
	responseContainer.innerHTML =
		"<span>" + message + "</span>";
	setTimeout(() => {
		responseContainer.classList.remove("shake");
	}, 600);
}

// `nearInitPromise` gets called on page load
window.nearInitPromise = initContract()
	.then(() => {
		if (window.walletConnection.isSignedIn()) signedInFlow();
		else signedOutFlow();
	})
	.catch(console.error);

let s = {};
s.a = document.getElementById("snowfall-element");
s.b = s.a.getContext("2d");
s.c = function () {
	this.a = Math.random() * 2 + 2;
	this.b = Math.random() * s.a.width - this.a - 1 + this.a + 1;
	this.c = this.b;
	this.d = Math.random() * 50 + 1;
	this.e = Math.random();
	this.f = Math.random() * Math.PI * 2;
	this.g = Math.random() * 1.5 + 0.5;
	this.i = Math.random() * s.a.height - this.a - 1 + this.a + 1;
	this.j = () => {
		if (this.i > s.a.height + this.a) {
			this.i = -this.a;
		} else {
			this.i += this.g;
		}
		this.f += 0.02;
		this.b = this.c + this.d * Math.sin(this.f);
		s.b.fillStyle = "rgba(255,255,255," + this.e + ")";
		s.b.fillRect(this.b, this.i, this.a, this.a);
	};
};
s.e = () => {
	s.a.width = window.innerWidth;
	s.a.height = window.innerHeight;
	s.d = [];
	for (let x = 0; x < Math.ceil((s.a.width * s.a.height) / 15000); x += 1) {
		s.d.push(new s.c());
	}
};
window.addEventListener("resize", s.e);
s.f = () => {
	requestAnimationFrame(s.f);
	s.b.clearRect(0, 0, s.a.width, s.a.height);
	for (let x in s.d) {
		s.d[x].j();
	}
};
s.e();
s.f();
