// I M P O R T || D E P E N D E N C I E S

// Imports dependencies and sets up http server
require("dotenv").config();   //For use .env file
const express = require('express');   //For using EXPRESS JS
const cors = require('cors');   //For using Cross Origin Resource Sharing
const path = require('path');   //For getting the current directory path
const  bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");


// creates express http server
const app = express();


// Importing the Routes Controller Middleware Manager
const eventsRouter = require('./routes/eventsRouter');
const accountRouter = require('./routes/accountRouter');
const webhookRouter = require('./routes/webhookRouter');

const connect_strava = require('./controllers/connect_strava');
const eventManager = require('./controllers/eventManager');

const contact_us = require('./middlewares/contactUs');


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// M I D D L E W A R E
app.use(cors()) 
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'));
app.use('/ProfilePics', express.static('ProfilePics'))
//app.use(express.urlencoded({extended:true}), cors({origin: 'http://localhost:3000'}));


app.use('/events', eventsRouter);
app.use('/account', accountRouter);
app.use('/webhook', webhookRouter);


// R O U T E A || E N D P O I N T S
app.post('/connect_strava', connect_strava.connectStrava)

app.post('/is_in_event', eventManager.isInEvent);
app.post('/join_event', eventManager.joinEvent);
app.post('/leave_event', eventManager.leaveEvent);

app.post('/contact_us', contact_us.contactMe);


// L I S T E N I N G
app.listen( process.env.PORT || 3100, () => console.log(`Listening on Port ${process.env.PORT || 3100}`))