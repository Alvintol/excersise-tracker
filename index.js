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
  username: String,
});

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String
});


const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

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

app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;

  const { duration, description } = req.body;
  let date = req.body.date ?
    new Date(req.body.date) :
    new Date();

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

app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id, { limit } = req.query;
  let from = req.query.from ?
    new Date(req.query.from).getTime() :
    new Date("1111-11-11").getTime();
  let to = req.query.to ?
    new Date(req.query.to).getTime() :
    new Date().getTime();

  User.findById(userId, (err, user) => {
    if (err) console.error(err);

    if (!user) {
      res.send("Invalid ID");
    } else {
      const username = user.username;

      Exercise.find({ username })
        .select(["description", "date", "duration"])
        .limit(+limit)
        .sort({ date: -1 })
        .exec((err, data) => {
          if (err) console.error(err);
          let count = 0;
          let log = data
            .filter(element => {
              let newEle = new Date(element.date).getTime();
              if (newEle >= from && newEle <= to) count++;
              return newEle >= from && newEle <= to;
            })
            .map(element => {
              let newDate = new Date(element.date).toDateString();
              return {
                description: element.description,
                duration: element.duration,
                date: newDate
              };
            });
          if (!data) {
            res.json({
              username,
              "count": 0,
              "_id": userId,
              "log": []
            });
          } else {
            res.json({
              username,
              count,
              "_id": userId,
              log
            });
          }
        });
    }
  })
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

