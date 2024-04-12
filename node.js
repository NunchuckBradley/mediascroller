var sqlite3 = require('sqlite3');
const express = require("express");
var bodyParser = require('body-parser');
var compression = require('compression')
var mime = require('mime');
var fs = require('fs');

var app = express();

app.use("/", express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(compression())


const HTTP_PORT = 8000
app.listen(HTTP_PORT, () => {
    console.log("Server is listening on port " + HTTP_PORT);
});

const database_file = './database.db';

var config = {
    reload: false,
    length: 30,
    dir: '/home/martin/files/mediascroller'
};

// watch for new file changes
fs.watch(config.dir, (eventType, filename) => {
    let filepath = config.dir + '/' + filename;

    if (eventType === 'rename') {
        if (fs.existsSync(filepath)) {
            let stats = fs.statSync(filepath);
            // file created
            let insert = 'INSERT INTO files (name, type, mdate, cdate) VALUES (?,?,?,?)';
            db.run(insert, [filename, mime.lookup(filepath), stats.mtime, stats.ctime]);
            console.log('Added file: '+filename+'...');
        } else {
            // file removed
            let insert = 'DELETE FROM files WHERE name = ?';
            db.run(insert, [filename]);
            console.log('Removing file: '+filename+'...');
        }
    }
})

// create database and reload files
const db = new sqlite3.Database(database_file, (err) => {
    if (err) {
        console.error("Error opening database..." + err.message);
    } else {
        // use ROWID for file id
        db.serialize(() => {
            db.run(`create table clients (
                time text not null,
                agent text not null,
                referrer text not null,
                ip text not null,
                width text,
                height text
            );`, (err) => {
                if (err) {
                    console.log('Error making clients table, probably already made...');
                }
            });
        
            db.run(`
                create table files (
                    name text not null,
                    type text not null,
                    mdate text not null,
                    cdate text not null
                );
            `, (err) => {
                if (err) {
                    if (config.reload == true) {
                        db.run('DELETE FROM files');
                    }
                    console.log("Table already exists...");
                }
                let insert = 'INSERT INTO files (name, type, mdate, cdate) VALUES (?,?,?,?)';
                // db.run(insert, ['file.png', 'image', Math.floor(+new Date() / 1000)]);

                var files = fs.readdirSync(config.dir);
                files.sort(function(a, b) {
                   return fs.statSync(config.dir + '/' + a).mtime.getTime() - 
                          fs.statSync(config.dir + '/' + b).mtime.getTime();
                });

                if (config.reload == true || !err) {
                    console.log("Reloading files database...");
                    let dbbind = db.prepare(insert);
                    files.forEach((file) => {
                        let base = config.dir + '/' + file;
                        let stats = fs.statSync(base);

                        // Insert name type and date into the files table
                        // db.run(insert, [file, mime.lookup(file), stats.mtime])
                        dbbind.run([file, mime.lookup(file), stats.mtime, stats.ctime]);

                        // ignore directories for now
                        if (fs.statSync(base).isDirectory()) {
                         return;
                        }
                    });
                }

                console.log("Running queries...");
            });
        });
    }
});

app.get("/api/content", (req, res, next) => {
    // res.status(200).json(config.files);
    db.all("SELECT rowid, * FROM files order by rowid desc", (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.status(200).json(rows);
      });
});

app.get("/api/content/:id", (req, res, next) => {
    db.all(`SELECT rowid, * FROM files where rowid < ?  order by rowid desc LIMIT ?`, [req.params.id, config.length], (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.status(200).json(rows);
      });
});

app.get("/", (req, res) => {
    res.sendFile(__dirname+'/index.html');
});


// basic logger
app.post('/logger', function(req, res) {
    var user = {
        agent: req.header('user-agent'), // User Agent we get from headers
        referrer: req.header('referrer'), //  Likewise for referrer
        ip: req.header('x-forwarded-for') || req.connection.remoteAddress, // Get IP - allow for proxy
        screen: { // Get screen info that we passed in url post data
          width: req.body.width,
          height: req.body.height
        }
    };
    // Store the user in your database
    let insert = 'INSERT INTO clients (time, agent, referrer, ip, width, height) VALUES (?,?,?,?,?,?)';
    db.run(insert, [new Date().getTime(), user.agent, user.referrer, user.ip, user.screen.width, user.screen.height]);
    res.end();
});

app.get('/logger', function(req, res) {
    db.all("SELECT * FROM clients", (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        var table = "<table>";
        table += "<tr><th>time</th><th>agent</th><th>referrer</th><th>ip</th><th>width</th><th>height</th></tr>";
        rows.forEach((item, index) => {
            var time = new Date();
            time.setTime(item.time);
            table += "<tr><td>"+time.toUTCString()+"</td><td>"+item.agent+"</td><td>"+item.referrer+"</td><td>"+item.ip+"</td><td>"+item.width+"</td><td>"+item.height+"</td></tr>";
        });
        table += "</table>";
        // res.status(200).json(rows);
        // console.log(table);
        res.setHeader('Content-type','text/html');
        res.send(table);
        res.end();
    });
});
