require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});
const Url = mongoose.model('Url', urlSchema);


app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});



// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const dns = require('dns');
const urlParser = require('url');

let urlCounter = 1;

app.post('/api/shorturl', (req, res) => {
  const inputUrl = req.body.url;

  try {
    const hostname = urlParser.parse(inputUrl).hostname;

    dns.lookup(hostname, async (err, address) => {
      if (err) return res.json({ error: 'invalid url' });

      // Save to DB
      const existing = await Url.findOne({ original_url: inputUrl });
      if (existing) return res.json({ original_url: existing.original_url, short_url: existing.short_url });

      const url = new Url({
        original_url: inputUrl,
        short_url: urlCounter++
      });

      await url.save();
      res.json({ original_url: url.original_url, short_url: url.short_url });
    });
  } catch {
    res.json({ error: 'invalid url' });
  }
});
app.get('/api/shorturl/:short_url', async (req, res) => {
  const short = req.params.short_url;

  const data = await Url.findOne({ short_url: short });
  if (data) return res.redirect(data.original_url);
  else return res.json({ error: 'No short URL found for the given input' });
});



app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
