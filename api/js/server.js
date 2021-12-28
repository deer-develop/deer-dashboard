const express = require('express');
const cors = require('cors');
//resource
const activation = require('./resource/activation');
const cash = require('./resource/cash');
const nps = require('./resource/nps');
const retention = require('./resource/retention');
const revenue = require('./resource/revenue');
const use = require('./resource/use');
const user = require('./resource/user');

const app = express()
const port = 3001

app.use(cors())
app.use('/activation', activation)
app.use('/cash', cash)
app.use('/nps', nps)
app.use('/retention', retention)
app.use('/revenue', revenue)
app.use('/use', use)
app.use('/user', user)

app.listen(port, () => {
    console.log(`Hi web server! http://localhost:${port}`)
});

