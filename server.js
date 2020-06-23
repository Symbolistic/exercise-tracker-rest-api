const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://Symbol:test@cluster0-3t5ag.mongodb.net/exercisetracker?retryWrites=true&w=majority' , {useNewUrlParser: true, useUnifiedTopology: true});

let userSchema = new mongoose.Schema({
  username:String,
  log: [{
    description: {type: String, required:true},
    duration: {type: Number, required:true},
    date: Date
}]
});

let User = mongoose.model("User", userSchema);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Add new user
app.post('/api/exercise/new-user', function(req, res) {
  
  //let newUser = User({_id: req.body._id, user:req.body.username}).save(function(err, data) {

  let exists = User.exists({username: req.body.username}, function(err, result){
    console.log(result)
    if(err) {
        console.log(err);
    } else if(result === true){ // If exists, print msg
        res.json("Username already taken");
    } else { // If doesn't exist, add and put info
      let newUser = User({_id: req.body._id, username: req.body.username}).save(function(err, data) {   
        res.json({username:data.username, _id: data._id})
      });
    }
  });
});


// Update user by adding exercise and time
app.post('/api/exercise/add', function(req,res) {
  const id = req.body.userId;
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  let date = req.body.date === "" || req.body.date === undefined ? new Date() : new Date(req.body.date);
  date = date.toDateString();
  console.log(req.body.date, "im here");
  // let day = date.getDay();
  // let month = date.getMonth() + 1;
  // let year = date.getFullYear();
  //let newDate = year + "-" + month + "-" + day;
  //let newDate = date.toDateString();
  //console.log(newDate.substring(0,15), "SUP HOMIEEEEEE");
  
  User.findByIdAndUpdate(id, 
                         {$push:{log: [{
                           //id: id,
                           description: description,
                           duration: duration,
                           date: date
                         }]}},
                        {new:true, findAndModify:false},
                        function (err, data){
    if (err) console.log("you screwed up");
    console.log(data, 'YURURURURURURURUURRUGREEEEE')
    let info = data.log[data.log.length-1]
    console.log(data.date)
    res.json({username: data.username,
              description: info.description,
              duration: parseInt(info.duration),
              _id: id, 
              date: new Date(info.date).toDateString(),
              
             });
  })
})
      

app.get('/api/exercise/users', function(req, res){
  User.find({}, function(err, users) {
    if(err) console.log("Bro you broke something, stop breaking stuff...")
    console.log(users)
    res.json(users)
  })
})

app.get('/api/exercise/log', function(req, res){
  const userId = req.query.userId;
  const from = req.query.from ? new Date(req.query.from) : undefined;
  const to = req.query.from ? new Date(req.query.to) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit) : 500;

  console.log(`${from} and ${to}`, "IM HURRRRR")

  // Find user by ID
  User.findById(userId, function (err, data) {
    
    if (err) {
      console.log("You screwed up");
    }// If user didn't fill out from/to, display all user info
    else if(from === undefined || to === undefined){
      
      console.log(data.log.length -1, "YURRRRR")
      
      let exercises = data.log.slice(0, limit);

      res.json({userId: data.userId, 
                username: data.username, 
                count: data.log.length,
                log: exercises
               });
    } else { // If they did, filter by date
      //console.log(data)
      let exercises = data.log.filter(val => {
        console.log(val.date, "SHOW ME $$$")
        if ( (val.date) >= from && (val.date) <= to ) {
          
          return true;
        } else {
          return false;
        }
      })
      console.log(exercises, "BRO IM IN")
      
      
      exercises = exercises.slice(0, limit);
      
      exercises = exercises.map(val =>{
        val.date = val.date.toDateString();
        console.log(val.date)
        return {description: val.description,
                duration: val.duration,
                date: val.date.toDateString()
               }
      });
      
      console.log(exercises)
      
      res.json({userId:data.id, 
                username:data.username, 
                from: from.toDateString(),
                to: to.toDateString(),
                count: exercises.length, 
                log:exercises});
    }
  })
})


// Not found middleware
app.use((req, res, next) => {
  res.json({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
