require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

const uri = process.env.MONGO_URL;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
mongoose.connect(uri);

client.connect(err => {
  const exercises = client.db("test").collection("excerciseTracker");
  const users = client.db("test").collection("users");

  if (err) return console.error(err)
  // perform actions on the collection object
  client.close();
});

const userSchema = new mongoose.Schema({
  username: String
});

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String
});

const logSchema = new mongoose.Schema({
  username: String,
  count: Number,
  _id: String,
  log: [{
    description: String,
    duration: Number,
    date: String,
  }]
})

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);
const Log = mongoose.model('Log', logSchema);

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/users', (req, res) => {
  User.find({})
    .select(["_id", "username"])
    .exec((err, user) => {
      if (err) return console.error(err);
      res.json(user);
    });
});

app.get('/api/users/:_id/logs', (req, res) => {

  const { _id } = req.params;

  Log.find({}, '_id description duration date', (err, logs) => {
    if (err) return console.error(err);
    const { username } = logs
    // console.log('USERNAME:', username);
    // console.log('RETURN:', {
    //   username,
    //   count: logs.length,
    //   _id,
    //   log: logs
    // });

    res.json({
      username,
      count: logs.length,
      _id,
      log: logs
    })
  })
})

app.post('/api/users', (req, res) => {
  const { username } = req.body;
  const user = new User({ username })
  user.save({ username })

  const { _id } = user
  res.json({
    username,
    _id
  })
});

// app.post('/api/users/:_id/exercises', (req, res) => {
//   const { _id } = req.params;
//   const { description, duration, date } = req.body;


//   User.findOne({ _id }, (err, user) => {
//     if (err) return console.error(err);
//     console.log('USER2:', user)
//     console.log('USER2ID:', user["_id"])

//     const exercise = new Exercise({
//       username: user.username,
//       description,
//       duration,
//       date: date ? date : new Date().toDateString(),
//     });

//     exercise.save(exercise);
//     console.log('EXERCISE:', user + exercise)
//     res.json(user + exercise)
//   })
// });
app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;

  const { duration, description } = req.body;
  let date = req.body.date ? new Date(req.body.date) : new Date();

  if (userId && duration && description) {
    User.findById(userId, (err, data) => {
      if (!data) {
        res.send("Invalid userID");
      } else {
        const username = data.username;
        const newExercise = new Exercise({
          userId,
          username,
          "date": date.toDateString(),
          duration,
          description
        });

        newExercise.save((err, data) => {
          if (err) console.error(err);
          console.log("EXERCISE ADDED: ", {
            "_id": userId, 
            username,
            "date": date.toDateString(),
            duration,
            description
          });

          res.json({
            "_id": userId,
            username,
            "date": date.toDateString(),
            "duration": parseInt(duration),
            description
          });
        });
      }
    });
  } else {
    res.send("Please fill in all required fields.");
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

