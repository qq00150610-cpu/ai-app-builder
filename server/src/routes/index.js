const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/', function(req, res) {
  var htmlPath = path.join(__dirname, '../../public/index.html');
  fs.readFile(htmlPath, 'utf8', function(err, html) {
    if (err) {
      res.status(500).setHeader('Content-Type', 'text/plain; charset=utf-8').send('Error loading page');
    } else {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    }
  });
});

module.exports = router;
