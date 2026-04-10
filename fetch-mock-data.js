const data = require('./mock-data.js') // or wherever your mock data lives
const fs = require('fs')
fs.writeFileSync('./data.json', JSON.stringify(data))