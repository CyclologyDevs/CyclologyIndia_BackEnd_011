const db = require('../config/database');
const multer  = require('multer')
const fs = require('fs');

const imageupload = function async(req, res) {

    var dir = `./blog/images/${req.body.uuid}`;

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    var oldPath = `./blog/images/${req.body.uuid}`
    var newPath = `./blog/images/${req.body.uuid}/${req.file.filename}.jpg`;

    fs.rename(oldPath, newPath, function (err) {
        if (err) throw err
        console.log('Blog Submitted successfully')
    })

    var data = {
        uuid: req.body.uuid,
        fname : req.body.fname,
        lname : req.body.lname,
        description : req.body.descriptioncription,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        DateCreated: Date('now')
    }


    var sql = 'INSERT INTO blogs (uuid, fname, lname, description, filename, mimetype, size, DateCreated) VALUES (?,?,?,?,?,?,?,?)'
    var params = [data.uuid, data.fname, data.lname, data.description, data.filename, data.mimetype, data.Size, Date('now')]

    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }
    });

    res.status(200).json(req.file)
};

module.exports = imageupload