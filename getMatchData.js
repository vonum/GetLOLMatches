const fs = require('fs');
const axios = require('axios');

const apikey = ''; // Copy your API key here
const url = `https://euw.api.pvp.net/api/lol/euw/v2.5/league/challenger?type=RANKED_SOLO_5x5&api_key=${apikey}`;
console.log(url);

let summonerIds;
let cooldown = 0;
let noOfMatches = 0;
const matches = [];
const matchesIds = [];
//const promises = [];

axios.get(url)
.then(resp => {
  console.log('Fetched summoner IDs');
  summonerIds = resp.data.entries.map(summoner => summoner.playerOrTeamId);
  for (let  summonerId of summonerIds) {
    setTimeout(() => getMatches(summonerId), getCooldown() * 2000);
  }
})
.catch(error => {
  console.log(error.message);
});

const getMatches = (summonerId) => {
  const urlMatches = `https://euw.api.pvp.net/api/lol/euw/v2.2/matchlist/by-summoner/${summonerId}?rankedQueues=TEAM_BUILDER_RANKED_SOLO&beginTime=1481108400000&beginIndex=0&endIndex=10&api_key=${apikey}`
  axios.get(urlMatches)
  .then(resp => {
    console.log(`Fetched matches for summoner ${summonerId}`);
    const matchesForPlayer = resp.data;

    if (matchesForPlayer.matches !== undefined) {
      noOfMatches += matchesForPlayer.matches.length;

      //get match data for every match with delay due to number of requests limitation from LOL API
      for (let match of matchesForPlayer.matches) {
        setTimeout(() => getMatch(match.matchId), getCooldown() * 2000);
      }
    }
  })
  .catch(error => {
    console.log(error.message);
  });
};

const getMatch = (matchId) => {
  const urlMatch = `https://euw.api.pvp.net/api/lol/euw/v2.2/match/${matchId}?api_key=${apikey}`;
  const promise = axios.get(urlMatch)
  .then(resp => {
    if(!matchesIds.includes(resp.data.matchId)) {
      if (resp.data.matchDuration > 1800) {
        matches.push(resp.data);
        matchesIds.push(resp.data.matchId);
        console.log(`Fetched match ${resp.data.matchId}, duration - ${resp.data.matchDuration/60}`);
      } else {
        console.log(`Match ${resp.data.matchId} too short, duration - ${resp.data.matchDuration/60}`);
      }
    }
  })
  .catch(error => {
    console.log(error.message);
  });
};

const getCooldown = () => {
  cooldown += 1;
  return cooldown;
};

const writeToFile = () => {
  fs.writeFileSync('matchesChallenger10.json', JSON.stringify(matches), 'utf8');
  console.log('FILE SAVED');
};

process.on('exit', () => {
  writeToFile()
  console.log('EXITING');
});
