var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var port = process.env.PORT || 3000;

//Static resources get routed to public folder
app.use(express.static(path.join(__dirname, 'public')));

http.listen(port, function(){
  console.log('listening on *:' + port);
});