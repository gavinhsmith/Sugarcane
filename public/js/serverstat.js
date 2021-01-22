$.get("/server/status", function (data) {
    console.log(data);
}).fail(function () {
    console.error(new Error("Could not get serverstat"));
});

const serverName = document.getElementById("serverName");
const serverData = document.getElementById("serverData");
const serverBtnAction = document.getElementById("serverBtnAction");
const serverBtn = document.getElementById("serverBtn");

$.get("/server/status", function (data) {
    console.log(data);
    if (data.status === 200) {
        if (data.data.online === true) {
            serverName.innerHTML = data.data.name;
            serverData.innerHTML = `ONLINE - ${data.data.version} - ${data.data.players.online}/${data.data.players.max}`;
            serverBtnAction.setAttribute("action", `/server/stop`);
            serverBtn.setAttribute("value", "Stop Server");
            console.log(`Got Server Info! Server Online!`);
        } else {
            serverName.innerHTML = data.data.name;
            serverData.innerHTML = `OFFLINE`;
            serverBtnAction.setAttribute("action", `/server/start`);
            serverBtn.setAttribute("value", "Start Server");
            console.log(`Got Server Info! Server Offline!`);
        };
    } else {
        serverName.innerHTML = `Couldn't Get Data!`;
        serverData.innerHTML = `Couldn't Get Data!`;
        serverBtn.disabled = true;
        serverBtn.setAttribute("value", `Couldn't Check the Server!`);
        console.error(`Couldn't Get Server Info!`);
    };
}).fail(function () {
    serverName.innerHTML = `Couldn't Get Data!`;
    serverData.innerHTML = `Couldn't Get Data!`;
    serverBtn.disabled = true;
    serverBtn.setAttribute("value", `Couldn't Check the Server!`);
    console.error(`Couldn't Get Server Info!`);
});