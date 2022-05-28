const express = require('express');
const app = express();

require("dotenv").config();
const fs = require('fs');
const path = require('path'); 
const cookieParser = require("cookie-parser");
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
const UUID = require('uuid-int');
const salt = bcrypt.genSaltSync(10);
app.use(cookieParser());

const db = require('../config/database');   //For DataBase Connection



// * R E G I S T E R   N E W   U S E R

const register = async (req, res) => {
    var errors = [];
    try {
        const { fname, lname, email, password, phone_number, gender, date_of_birth, blood_group, emergency_contact, relation_emergency_contact, insta_link, facebook_link, twitter_link, linkdin_link, occupation, about_you, accident_insurance_number, } = req.body;

        if (!fname) {
            errors.push("Firstname is missing");
        }
        if (!lname) {
            errors.push("Lastname is missing");
        }
        if (phone_number === emergency_contact) {
            errors.push("Try different phone number");
        }
        if (!email) {
            errors.push("Email is missing");
        }
        if (!password) {
            errors.push("Password is missing");
        }
        if (errors.length) {
            return res.status(400).json({ "error": errors.join(", ") });
        }       

        console.log("Password => " + password);

        //var size = -1;
        //const generator = UUID(id);
        //const size = generator.uuid()%1000000;

        const sql = "SELECT * FROM users WHERE email = ?";
        
        if(!req.file) {
            await db.all(sql, email, async (err, result) => {
                if (err) {
                    return res.status(402).json({ "error": err.message });
                }
	   	 //size = size + 1;
                if (result.length == 0) {
                    var data = {
                        //uuid: 'cyclo' + size,
                        fname: fname,
                        lname: lname,
                        email: email,
                        password: bcrypt.hashSync(password, salt),
                        phone_number: phone_number,
                        gender: gender,
                        date_of_birth: date_of_birth,
                        blood_group: blood_group,
                        emergency_contact: emergency_contact,
                        relation_emergency_contact: relation_emergency_contact,
                        insta_link: insta_link,
                        facebook_link: facebook_link,
                        twitter_link: twitter_link,
                        linkdin_link: linkdin_link,
                        occupation: occupation,
                        about_you: about_you,
                        accident_insurance_number: accident_insurance_number,
                        DateCreated: Date('now')
                    }

                    var sql = 'INSERT INTO users (fname, lname, email, password, phone_number, gender, date_of_birth, blood_group, emergency_contact, relation_emergency_contact, insta_link, facebook_link, twitter_link, linkdin_link, occupation, about_you, accident_insurance_number, DateCreated) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
                    var params = [data.fname, data.lname, data.email, data.password, data.phone_number, data.gender, data.date_of_birth, data.blood_group, data.emergency_contact, data.relation_emergency_contact, data.insta_link, data.facebook_link, data.twitter_link, data.linkdin_link, data.occupation, data.about_you, data.accident_insurance_number, Date('now')]
                    await db.run(sql, params, (err, innerResult) => {
                        if (err) {                        
                            return res.status(400).json({ "error": err.message });
                        }
                        console.log("User Created")
                        return res.status(201).send("Success1");
                    });
                }
    
                else {
                    res.status(400).send("User Already Exist. Please Login");  
                    return;
                }
            });

        } else {
            await db.all(sql, email, async (err, result) => {
                if (err) {
                    res.status(402).json({ "error": err.message });
                    return;
                }
                    //console.log(req.file)
		  //size = size + 1;
                if (result.length == 0) {
                    var data = {
                        //uuid: 'cyclo'+ size,
                        filename: req.file.filename,
                        fname: fname,
                        lname: lname,
                        email: email,
                        password: bcrypt.hashSync(password, salt),
                        phone_number: phone_number,
                        gender: gender,
                        date_of_birth: date_of_birth,
                        blood_group: blood_group,
                        emergency_contact: emergency_contact,
                        relation_emergency_contact: relation_emergency_contact,
                        insta_link: insta_link,
                        facebook_link: facebook_link,
                        twitter_link: twitter_link,
                        linkdin_link: linkdin_link,
                        occupation: occupation,
                        about_you: about_you,
                        accident_insurance_number: accident_insurance_number,
                        DateCreated: Date('now')
                    }
    
                    
                    var dir = `./ProfilePics/${data.email}/`;
    
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    var oldPath = `./ProfilePics/${req.file.filename}`
                    var newPath = `./ProfilePics/${data.email}/${req.file.filename}.jpg`;
                
                    fs.rename(oldPath, newPath, function (err) {
                        if (err) throw err
                        console.log('Image uploaded Successfully')
                    })
                    
    
                    var sql = 'INSERT INTO users (filename, fname, lname, email, password, phone_number, gender, date_of_birth, blood_group, emergency_contact, relation_emergency_contact, insta_link, facebook_link, twitter_link, linkdin_link, occupation, about_you, accident_insurance_number, DateCreated) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
                    var params = [data.filename, data.fname, data.lname, data.email, data.password, data.phone_number, data.gender, data.date_of_birth, data.blood_group, data.emergency_contact, data.relation_emergency_contact, data.insta_link, data.facebook_link, data.twitter_link, data.linkdin_link, data.occupation, data.about_you, data.accident_insurance_number, Date('now')]
                    await db.run(sql, params, (err, innerResult) => {
                        if (err) {                        
                            res.status(400).json({ "error": err.message })
                            return;
                        }
                        res.status(201).send("Success1");
                        console.log("User Created")
                    });
                }
    
                else {
                    let oldPath = `./ProfilePics/${req.file.filename}`;
                    if( fs.existsSync(oldPath) )
                        fs.unlinkSync(oldPath);
                    
                    return res.status(400).send("User Already Exist. Please Login");  
                }
            });
        }

        } catch (err) {
            console.log(err);
            return res.status(500).json({ "error": "Error occured" });;
        }
}


// * L O G I N

const login = async (req, res) => {

    try {
        const { email, password } = req.body;
        // console.log( email, password );
        // Make sure there is an Email and Password in the request
        if (!(email && password)) {
            res.status(400).send("All input is required");
        }

        const user = [];

        const sql = "SELECT uuid,filename,fname,lname,athlete_id,email,password,phone_number,gender,date_of_birth,blood_group,emergency_contact,relation_emergency_contact,insta_link,facebook_link,twitter_link,linkdin_link,occupation,about_you,accident_insurance_number FROM users WHERE email = ?";
        db.all(sql, email, async function (err, rows) {
            if (err) {
                res.status(400).json({ "error": err.message })
                return;
            }

            if(rows.length == 0){
                // console.log("No Email Match Found!");
                return res.status(400).send("No Match");
            }
            rows.forEach(function (row) {;
                user.push(row);
            })

            //console.log(password);
            // console.log(user[0].password);
            var PHash = await bcrypt.compare(password, user[0].password);
            

            if (PHash) {
                // * CREATE JWT TOKEN
                var token = jwt.sign(
                    { user_uuid: user[0].uuid, username: user[0].fname, email },
                    process.env.TOKEN_KEY,
                    {
                        expiresIn: "1h", // 60s = 60 seconds - (60m = 60 minutes, 2h = 2 hours, 2d = 2 days)
                    }
                );

                db.all(`UPDATE users SET DateLoggedIn = COALESCE(?,DateLoggedIn) WHERE email = ?;`, [Date('now'), email], (err) => {
                    if (err) {
                        return res.send(err.message).status(400);
                    }
                    //return res.status(200).sendFile(path.join(__dirname, `./ProfilePics/${user[0].uuid}/${user[0].filename}.jpg`))
                    // return res.status(200).sendFile(path.join(__dirname, `./ProfilePics/${user[0].uuid}/${user[0].filename}.jpg`)).json({"jwt": token, "user": user[0]});
                    //return res.status(200).json({"jwt": token, "user": user[0], "Photo": path.join(__dirname, `../ProfilePics/${user[0].uuid}/${user[0].filename}.jpg`)});
                    return res.status(200).json({"jwt": token, "user": user[0], "Photo":`ProfilePics/${user[0].email}/${user[0].filename}.jpg`});
                })

            } else {
                //console.log("No Password Match Found!");
                return res.status(400).send("No Match!");
            }

            //return res.status(200).send(user);   
            //return res.cookie('jwt', token, { httpOnly: true }).send(user).status(200)
            console.log("User Logged In");
        });

    } catch (err) {
        console.log(err);
    }
};



// * L O G O U T

  const logout = (req, res) => {
    res.clearCookie("jwt", { path: '/' })
    res.status(200).send("User Logged Out")
};


// * T E S T  

const auth = async (req, res) => {
    res.status(200).send("Token Works - Yay!");
};


// * A L L U S E R

const alluser = (req, res, next) => {
    var sql = "select * from users"
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success2",
            "data": rows
        })
    });
};


// * S I N G L E U S E R     P R O F I L E

const single = (req, res, next) => {
    var sql = `SELECT uuid,filename,fname,lname,athlete_id,email,phone_number,gender,date_of_birth,blood_group,emergency_contact,relation_emergency_contact,insta_link,facebook_link,twitter_link,linkdin_link,occupation,about_you,accident_insurance_number FROM users WHERE uuid = ?`;
    var params = [req.params.uuid]
    db.all(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        else if(row.length == 0) {
            res.status(400).send(`NO Users found for uuid =  ${params}`);
            return;
        }
        res.json({
            "message": "success3",
            "data": row[0],
	    "Photo":`ProfilePics/${row[0].email}/${row[0].filename}.jpg`
        })
    });
};


// * U P D A T E   U S E R

const update = async (req, res, next) => {

    const { uuid, fname, lname, email, phone_number, gender, date_of_birth, blood_group, emergency_contact, relation_emergency_contact, insta_link, facebook_link, twitter_link, linkdin_link, occupation, about_you, accident_insurance_number, } = req.body;

        if(req.file !== undefined) {

            let fily = req.file.filename;
            let dir = `./ProfilePics/${email}/`;
            let path = dir;

            if( fs.existsSync(dir) ) {
                fs.readdirSync(dir).forEach( function(file) {
                  var curPath = path + "/" + file;
                    if(fs.lstatSync(curPath).isDirectory()) { // recurse
                        deleteFolderRecursive(curPath);
                    } else { // delete file
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(path);
        
                fs.mkdirSync(dir, { recursive: true })
              }
        
        
                var oldPath = `./ProfilePics/${req.file.filename}`
                var newPath = `./ProfilePics/${req.body.email}/${req.file.filename}.jpg`;
        
                fs.rename(oldPath, newPath, function (err) {
                    if (err) throw err
                    console.log('Image uploaded Successfully')
                })

                db.run(
                    `UPDATE users SET
                        filename = COALESCE(?,filename),
                        fname = COALESCE(?,fname),
                        lname = COALESCE(?,lname),
			email = COALESCE(?,email),
                        phone_number = COALESCE(?,phone_number),
                        gender = COALESCE(?,gender),
                        date_of_birth = COALESCE(?,date_of_birth),
                        blood_group = COALESCE(?,blood_group),
                        emergency_contact = COALESCE(?,emergency_contact),
                        relation_emergency_contact = COALESCE(?,relation_emergency_contact),
                        insta_link = COALESCE(?,insta_link),
                        facebook_link = COALESCE(?,facebook_link),
                        twitter_link = COALESCE(?,twitter_link),
                        linkdin_link = COALESCE(?,linkdin_link),
                        occupation = COALESCE(?,occupation),
                        about_you = COALESCE(?,about_you),
                        accident_insurance_number = COALESCE(?,accident_insurance_number)
                        WHERE uuid = ?`,
            
                    [fily, fname, lname, email, phone_number, gender, date_of_birth, blood_group, emergency_contact, relation_emergency_contact, insta_link, facebook_link, twitter_link, linkdin_link, occupation, about_you, accident_insurance_number, uuid],
            
                    function (err, result) {
                        if (err) {
                            res.status(400).json({ "error": err.message })
                            return;
                        }
            
                        return res.status(202).json({ message: "success4", changes: this.changes })
                    });


        } else {

            db.run(
                `UPDATE users SET
                    
                    fname = COALESCE(?,fname),
                    lname = COALESCE(?,lname),
		    email = COALESCE(?,email),
                    phone_number = COALESCE(?,phone_number),
                    gender = COALESCE(?,gender),
                    date_of_birth = COALESCE(?,date_of_birth),
                    blood_group = COALESCE(?,blood_group),
                    emergency_contact = COALESCE(?,emergency_contact),
                    relation_emergency_contact = COALESCE(?,relation_emergency_contact),
                    insta_link = COALESCE(?,insta_link),
                    facebook_link = COALESCE(?,facebook_link),
                    twitter_link = COALESCE(?,twitter_link),
                    linkdin_link = COALESCE(?,linkdin_link),
                    occupation = COALESCE(?,occupation),
                    about_you = COALESCE(?,about_you),
                    accident_insurance_number = COALESCE(?,accident_insurance_number)
                    WHERE uuid = ?`,
        
                [fname, lname, email, phone_number, gender, date_of_birth, blood_group, emergency_contact, relation_emergency_contact, insta_link, facebook_link, twitter_link, linkdin_link, occupation, about_you, accident_insurance_number, uuid],
        
                function (err, result) {
                    if (err) {
                        res.status(400).json({ "error": err.message })
                        return;
                    }
        
                    return res.status(202).json({ message: "success4", changes: this.changes })
                });

        }
}


// * D E L E T E   U S E R

const deleteit = (req, res, next) => {
    db.run(
        'DELETE FROM users WHERE uuid = ?',
        req.params.id,
        function (err, result) {
            if (err) {
                res.status(400).json({ "error": res.message })
                return;
            }
            res.json({ "message": "deleted", changes: this.changes })
        });
}




module.exports = {
    register,
    login,
    logout,
    auth,
    alluser,
    single,
    update,
    deleteit
}
