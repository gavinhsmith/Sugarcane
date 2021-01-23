const child_proc = require("child_process");
const bodyParser = require('body-parser')
const express = require("express");
const http = require("http");
const cookieParser = require('cookie-parser');
const exphbs = require('express-handlebars');
const crypto = require("crypto");
const fs = require("fs");
const WS = require("ws");
const sysuse = require("./sysuse.js");
const McQuery = require("minecraft-query");

const app = express();
const server = http.createServer(app);
const pkginfo = require("./package.json");

if (!fs.existsSync("./config")) {
    console.log(`No Configuation Files Found! Creating Some...`);
    fs.mkdirSync("./config");
    fs.writeFileSync("./config/app.json", JSON.stringify({
        "port": 80,
        "socket_delay": 5,
        "server_dir": "server"
    },null,4));
    fs.writeFileSync("./config/userlist.json", JSON.stringify([]));
    fs.writeFileSync("./config/server.json", JSON.stringify({
        "name": "Server Name",
        "type": "Vanilla",
        "jarname": "server.jar",
        "sudo": null,
        "java": "java",
        "port": 25565,
        "query": true,
        "mem": {
            "min": 128,
            "max": 1024
        }
    }));
} else {
    if (!fs.existsSync("./config/app.json")) {
        console.log(`Missing Configuation Files Found! Creating Them...`);
        fs.writeFileSync("./config/app.json", JSON.stringify({
            "port": 80,
            "socket_delay": 5,
            "server_dir": "server"
        },null,4));
    };
    if (!fs.existsSync("./config/userlist.json")) {
        console.log(`Missing Configuation Files Found! Creating Them...`);
        fs.writeFileSync("./config/userlist.json", JSON.stringify([]));
    };
    if (!fs.existsSync("./config/server.json")) {
        console.log(`Missing Configuation Files Found! Creating Them...`);
        fs.writeFileSync("./config/userlist.json", JSON.stringify({
            "name": "Server Name",
            "type": "Vanilla",
            "jarname": "server.jar",
            "sudo": null,
            "java": "java",
            "port": 25565,
            "query": true,
            "mem": {
                "min": 128,
                "max": 1024
            }
        }));
    };
};

const config = require("./config/app.json");
let serverInfo = require("./config/server.json");

function queryServer() {
    return new McQuery({host: 'localhost', port: serverInfo.port, timeout: 3000}).fullStat();
};

let server_active = false;
let mc_server = null;

function genAuthToken() {
    return new Promise(function (resolve, reject) {
        crypto.randomBytes(48, function(err, buffer) {
            if (err) {
                reject(err);
            } else {
                resolve(buffer.toString('hex'));
            };
        });
    });
};

class Session {
    constructor(token, user) {
        this.token = token;
        this.user = user;
    };
};

const userSessions = [];

function checkAuthToken(token) {
    for (var i = 0; i < userSessions.length; i++) {
        if (userSessions[i].token === token) {
            return true;
        }
    };
    return false;
};
function getUserSession(token) {
    for (var i = 0; i < userSessions.length; i++) {
        if (userSessions[i].token === token) {
            return userSessions[i];
        }
    };
    return null;
};

server.listen(config.port, function () {
    console.log(`HTTP Server Started on *:${config.port}`);
});

const wss = new WS.Server({
    server: server,
    clientTracking: true
});

function genPacket(name, data) {
    return JSON.stringify({
        name: name,
        data: data
    });
};
function parsePacket(packet) {
    return JSON.parse(packet);
};

wss.broadcast = function (packet) {
    wss.clients.forEach(ws => {
        ws.send(packet);
    });
};

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(packet) {
        const data = parsePacket(packet);
        if (data.name === "sendCommand") {
            if (server_active) {
                console.log(`Recived Command: ${data.data.cmd}`);
                mc_server.stdin.write(`${data.data.cmd}\n`);
            };
        };
    });
});

app.engine('.hbs', exphbs({
    extname: '.hbs',
    defaultLayout: 'dash',
    helpers: {
        copyrightYear: function() {
            return new Date().getFullYear();
        },
        appVersion: function() {
            return `v${pkginfo.version}`;
        }
    }
}));
app.set('view engine', '.hbs');

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function (req, res, next) {
    req.loggedIn = checkAuthToken(req.cookies["AuthToken"]);
    if (req.loggedIn) {
        req.session = getUserSession(req.cookies["AuthToken"]);
    };
    next();
});

app.use(express.static("public"));

app.get("/", function (req, res) {
    if (req.loggedIn) {
        res.redirect("/dashboard");
    } else {
        res.redirect("/login");
    };
});

app.get("/dashboard", function (req, res) {
    if (req.loggedIn) {
        res.render("home");
    } else {
        res.redirect("/login?status=logreq");
    };
});
app.get("/dashboard/console", function (req, res) {
    if (req.loggedIn) {
        res.render("console");
    } else {
        res.redirect("/login?status=logreq");
    };
});
app.get("/dashboard/config", function (req, res) {
    //currentConfig
    if (req.loggedIn) {
        fs.readFile(`${config.server_dir}/server.properties`, "utf8", function (err, data) {
            if (err) {
                res.redirect("/dashboard?status=generr");
            };
            res.render("serverconfig", {
                currentConfig: data.toString()
            });
        });
    } else {
        res.redirect("/login?status=logreq");
    };
});

app.get("/login", function (req, res) {
    res.render("login", {layout: "full"});
});

// API sort of thing
app.post("/login", function (req, res) {
    genAuthToken().then(token => {
        res.cookie("AuthToken", token);
        userSessions.push(new Session(token, {name:"Test"}));
        res.redirect("/dashboard?status=logsuc");
    }).catch(e => {
        res.redirect("/login?status=generr");
    });
});

app.post("/server/updateconfig", function (req, res) {
    if (req.loggedIn) {
        fs.writeFile(`${config.server_dir}/server.properties`, req.body.config, function (err) {
            if (err) {
                res.redirect("/dashboard/config?status=generr");
            } else {
                res.redirect("/dashboard?status=cnfudt");
            };
        });
    } else {
        res.redirect("/login?status=logreq");
    };
});

app.get("/server/status", function (req, res) {
    if (req.loggedIn) {
        fs.readFile("config/server.json", "utf8", function (err, serverconf) {
            if (err) {
                res.writeHead(500, {"Content-Type":"application/json"});
                res.write(JSON.stringify({
                    status: 500,
                    data: {
                        online: false,
                        name: new Error("Internal Server Error").toString(),
                        error: err.toString()
                    }
                }, null, 2));
                res.end();
            } else {
                queryServer().then(gamequery => {
                    const serverConfObj = JSON.parse(serverconf);
                    const finalObj = {
                        online: true,
                        name: serverConfObj.name,
                        motd: gamequery.motd,
                        version: gamequery.version,
                        players: {
                            online: gamequery.online_players,
                            max: gamequery.max_players,
                            list: gamequery.players
                        }
                    };
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.write(JSON.stringify({
                        status: 200,
                        data: finalObj
                    }, null, 2));
                    res.end();
                }).catch(e => {
                    const serverConfObj = JSON.parse(serverconf);
                    res.writeHead(200, {"Content-Type":"application/json"});
                    res.write(JSON.stringify({
                        status: 200,
                        data: {
                            online: false,
                            name: serverConfObj.name
                        }
                    }, null, 2));
                    res.end();
                });
            };
        });
    } else {
        res.writeHead(403, {"Content-Type":"application/json"});
        res.write(JSON.stringify({
            status: 403,
            data: {
                online: false,
                name: new Error("Forbidden").toString()
            }
        }, null, 2));
        res.end();
    };
});

app.get("/server/sysdata", function (req, res) {
    if (req.loggedIn) {
        sysuse.getAdverageCPUUsage().then(cpuUsage => {
            sysuse.getAdverageMemUsage().then(memUsage => {
                res.writeHead(200, {"Content-Type":"application/json"});
                res.write(JSON.stringify({
                    status: 200,
                    data: {
                        mem: {
                            used: memUsage[0].value.toString(),
                            total: memUsage[1].value.toString(),
                            suffix: memUsage[0].suffix.toString()
                        },
                        cpu: cpuUsage.toString()
                    }
                }, null, 2));
                res.end();
            }).catch(e => {
                res.writeHead(500, {"Content-Type":"application/json"});
                res.write(JSON.stringify({
                    status: 500,
                    data: {
                        name: new Error("Internal Server Error").toString(),
                        error: e.toString()
                    }
                }, null, 2));
                res.end();
            });
        }).catch(e => {
            res.writeHead(500, {"Content-Type":"application/json"});
            res.write(JSON.stringify({
                status: 500,
                data: {
                    name: new Error("Internal Server Error").toString(),
                    error: e.toString()
                }
            }, null, 2));
            res.end();
        });
    } else {
        res.writeHead(403, {"Content-Type":"application/json"});
        res.write(JSON.stringify({
            status: 403,
            data: {
                name: new Error("Forbidden").toString()
            }
        }, null, 2));
        res.end();
    };
});

app.get("/server/start", function (req, res) {
    if (req.loggedIn) {
        if (server_active) {
            res.redirect("/dashboard?status=svrsrton");
        } else {
            console.log("Starting Server");

            const noSudo = [
                `-Xms${serverInfo.mem.min}M`, 
                `-Xmx${serverInfo.mem.max}M`, 
                "-jar", 
                serverInfo.jarname, 
                "nogui"
            ];

            const withSudo =  [
                serverInfo.java,
                `-Xms${serverInfo.mem.min}M`, 
                `-Xmx${serverInfo.mem.max}M`, 
                "-jar", 
                serverInfo.jarname, 
                "nogui"
            ];

            mc_server = child_proc.spawn((serverInfo.sudo != null) ? serverInfo.sudo : serverInfo.java, (serverInfo.sudo != null) ? withSudo : noSudo, {
                cwd: __dirname + `/${config.server_dir}`
            });
            
            mc_server.on("close", function (code) {
                setTimeout(function () {
                    wss.broadcast(genPacket("consoleOut", {text: `Server stopped with code ${code}`}));
                }, config.socket_delay*1000);
                server_active = false;
                mc_server = null;
            });

            mc_server.stdout.on("data", function (chunk) {
                setTimeout(function () {
                    wss.broadcast(genPacket("consoleOut", {text: chunk.toString()}));
                }, config.socket_delay*1000);
                console.log(chunk.toString());
            });

            mc_server.stderr.on("data", function (chunk) {
                setTimeout(function () {
                    wss.broadcast(genPacket("consoleOut", {text: chunk.toString()}));
                }, config.socket_delay*1000);
                console.error(chunk.toString());
            });

            mc_server.stdin.setEncoding("utf-8");
            server_active = true;
            res.redirect("/dashboard/console?status=svrsrtsc");
        };
    } else {
        res.redirect("/login?status=logreq");
    };
});

app.get("/server/stop", function (req, res) {
    if (req.loggedIn) {
        if (server_active) {
            mc_server.stdin.write(`stop\n`);
            server_active = false;
            res.redirect("/dashboard?status=svrstpsc");
        } else {
            res.redirect("/?status=svrstpof");
        };
    } else {
        res.redirect("/login?status=logreq");
    };
});