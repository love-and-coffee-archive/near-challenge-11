This tutorial goes through Smart Contract I made for NEAR Challenge #7. See list below of features we will be going through.

# Features

**Candidates**

-   Add Candidate
-   Add Candidate - Trump Mode
-   Add Candidate - Hitler Mode
-   Ask Cat to Revive Candidate
-   Remove Candidate
-   View Candidates

**Votes**

-   Vote
-   Vote - 360 No Scope Mode
-   Remove Your Vote
-   View Votes

**Election**

-   Get Leading Candidate
-   Start New Election

**Utility**

-   View Logs

# Setup

1. Follow NEAR Hackaton guide to setup environment - https://docs.near.org/docs/develop/basics/hackathon-startup-guide
2. Clone or download this repository
3. Update `CONTRACT_NAME` in `src\config.js` with your NEAR account
4. Install dependencies with the command below

```
yarn install
```

# Smart Contract

Essentially, this is a program that runs on blockchain. We will go through my contract step by step after which you should be able to make your own modifications and deploy your version of Voting system.

# Lets Dig In!

Open up `assembly\main.ts` file right at the beginning I setup few data structures required by our Voting System.

## Candidate class

```
@nearBindgen
class Candidate {
	avatar: u64;
	voteCount: number;
	alive: boolean;

	constructor(public name: string) {
		this.avatar = context.blockIndex;
		this.voteCount = 0;
		this.alive = true;
	}
}
```

First line `@nearBindgen` is a special as it allows NEAR serialize our Candidate objects to be serialized on blockchain.

After that we define few properties (`avatar`, `voteCount`, `alive`) our voting system will use to manage Candidate state. In the constructor we set our default for whenever new Candidate is created.

In addition, we have declared one class property inside the constructor argument list. This is a shorthand to allow that argument to be passed in when object is created, set that properties value.

There is a basic Vote class there as well but nothing different nor important is there but it could be extended with additional information, e.g. when vote was made.

## CallResponse class

When creating backend systems you always want to have a robust and consistent way you can get data back to be manipulated or displayed on frontend so we define this basic structure to be used in all out call functions.

```
@nearBindgen
class CallResponse {
	constructor(
		public success: boolean,
		public messages: string[],
	) {

	}
}
```

`success` property indicates if request was successful to know how and which response to display to user in a user friendly way.
`messages` in our case explain what went wrong with out request to end user or communicate other information - in our case for entertainment :)

## ActionLog class

All important system should have an ability to track down who changed what in the system. In our case it's who (which user) interacted with our system in what way (voted, added candidate, started a new election).

```
@nearBindgen
class ActionLog {
	constructor(
		public user: string,
		public action: string,
	) {

	}
}
```

`user` contains their username and `action` explains what they did.

## Data Storage

In order for system to work and not just forget what it knows after each command is executed we need to preserve that data somewhere. You can read more about `PersistentUnorderedMap` and other storage options here - https://docs.near.org/docs/concepts/data-storage#persistentunorderedmap

```
const candidates = new PersistentUnorderedMap<number, Candidate>("m");
const votes = new PersistentUnorderedMap<string, Vote>("n");
const logs = new PersistentUnorderedMap<number, ActionLog>("b");
```

Important thing to keep in mind is that you need to specify different name (`m`, `n`, `b`) for each one of them. Otherwise, they all will point to the same data causing unexpected results.

## Helpers

In order to keep the rest of the code cleaner it's often useful to create some helper functions that handle repeated tasks for you.

### Random Number & Boolean Generation

In NEAR to work with randomness we need to user `math.randomBuffer` that comes from `near-sdk-core` - https://near.github.io/near-sdk-as/globals.html that returns X amount of random numbers for you to work with.

```
function randomNumber(min: number = 0, max: number = 100): i32 {
	const buf = math.randomBuffer(4);
	return i32(min + (((((0xff & buf[0]) << 24) |
	((0xff & buf[1]) << 16) |
	((0xff & buf[2]) << 8) |
	((0xff & buf[3]) << 0)) as number) % (max - min)
	));
}

function randomBoolean(): boolean {
	return randomNumber(0, 100) >= 50;
}
```

To get random boolean value we reuse our existing helper function `randomNumber` for simplicity.

### Responses & Logs

Other common functions I tend to use is `response` and `log`. These wrappers are very useful in a case where at some point you want to change how they work then you only have to do it in one place instead of digging through the whole code.

```
function response(messages: string[], success: boolean): CallResponse {
	return new CallResponse(success, messages)
}

function log(message: string): void {
	const logEntries = logs.keys();
	logs.set(logEntries.length, new ActionLog(
		context.sender,
		message,
	));
}
```

# Add Candidate

First, we need ability to add new candidates to the election.

```
export function addCandidate(name: string): CallResponse {
	const candidate = new Candidate(name);

	candidates.set(candidates.length, candidate);

	log('Added candidate ' + candidate.name);

	return response([candidate.name + ' successfully added to candidate list!'], true);
}
```

There is only one argument `name` that we require and that's used to initialize a new Candidate. After that we store this candidate in our storage using `candidates.set(candidates.length, candidate)`. First parameter for set method is the key on how we want to identify and later retrieve our candidate. I simply use `candidates.length` which returns number of already existing candidates giving us a unique identifier for our Candidate.

After that we log user action and respond with user friendly message.

# View Candidate

Users will want to know all available candidates and their votes. Thanks to `PersistentUnorderedMap` we can very easily return all our candidates using `candidates.entries()` that creates an array of key/value pairs of our candidates.

```
export function viewCandidates(): MapEntry<number, Candidate>[] {
	return candidates.entries();
}
```

# Vote

And now, the most important function - ability to vote! This one is a bit more complex so I'll split it in parts.

```
export function vote(candidateId: string): CallResponse {
	const candidateIntId = parseInt(candidateId);

	if (votes.contains(context.sen
	der)) {
		return response(['You have already voted!'], false);
	}
```

First, we check if user has already made a vote in the past in current election. If that's the case we respond with error message and mark request as unsuccessful.

```
	const candidate = candidates.get(candidateIntId);

	if (candidate == null) {
		return response(["Candidate doesn't exist!"], false);
	}
```

Then we check if candidate user is voting for exists in the system. If it doesn't then we again respond with error message.

```
	if (candidate.alive) {
		candidate.voteCount += 1;

		candidates.set(candidateIntId, candidate);

		votes.set(context.sender, new Vote(candidateIntId));

		log('Voted for ' + candidate.name);

		return response(["Successfully voted for " + candidate.name + "!"], true);
```

Now, that we know user can vote for a valid candidate, we check if candidate is alive. If he is then we increase candidates `voteCount`, save the updated candidate and store information that this user voted for this participant.

After that we log their action and respond with successful request and message.

```
	} else {
		return response([
			"You can't vote for the dead!",
			"Or can you?",
			"No, no, you can't :p",
		], false);
	}
}
```

Finally, if candidate is indeed dead (can happen through other commands in the system) we return a small entertaining joke message and mark request as failed.

# That's It Folks!

This covers the basic functionallity of our voting system. If you keep scrolling down in `assembly\main.ts` you will find additional commands to explore and experiment with.

Now that we have gone through the code - we want to build and deploy our voting system to NEAR.

# Build & Deploy

Before you build and deploy your Smart Contract (our Voting System) make sure that you have logged in using NEAR by typing `near login` in console and updating `CONTRACT_NAME` in `src\config.js` with your username as that's where the contract will be deployed.

Now, build the contract by executing command below in root directory of the project.

```
yarn run build:contract
```

Then deploy it using command below

```
near deploy
```

# Commands

Now, that your Smart Contract is deployed you can call these methods to interact with it.

**IMPORTANT** - replace `near-challenge-7.testnet` and `martint.testnet` with your own username.

## Add Candidate

**Command**

```
near call near-challenge-7.testnet addCandidate '{ "name": "Trump" }' --accountId martint.testnet --gas 300000000000000
```

**Result**

```
{
  success: true,
  messages: [ 'Trump successfully added to candidate list!' ]
}
```

## View Candidates

**Command**

```
near view near-challenge-7.testnet viewCandidates
```

**Result**

```
[
  {
    key: 0,
    value: { avatar: '72724247', voteCount: 0, alive: true, name: 'Trump' }
  },
  {
    key: 1,
    value: { avatar: '72724317', voteCount: 3998, alive: true, name: 'Trump Junior' }
  },
  {
    key: 2,
    value: { avatar: '72724344', voteCount: 1, alive: true, name: 'Martin' }
  }
]
```

## Vote

**Command**

```
near call near-challenge-7.testnet vote '{ "candidateId": "2" }' --accountId martint.testnet --gas 300000000000000
```

**Result**

```
{
  success: true,
  messages: [ 'Successfully voted for Martin!' ]
}

or

{
  success: false,
  messages: [ 'You have already voted!' ]
}
```

Feel free to go through the rest of the commands/functions in `assembly\main.ts` and see exactly what they do and how they respond here - https://github.com/MartinTale/near-challenge-7/blob/main/DETAILS.md






































Guest Book
==========

[![Build Status](https://travis-ci.com/near-examples/guest-book.svg?branch=master)](https://travis-ci.com/near-examples/guest-book)

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/near-examples/guest-book)

<!-- MAGIC COMMENT: DO NOT DELETE! Everything above this line is hidden on NEAR Examples page -->

Sign in with [NEAR] and add a message to the guest book! A starter app built with an [AssemblyScript] backend and a [React] frontend.


Quick Start
===========

To run this project locally:

1. Prerequisites: Make sure you have Node.js ≥ 12 installed (https://nodejs.org), then use it to install [yarn]: `npm install --global yarn` (or just `npm i -g yarn`)
2. Run the local development server: `yarn && yarn dev` (see `package.json` for a
   full list of `scripts` you can run with `yarn`)

Now you'll have a local development environment backed by the NEAR TestNet! Running `yarn dev` will tell you the URL you can visit in your browser to see the app.


Exploring The Code
==================

1. The backend code lives in the `/assembly` folder. This code gets deployed to
   the NEAR blockchain when you run `yarn deploy:contract`. This sort of
   code-that-runs-on-a-blockchain is called a "smart contract" – [learn more
   about NEAR smart contracts][smart contract docs].
2. The frontend code lives in the `/src` folder.
   [/src/index.html](/src/index.html) is a great place to start exploring. Note
   that it loads in `/src/index.js`, where you can learn how the frontend
   connects to the NEAR blockchain.
3. Tests: there are different kinds of tests for the frontend and backend. The
   backend code gets tested with the [asp] command for running the backend
   AssemblyScript tests, and [jest] for running frontend tests. You can run
   both of these at once with `yarn test`.

Both contract and client-side code will auto-reload as you change source files.


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
