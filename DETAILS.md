This is a full list of commands available.

Deployed here - https://explorer.testnet.near.org/transactions/EWHPpRBy7vRpzts73HvMsVdq6kvhJ1dWiHAoNaBuZoK6

# Add Candidate

Command

```
near call near-challenge-7.testnet addCandidate '{ "name": "Trump" }' --accountId martint.testnet --gas 300000000000000
```

Result

```
{
  success: true,
  messages: [ 'Trump successfully added to candidate list!' ]
}
```

# View Candidates

Command

```
near view near-challenge-7.testnet viewCandidates
```

Result

```
[
  {
    key: 0,
    value: { avatar: '72724247', voteCount: 0, alive: true, name: 'Trump' }
  },
  {
    key: 1,
    value: { avatar: '72724254', voteCount: 0, alive: true, name: 'Putin' }
  },
  {
    key: 2,
    value: { avatar: '72724267', voteCount: 0, alive: true, name: 'Cat from NEAR' }
  },
  {
    key: 3,
    value: { avatar: '72724285', voteCount: 0, alive: false, name: 'Nobody' }
  },
  {
    key: 4,
    value: { avatar: '72724317', voteCount: 3998, alive: true, name: 'Trump' }
  },
  {
    key: 5,
    value: { avatar: '72724326', voteCount: 2687, alive: true, name: 'Trump Junior' }
  },
  {
    key: 6,
    value: { avatar: '72724344', voteCount: 1, alive: true, name: 'Somebody' }
  }
]
```

# Vote

Command

```
near call near-challenge-7.testnet vote '{ "candidateId": "2" }' --accountId martint.testnet --gas 300000000000000
```

Result

```
{
  success: true,
  messages: [ 'Successfully voted for Cat from NEAR!' ]
}

or

{
  success: false,
  messages: [ 'You have already voted!' ]
}
```

# View Votes

Command

```
near view near-challenge-7.testnet viewVotes
```

Result

```
[
  { key: 'martint.testnet', value: { candidateId: 2 } },
  { key: 'spiritdungeons.testnet', value: { candidateId: 4 } }
]
```

# Remove Candidate

Command

```
near call near-challenge-7.testnet removeCandidate '{ "candidateId": "3" }' --accountId martint.testnet --gas 300000000000000
```

Result

```
{
  success: true,
  messages: [ 'Trump removed from election!' ]
}

or if candidate doesn't exist

{
  success: true,
  messages: [ "Candidate doesn't exist! I guess that's something you wanted in the first place!" ]
}
```

# Remove Your Vote

Removes a vote you previously casted

Command

```
near call near-challenge-7.testnet removeVote --accountId martint.testnet --gas 300000000000000
```

Result

```
{
  success: true,
  messages: [ 'Your vote for Cat from NEAR has been removed!' ]
}

or if you didn't vote

{
  success: true,
  messages: [ "Dodged a bullet there! You didn't vote for a candidate before!" ]
}
```

# Add Candidate - Trump Mode

It adds a candidate and gives them random amount of votes

Command

```
near call near-challenge-7.testnet addCandidateTrumpMode '{ "name": "Trump Junior" }' --accountId martint.testnet --gas 300000000000000
```

Result

```
{
  success: true,
  messages: [
    'Trump Junior successfully added to candidate list!',
    '...',
    'Crowd roars! Trump Junior gets 2687 votes!'
  ]
}
```

# Add Candidate - Hitler Mode

Adds and "kills" candidate

Command

```
near call near-challenge-7.testnet addCandidateHitlerMode '{ "name": "Hitler" }' --accountId martint.testnet --gas 300000000000000
```

Result

```
{
  success: true,
  messages: [
    'Hitler has joined the party!',
    '...',
    'Hitler has left the party!',
    '...',
    'Wait! Why is he not moving???'
  ]
}
```

# Ask Cat to Revive Candidate

If Cat is in the mood (50%) then he will revive a dead candidate

Command

```
near call near-challenge-7.testnet askCatToReviveCandidate '{ "candidateId": "5" }' --accountId martint.testnet --gas 300000000000000
```

Result

```
{
  success: true,
  messages: [
    "I'm a merciful god and your wish has been granted!",
    'Trump Junior lives again!'
  ]
}

or if he's not in mood

{
  success: false,
  messages: [
    "Not in a mood now!",
	'Try again later ;)',
  ]
}

or if candidate is already alive

{
  success: false,
  messages: [
    "Eh? He's already alive! What are you doing with your life?",
  ]
}

or if candidate never existed

{
  success: false,
  messages: [
    "Are you kidding me? Candidate has not been alive yet!",
  ]
}

```

# Vote - 360 No Scope Mode

Votes for a random candidate - dead or alive

Command

```
near call near-challenge-7.testnet vote360NoScopeMode --accountId spiritdungeons.testnet --gas 300000000000000
```

Result

```
{
  success: true,
  messages: [
    'You jump the system and your previous vote (Trump) has been removed!',
    'You spin!',
    'You vote!',
    '...',
    'Vote lands on Cat from NEAR'
  ]
}
```

# Get Leading Candidate

Gets candidate with the highest amount of votes

Command

```
near view near-challenge-7.testnet getLeadingCandidate
```

Result

```
{
  success: true,
  messages: [ 'Trump is currently in 1st place with 60.0% (3998.0) votes!' ]
}
```

# Start New Election

Clears all candidates and votes (keeps logs)

Command

```
near call near-challenge-7.testnet startNewElection --accountId martint.testnet --gas 300000000000000
```

Result

```
{
  success: true,
  messages: [
    'Trump won the election with 60.0% (3998) votes!',
    '...',
    'Starting a new election!'
  ]
}
```

# View Logs

System stores all actions users make and you can view them all using this command

Command

```
near view near-challenge-7.testnet viewLogs
```

Result

```
[
  {
    key: 0,
    value: { user: 'martint.testnet', action: 'Added candidate Trump' }
  },
  {
    key: 1,
    value: { user: 'martint.testnet', action: 'Added candidate Putin' }
  },
  {
    key: 2,
    value: {
      user: 'spiritdungeons.testnet',
      action: 'Added candidate Cat from NEAR'
    }
  },
  {
    key: 3,
    value: { user: 'spiritdungeons.testnet', action: 'Voted for Cat from NEAR' }
  },
  {
    key: 4,
    value: { user: 'spiritdungeons.testnet', action: 'Added candidate Nobody' }
  },
  {
    key: 5,
    value: { user: 'spiritdungeons.testnet', action: 'Removed candidate Nobody' }
  },
  {
    key: 6,
    value: {
      user: 'spiritdungeons.testnet',
      action: 'Removed his vote for Cat from NEAR'
    }
  },
  {
    key: 7,
    value: {
      user: 'martint.testnet',
      action: 'Added candidate Trump in Trump mode with 3998.0 votes'
    }
  },
  {
    key: 8,
    value: {
      user: 'martint.testnet',
      action: 'Added candidate Trump Junior in Trump mode with 2687.0 votes'
    }
  },
  {
    key: 9,
    value: {
      user: 'martint.testnet',
      action: 'Tried adding candidate Hitler in Hitler mode'
    }
  },
  {
    key: 10,
    value: { user: 'martint.testnet', action: 'Added candidate Somebody' }
  },
  {
    key: 11,
    value: {
      user: 'martint.testnet',
      action: 'Removed candidate Trump Junior'
    }
  },
  {
    key: 12,
    value: { user: 'martint.testnet', action: 'Made Cat revive Trump Junior' }
  },
  {
    key: 13,
    value: {
      user: 'spiritdungeons.testnet',
      action: 'Made a 360 No Scope vote for Trump'
    }
  },
  {
    key: 14,
    value: {
      user: 'spiritdungeons.testnet',
      action: 'Made a 360 No Scope vote for Somebody'
    }
  },
  {
    key: 15,
    value: { user: 'martint.testnet', action: 'Started new election!' }
  }
]
```

# Run through scenarious quickly

There are more variations of responses than what I provided in examples and you can run through many scenarious using these commands quickly - https://github.com/MartinTale/near-challenge-7/blob/main/commands.sh
