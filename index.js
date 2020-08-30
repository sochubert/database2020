var express = require('express');

var app = express();

app.set('views', __dirname + '/views');
app.set('views engine', 'ejs');
app.engine('html', require('ejs').renderFile);

var bodyPaser = require('body-parser');
app.use(bodyPaser.urlencoded({ extended: false }));

app.use(express.static(__dirname + '/public'));

var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'my_db'
});
connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log('Success DB connection');
});

var server = require('http').createServer(app);
var io = require('socket.io')(server);

io.on('connection', function (socket) {
    socket.on('login', function(data) {
        console.log('client logged-in'+ data.username);
        socket.username = data.username;
        io.emit('login', data.username);
    });

    socket.on('chat', function (data) {
        console.log("Message form %s: %s", socket.username, data.msg);
        var msg = {
            username: socket.username,
            msg: data.msg
        };
        io.emit('chat', msg);
    });

    socket.on('disconnect', function() {
        socket.broadcast.emit('logout', socket.username);
        console.log('user disconnected: ' + socket.username);
    });
});


server.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

app.get('/', function (req, res) {
    res.render('index.html', { alert: false });
});
app.post('/', function(req, res) {
    var name = req.body.name;
    var pwd = req.body.pwd;

    var sql = 'SELECT * FROM user_info WHERE username = ?';
    connection.query(sql, [name], function(error, results, fields) {
        if (results.length == 0)
        {
            res.render('index.html', { alert: true});
        } else {
            var db_pwd = results[0].password;

            if (pwd == db_pwd)
            {
                res.render('welcome.html', {username: name});
            } else {
                res.render('index.html', { alert: true});
            }
        }
    });
});


app.get('/register', function (req, res) {
    res.render('register.html');
});
app.post('/register', function (req, res) {
    var name = req.body.name;
    var pwd = req.body.pwd;
    var pwdconf = req.body.pwdconf;

    var sql = 'INSERT INTO user_info VALUES (?, ?)';
    connection.query(sql, [name, pwd], function(error, results, fields) {
        console.log(results);
    });
    res.redirect('/');
});