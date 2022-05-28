const event_controller = require('../controllers/eventController')

const router = require('express').Router()


router.get(`/event00001`, event_controller.event00001);
router.get('/event00002', event_controller.event00002);
router.get('/event_may750', event_controller.event_may750);
router.get('/event_june800', event_controller.event_june800);


module.exports = router;