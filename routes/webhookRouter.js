const db = require('../config/database');   //For DataBase Connection
const {fork} = require('child_process');   //For using Child Process

const router = require('express').Router()


// Inserting Webhook Values into DB
const sql = 'INSERT INTO webhook (aspect_type, object_id, object_type, owner_id, authorized, UTC_timing, IST_timing) VALUES(?,?,?,?,?,?,?)';
let params;

async function webhook(reqJson)
{
  var time = new Date();
  var GMT_time = time.toUTCString();
  var IST_time = time.toString();
  params = [reqJson.aspect_type, reqJson.object_id, reqJson.object_type, reqJson.owner_id, reqJson.updates.authorized, GMT_time, IST_time];
    db.run(sql, params, err => {
        if (err)
          return console.error(err.message);
      
          console.log("Webhook Responds Inserted INTO webhook Table DB!!");
      })
}


router.post('/webhook', (req, res) => {

  if(req.body.aspect_type == 'create')
  {
    webhook(req.body); // Inserting Webhook Values into DB

    //Working with Child Process for Multi-ThreadingDefining Child Process
    const childProcess = fork('../webhookToStrava.js');
    childProcess.send(JSON.stringify(req.body));
    childProcess.on("Message", function (Message)  {console.log("ok " + Message);})
    //childProcess.on("Message", (Message) => {console.log("ok " + Message);})
  }
  else if(req.body.aspect_type == 'delete')
  {
     webhook(req.body);
    const sql = 'DELETE FROM strava WHERE activity_id = ?;';
    let params = [req.body.object_id];

    db.run(sql, params, err => {
      if (err)
        return console.error(err.message);
    
        console.log("Data Deleted from Strava and Webhook Table DB!!");
    })
  } 
  else if(req.body.aspect_type == 'update')
  {
     webhook(req.body);
    //Working with Child Process for Multi-ThreadingDefining Child Process
    const childProcess = fork('../webhookTostravaUpdate.js');
    childProcess.send(JSON.stringify(req.body));
    childProcess.on("Message", function (Message)  {console.log("ok " + Message);})
    //childProcess.on("Message", (Message) => {console.log("ok " + Message);})

  }
  
  console.log("webhook event received!", req.query, req.body);
  res.status(200).send('EVENT_RECEIVED');
});


router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = "STRAVA";
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {     
      console.log('WEBHOOK_VERIFIED');
      res.json({"hub.challenge":challenge});  
    } else {
      res.sendStatus(403);      
    }
  }
});

module.exports = router;