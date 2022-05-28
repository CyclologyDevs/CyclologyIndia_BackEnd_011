const multer  = require('multer')
const user_controller = require('../controllers/userControllers')
const blog_controller = require('../controllers/blogController')
const reset = require('../middlewares/reset_password_link')
const update = require('../middlewares/update_password')

const dp = multer({ dest: './ProfilePics/' })
const blog = multer({ dest: './BlogPics/' })


const router = require('express').Router()


router.post('/register', dp.single('filename'), user_controller.register)
//router.post('/register', user_controller.register)
router.post('/login', user_controller.login)
router.get('/logout',user_controller.logout)
router.post('/auth', user_controller.auth)
router.get('/all', user_controller.alluser)
router.get('/profile/:uuid', user_controller.single)
router.patch('/edit_profile', dp.single('filename'),  user_controller.update)
router.delete('/:uuid', user_controller.deleteit)

module.exports = router


router.post('/imageupload', blog.single('files'),blog_controller)
router.post('/resetpassword', reset)
//router.post('/updatepassword', update)
router.post('/updatepassword', update)