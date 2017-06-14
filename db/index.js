const pg = require('pg')
const postgresUrl = 'postgres://localhost/twitterdb_fellow';
const client = new pg.Client(postgresUrl)

client.connect()

module.exports = client
