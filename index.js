const fs = require('fs');
const axios = require('axios');
var JSONStream = require('JSONStream');

const manu_fans = [];
const matches = []
const NEEDLE = 'Spending';
const API_URL = "https://fantasy.premierleague.com/api/leagues-classic/13/standings/";

function wait(delay = 10) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), delay)
  })
}

async function getFans() {
  let has_next = true;
  let page_standings = 1;

  console.log("STARTING\n")

  while (has_next) {
    console.log(`Checking page_standings=${page_standings}\n`);
    try {
      const response = await axios.get(`${API_URL}?page_standings=${page_standings}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
          cookie: '_gid=GA1.2.1992657165.1608982432; pl_profile="eyJzIjogIld6SXNNekk0TVRRd01ETmQ6MWt2bTNYOmd6ZXZ2ZTh2aDhySU00VEhtN3VvWGRXNTNYbyIsICJ1IjogeyJpZCI6IDMyODE0MDAzLCAiZm4iOiAiRGF2aWQiLCAibG4iOiAiU2FpbnQiLCAiZmMiOiAxfX0="; csrftoken=ExCab8C6cYiFfOj2k0t07eiZmIlJGm5WWv8j5ctXu3KtmMD0MzHZmA73rx1KzJaN; sessionid=.eJyrVopPLC3JiC8tTi2Kz0xRslIyNrIwNDEwMFbSQZZKSkzOTs0DyRfkpBXk6IFk9AJ8QoFyxcHB_o5ALqqGjMTiDKBqS0MTy8S0VHNjI7OUlFTzFENjw1QzY1MLQ0uzZAPDVEMDCxOL1DRDS6VaAHL4K-A:1kvm3Y:Yce5-Jvih6VHnpAdEO1nVaxIyYs; _ga_NREXP8D25C=GS1.1.1609636855.43.1.1609637186.0; _ga=GA1.2.1883308242.1608818939',
          referer: `https://fantasy.premierleague.com/leagues/13/standings/c?phase=6&page_new_entries=1&page_standings=${page_standings}`
        }
      })
      const {data} = response;
      console.log(data);
      manu_fans.push(...data.standings.results);
      const matched = data.standings.results.filter(f => f.entry_name.contains(NEEDLE))
      matches.push(...matched)
      has_next = data.standings.has_next;
      page_standings += 1;
    } catch (e) {
      console.log("Error", e);
      if (e.code !== 'ETIMEDOUT') {
        break;
      }
      console.log("Retrying")
    }
    console.log("Waiting")
    await wait();
    console.log("finished waiting")
  }

  console.log("saving all fans \n")
  const transformStream = JSONStream.stringify();
  const outputStream = fs.createWriteStream( __dirname + "/fans.json" );

  transformStream.pipe( outputStream );
  manu_fans.forEach( transformStream.write );
  transformStream.end();

  outputStream.on(
    "finish",
    function handleFinish() {

      console.log("Finished saving all fans on fpl. \n");
      console.log( "- - - - - - - - - - - - - - - - - - - - - - - \n" );

    }
  );



  try {
    console.log("Started saving matches")
    fs.writeFile("matches.json", JSON.stringify(matches, undefined, 2), function (err) {
      console.log("done saving matches", err);
    })
  } catch (e) {
    console.log("Error", e)
  }
}

getFans();
