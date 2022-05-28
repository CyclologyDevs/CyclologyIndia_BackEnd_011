const express = require('express');
const router = express.Router();
const db = require('../config/database');   //For DataBase Connection
const path = require('path');
require("dotenv").config();
const {fork} = require('child_process');   //For using Child Process


const isInEvent = async (req, res, next) => {
    let { uuid, athlete_id, event_name } = req.body;


    db.all(`SELECT * from event WHERE uuid = ? AND athlete_id = ? AND event_name = ?`,[uuid, athlete_id, event_name], (err, data) => {
        if (err) 
          return res.status(400).json({ "error": err.message });

          console.log(data);
          console.log(uuid, athlete_id, event_name)

        if(data.length == 0)
            return res.status(400).send("NOT in EVENT");
        else
            return res.status(200).send("In EVENT");
    })
}

const joinEvent = async (req, res, next) => {
    let { uuid, athlete_id, event_start_date, event_end_date, event_name } = req.body;

  const sql = `INSERT INTO event(uuid, athlete_id, event_start_date, event_end_date, event_name) VALUES(?,?,?,?,?);`;
  let params = [uuid, athlete_id, event_start_date, event_end_date,event_name];

  db.all(`SELECT * from event WHERE uuid = ? AND athlete_id = ? AND event_name = ?`,[uuid, athlete_id, event_name], (err, data) => {
    if (err) 
      return res.status(400).json({ "error": err.message });

      //console.log(data.length == 0);
    
    if (data.length == 0){
      db.all(sql,params, (err, data, fields) => {
        if (err)
          return res.status(400).json({ "error": err.message });
        
         
          
          console.log("200 OK   Event Joint by Athlete =>  "+ uuid + " " + athlete_id);

        //Working with Child Process for Multi-ThreadingDefining Child Process
        const childProcess = fork('./controllers/fetchOldActivities.js');
        childProcess.send(JSON.stringify({uuid, athlete_id, event_start_date, event_end_date, event_name}));
        childProcess.on("Message", function (Message)  {console.log("ok " + Message);})
        //childProcess.on("Message", (Message) => {console.log("ok " + Message);})

          console.log("EVENT JOINT SUCCESSFULLY!");
          return res.status(200).send("EVENT JOINT SUCCESSFULLY!");
        })
    } else {
      return res.status(400).json({ "error": "user alredy have joint the event" });
    }

  })
}

const leaveEvent = async (req, res, next) => {
  console.log("leave event");

    let { uuid, athlete_id, event_start_date, event_end_date, event_name } = req.body;

    
    let params = [uuid];

    let sql = 'DELETE FROM strava WHERE uuid = ?;';
    db.run(sql, params, err => {
      if (err)
        return console.error(err.message);
    
        console.log("Data Deleted from Strava Table DB!!");
    })

    sql = 'DELETE FROM event WHERE uuid = ?;';
    db.run(sql, params, err => {
      if (err)
        return console.error(err.message);
    
        console.log("Data Deleted from Event Table DB!!");
    })

    sql = 'DELETE FROM webhook WHERE owner_id = ?;';
    params = [athlete_id]
    db.run(sql, params, err => {
      if (err)
        return console.error(err.message);
    
        console.log("Data Deleted from Webhook Table DB!!");
    })

    return res.status(200).send("Event Left!");
}



module.exports = {
    isInEvent,
    joinEvent,
    leaveEvent
};