// Imports dependencies and DataBase
require("dotenv").config();
const db = require('../config/database');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));  // Com/on JS

// Listening for Parent Request and Sending Response
process.on("message", async function (message) {
    var user = JSON.parse(message);
    //console.log(user);
    await start(user);
    // process.send("CHILD -> Total Athlete Date Inserted into Strava Table!!");
    //process.exit();
  });


function epoch(dateString) {
    // console.log(dateString);
    let someDate = new Date(dateString);
    // console.log(someDate);
    // someDate = someDate.setUTCDate();
    // console.log(someDate);
    someDate = someDate.getTime();   // geting someDate in Milli-Second
    someDate = someDate - 18000000 - 1800000 - 1000  // IST to GMT (-5hr -30min -1Sec)
    // console.log(someDate);
    someDate = someDate/1000;     // Converting Mili-Second to Second (1 Milli-Second = 1000 Second)
    return someDate;
}

function changeDatetimeToDate(json1)
{
    for (const keys in json1)
    {
        d = new Date(json1[keys].start_date);
        json1[keys].start_date = d.toDateString();

        d = new Date(json1[keys].start_date_local);
        json1[keys].start_date_local = d.toDateString();

        // console.log("Start Date = " + json1[keys].start_date);
        // console.log("Start Date Local = " + json1[keys].start_date_local);
    }
}

  function insertActivitiesIntoStravaTable(athelete,user, json) {

    const sql = 'INSERT INTO strava (uuid,athlete_id, activity_id, activity_name, average_speed, distance, elapsed_time, max_speed, moving_time, start_date_local, start_date_local_epoch, total_elevation_gain) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)';
    let params;

    json.forEach( (json) => {
        params = [user.uuid, user.athlete_id, json.id, json.activity_name, json.average_speed, json.distance, json.elapsed_time, json.max_speed, json.moving_time, json.start_date_local, json.start_date_local_epoch, json.total_elevation_gain];
    
        db.run(sql, params, err => {
            if (err)
              return console.error(err.message);
        })
    })
    console.log("Done Dona Done!!!");
  }
  
  async function stravaApiCall(athelete,user,access_token,callback_insertActivitiesIntoStravaTable) {

    let tdate = Date.now();
    let fdate = user.event_start_date;
    tdate = await epoch(tdate);
    fdate = await epoch(fdate);

    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?before=${tdate}&after=${fdate}&page=1&per_page=30&access_token=${access_token}`);
    const json = await response.json();

    var json1 = []
      for (const keys in json)
      {
          if (json[keys].from_accepted_tag == process.env.from_accepted_tag && json[keys].type == process.env.type  && json[keys].manual == process.env.manual) 
          {
              temp = {
                  id: json[keys].id,
                  activity_name: json[keys].name,
                average_speed: json[keys].average_speed,
                max_speed: json[keys].max_speed,
                distance: json[keys].distance,
                moving_time: json[keys].moving_time,
                start_date_local: await changeDatetimeToDate (json[keys].start_date_local),
                start_date_local_epoch: json[keys].start_date_local,
                total_elevation_gain: json[keys].total_elevation_gain,
                timezone: json[keys].timezone,
              }
              json1.push(temp);
          }
      }
    

    if (json1.length !== 0)
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
    let params = [user.athlete_id];
    
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
      let event_start_date = Date();
      let dateNow = Date(user.event_start_date);
      
      var sql = 'SELECT athlete_id from event WHERE athlete_id = ?;'
      var params = [user.athlete_id];
        
      db.all(sql, params, (err, rows) => {
        if (err)
          return console.error(err.message);
        
          //console.log(rows);
        
        if(rows.length == 1)
        {
          //console.log("PASSED EVENT CHECK")
          //console.log(user.event_start_date , dateNow, event_start_date)
          //console.log(user.event_start_date > dateNow)
          //console.log(user.event_start_date < dateNow)
          if(user.event_start_date < dateNow ) {
            //console.log("Yes YES!");
            getRefreshToken(user, getAccessToken, stravaApiCall);
          }
        }
        else
        {
          //console.log("Failed EVENT CHECK")
        }
      })
}