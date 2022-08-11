require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const bodyparser = require('body-parser')
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
})

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/users', (req, res) => {
  User.find({}, (err, users) => {
    if (err) return console.error(err);
    res.json(users);
  });
});

app.post('/api/users', (req, res) => {
  const { username } = req.body;

  const user = new User({ username })
  user.save({ username })

  res.json({
    username,
    _id: user['_id']
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
