'use strict';
const express = require('express');
const router = express.Router();
const client = require('../db')

module.exports = io => {

  // router.get('/', (req, res, next) => {
  //   client.query('SELECT * FROM tweets', function (err, result) {
  //   if (err) return next(err); // pass errors to Express
  //   var tweets = result.rows;
  //   res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
  //   });
  // })

  const baseQuery = 'SELECT tweets.id AS tweet_id, * FROM tweets INNER JOIN users ON users.id = tweets.user_id\n';

  // a reusable function
  const respondWithAllTweets = (req, res, next) => {
    client.query(baseQuery, function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows;
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweets,
        showForm: true
      });
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', (req, res, next) => {
    let name = req.params.username
    console.log('name: ', name)
    client.query(`${baseQuery} WHERE users.name =$1`, [name], (err, result) => {
      if (err) return next(err)
      let tweets = result.rows
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweets,
        showForm: true,
        username: name
      })
    })
  });

  // single-tweet page
  router.get('/tweets/:id', (req, res, next) => {
    let tweetId = req.params.id
    client.query(`${baseQuery} WHERE tweets.id =$1`, [tweetId], (err, result) => {
      if (err) return next(err)
      let tweetsWithThatId = result.rows
        res.render('index', {
          title: 'Twitter.js',
          tweets: tweetsWithThatId // an array of only one element ;-)
      });
    })
  });

  // create a new tweet
  router.post('/tweets', (req, res, next) => {
    let newTweetName = req.body.name
    let newTweetContent = req.body.text
    console.log('new tweet name: ', newTweetName)
    console.log('new tweet content: ', newTweetContent)
    // check if a user exists
    client.query(`SELECT * FROM users WHERE users.name =$1`, [newTweetName], (err, result) => {
      if (err) return next(err)
      if (result.rows) {
        // if user name exists, insert new tweet at user's id
        console.log('result.rows: ', result.rows[0].id)
        client.query(`INSERT INTO tweets (user_id, content) VALUES($1, $2)`, [result.rows[0].id, newTweetContent], (err, result) => {
          if (err) return next(err)
          io.sockets.emit('new_tweet', result.rows);
          res.redirect('/');
        })
      } else {
        // if user is not found, insert new user and then new tweet at new user's ID
        client.query(`INSERT INTO users (name) VALUES($1)`, [newTweetName], (err, result) => {
          if (err) return next(err)
          if (result.rows) {
            let newUser = result.rows[0]
            client.query(`INSERT into tweets (user_id, content) VALUES($1, $2)`, [newUser.id, newTweetContent], (err, result) => {
              if (err) return next(err)
              io.sockets.emit('new_tweet', result.rows);
              res.redirect('/');
            })
          }
        })
      }
    })
  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', => (req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
