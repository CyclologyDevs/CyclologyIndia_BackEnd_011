// Imports dependencies and DataBase
require("dotenv").config();
const db = require('./config/database');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));  // Com/on JS



// Listening for Parent Request and Sending Response
process.on("message", async function (message) {
  var user = JSON.parse(message);
  await start(user);
  // process.send("CHILD -> Total Athlete Date Inserted into Strava Table!!");
  //process.exit();
});



function insertActivitiesIntoStravaTable(athelete,user, json) {
  const sql = 'INSERT INTO strava (uuid,athlete_id, activity_id, activity_name, average_speed, distance, elapsed_time, max_speed, moving_time, start_date_local, start_date_local_epoch, total_elevation_gain) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)';
  let params;
  params = [athelete.uuid,user.owner_id, user.object_id, json.activity_name, json.average_speed, json.distance, json.elapsed_time, json.max_speed, json.moving_time, json.start_date_local, json.start_date_local_epoch, json.total_elevation_gain];
      db.run(sql, params, err => {
          if (err)
            return console.error(err.message);
        })
}

function changeDatetimeToDate(dateTimeObj)
{
        d = new Date(dateTimeObj);
        dateTimeObj = d.toDateString();

        return dateTimeObj;
}

async function stravaApiCall(athelete,user,access_token,callback_insertActivitiesIntoStravaTable) {
  const response = await fetch(`https://www.strava.com/api/v3/activities/${user.object_id}?include_all_efforts=" "&access_token=${access_token}`);
  const json = await response.json();
  

  var json1 = {}
        if (json.from_accepted_tag == process.env.from_accepted_tag && json.type == process.env.type  && json.manual == process.env.manual)
        {
            json1 = {
                activity_name: json.name,
                average_speed: json.average_speed,
                max_speed: json.max_speed,
                distance: json.distance,
                moving_time: json.moving_time,
                start_date_local: await changeDatetimeToDate (json.start_date_local),
                start_date_local_epoch: json.start_date_local,
                total_elevation_gain: json.total_elevation_gain,
                timezone: json.timezone,
            }
        }
        else
        {
          // console.log("NO JSON");
        }
  
  if (Object.keys(json1).length !== 0)
    callback_insertActivitiesIntoStravaTable(athelete,user,json1);
}

async function getAccessToken(athelete,user,refresh_token,callback_stravaApiCall) {
  const headers = {
    'Accept' : 'application/json, text/plain, */*',
    'Content-Type' : 'application/json'
  } 

  const body = JSON.stringify({
    client_id : process.env.Client_ID,
    client_secret : process.env.Client_Secret,
    refresh_token : refresh_token,
    grant_type : 'refresh_token',
  })

  const reAuthorizeResponse = await fetch('https://www.strava.com/oauth/token', {
    method : 'POST',
    "headers" : headers,
    "body" : body,
  })

   const reAuthResJson = await reAuthorizeResponse.json();

  // console.log("Access Token => - getAccessToken -  " + reAuthResJson.access_token);
  // console.log("Refresh Token =>  " + reAuthResJson.refresh_token);
  // console.log("Access Token Expiration =>  " + reAuthResJson.expires_at);
  // console.log("Access Token Expiration =>  " + reAuthResJson.expires_in);
  // console.log("Response JSON => - getAccessToken -  \n");
  // console.log(reAuthResJson);

  let sql = 'UPDATE users SET access_token = ?, access_token_expiration = ? WHERE athlete_id = ? ';
  let params = [reAuthResJson.access_token, reAuthResJson.expires_at, user.owner_id];

  db.all(sql, params, (err, rows) => {
    if (err) {
      return console.error(err.message);
    }

  callback_stravaApiCall(athelete,user ,reAuthResJson.access_token, insertActivitiesIntoStravaTable);
}
  )
}

function getRefreshToken(user, callback_getAccessToken, callback_stravaApiCall) {
  const sql = `SELECT * FROM users WHERE athlete_id = ?`;
  let params = [user.owner_id];
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    
    var athelete = rows[0];
    let dateNow = new Date();
    dateNow = dateNow.getTime();
    dateNow = Math.floor(dateNow / 1000);
    let expDate = rows[0].access_token_expiration;
    
    if(expDate < dateNow || rows[0].access_token==null || rows[0].access_token_expiration==null)
    {
      // console.log("DON'THave Token")
      callback_getAccessToken(athelete,user,rows[0].refresh_token,stravaApiCall);
    }
    else
    {
      // console.log("Have Token")
      callback_stravaApiCall(athelete,user ,rows[0].access_token, insertActivitiesIntoStravaTable);
    }
  })
}

async function start(user)
{
var sql = 'SELECT athlete_id from event WHERE athlete_id = ?;'
var params = [user.owner_id];

db.all(sql, params, (err, rows) => {
  if (err) {
    return console.error(err.message);
  }

  if(rows.length != 0)
  {
    // console.log("PASSED EVENT CHECK")
    getRefreshToken(user,getAccessToken,stravaApiCall)
  }
  else
  {
    // console.log("Failed EVENT CHECK")
  }
})
}

