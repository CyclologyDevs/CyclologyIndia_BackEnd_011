const express = require('express');
const router = express.Router();
const db = require('../config/database');   //For DataBase Connection
const path = require('path');
require("dotenv").config();



// * E V E N T 0 0 1

const event00001 = async (req, res, next) => {
    db.all(`SELECT * FROM event WHERE event_name = ?`,[`Event 1`], (err, data) => {
        if (err) 
          return console.error(err.message);
         
          const sql = `SELECT users.fname, users.lname, users.uuid, strava.athlete_id, SUM(strava.distance) as T_Distance FROM users JOIN strava ON users.athlete_id = strava.athlete_id JOIN event ON event.athlete_id = users.athlete_id WHERE event.event_name="Event 1" AND strava.start_date_local_epoch BETWEEN ? AND ? GROUP BY strava.athlete_id ORDER BY T_Distance DESC;`;
          let params = [data[0].event_start_date, data[0].event_end_date];
    
          db.all(sql,params, (err, data, fields) => {
            if (err) 
              return console.error(err.message);
    
            res.status(200).send(data);
            });
        })    
}


// * E V E N T 0 0 2

const event00002 = async (req, res, next) => {
    db.all(`SELECT * FROM event WHERE event_name = ?`,[`Event 2`], (err, data) => {
        if (err) 
          return console.error(err.message);
    
        const sql = `SELECT fname,lname,uuid,athlete_id, SUM(T_Distance) as T_Distance FROM (SELECT users.fname, users.lname, users.uuid, strava.athlete_id, MAX(strava.distance) as T_Distance FROM users JOIN strava ON users.athlete_id = strava.athlete_id JOIN event ON event.athlete_id = users.athlete_id WHERE event.event_name="Event 2" AND strava.start_date_local_epoch BETWEEN ? AND ? GROUP BY strava.start_date_local, strava.athlete_id) GROUP BY athlete_id ORDER BY T_Distance DESC;`;
        let params = [data[0].event_start_date, data[0].event_end_date];
    
        db.all(sql,params, (err, data, fields) => {
          if (err) 
            return console.error(err.message);
    
        res.status(200).send(data);
          });
        });
}


// * E V E N T 0 0 3

const event_may750 = async (req, res, next) => {
    db.all(`SELECT * FROM event_records WHERE event_name = ?`,[`May750`], (err, data) => {
        if (err) 
          return console.error(err.message);
    
          const sql = `SELECT users.fname, users.lname, users.uuid, strava.athlete_id, SUM(strava.distance) as T_Distance FROM users JOIN strava ON users.athlete_id = strava.athlete_id JOIN event ON event.athlete_id = users.athlete_id WHERE event.event_name="May750" AND strava.start_date_local_epoch BETWEEN ? AND ? GROUP BY strava.athlete_id ORDER BY T_Distance DESC;`;
          let params = [data[0].event_start_date, data[0].event_end_date];
        
          db.all(sql,params, (err, data, fields) => {
          if (err) 
              return console.error(err.message);
        
           res.status(200).send(data);
          });
        })
}



// * E V E N T 0 0 4

const event_june800 = async (req, res, next) => {
  db.all(`SELECT * FROM event_records WHERE event_name = ?`,[`June800`], (err, data) => {
      if (err) 
        return console.error(err.message);
  
        const sql = `SELECT users.fname, users.lname, users.uuid, strava.athlete_id, SUM(strava.distance) as T_Distance FROM users JOIN strava ON users.athlete_id = strava.athlete_id JOIN event ON event.athlete_id = users.athlete_id WHERE event.event_name="June800" AND strava.start_date_local_epoch BETWEEN ? AND ? GROUP BY strava.athlete_id ORDER BY T_Distance DESC;`;
        let params = [data[0].event_start_date, data[0].event_end_date];
      
        db.all(sql,params, (err, data, fields) => {
        if (err) 
            return console.error(err.message);
      
         res.status(200).send(data);
        });
      })
}



module.exports = {
    event00001,
    event00002,
    event_may750,
    event_june800
}
