const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
let User = require('../models/user.model')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {JWT_SECRET} = require('../config/keys')
const requireLogin = require('../middleware/requireLogin')


router.get('/protected',requireLogin,(req,res)=>{
    res.send("hello user")
})

router.post('/signup',(req,res)=>{
  const {name,username,email,password,userType, photo} = req.body 
  if(!name || !email || !password || !username || !userType || !photo){
     return res.status(422).json({error:"please add all the fields"})
  }
  User.findOne({username:username})
  .then((savedUser)=>{
      if(savedUser){
        return res.status(422).json({error:"user already exists with that username or email"})
      }
      bcrypt.hash(password,10)
      .then(hashedpassword=>{
            const user = new User({
                name,
                username,
                email,
                photo,
                password:hashedpassword,
                userType,
            })
    
            user.save()
            .then(user=>{
                // transporter.sendMail({
                //     to:user.email,
                //     from:"no-reply@insta.com",
                //     subject:"signup success",
                //     html:"<h1>welcome to instagram</h1>"
                // })
                res.json({message:"saved successfully"})
            })
            .catch(err=>{
                console.log(err)
            })
      })
     
  })
  .catch(err=>{
    console.log(err)
  })
})

router.put('/updatepic',requireLogin,(req,res)=>{
    User.findByIdAndUpdate(req.user._id,{
        $set:{photo:req.body.photo}
    },{
        new:true
    }).exec((err,result)=>{
        if(err){
            return res.status(422).json({error:err})
        }else{
            res.json(result)
        }
    })
  })

router.post('/signin',(req,res)=>{
    const {username,password} = req.body
    if(!username || !password){
       return res.status(422).json({error:"Please add username or password"})
    }
    User.findOne({username:username})
    .then(savedUser=>{
        if(!savedUser){
           return res.status(422).json({error:"Invalid username or password"})
        }
        bcrypt.compare(password,savedUser.password)
        .then(doMatch=>{
            if(doMatch){
                 //res.json({message:"successfully signed in"})
               const token = jwt.sign({_id:savedUser._id},JWT_SECRET)
               const {_id,name,username,email,userType,followers,following,photo} = savedUser
               res.json({token,user:{_id,name,username,email,userType,followers,following,photo}})
            }
            else{
                return res.status(422).json({error:"Invalid username or password"})
            }
        })
        .catch(err=>{
            console.log(err)
        })
    })
})

module.exports = router