const consoleIn = document.getElementById("consoleIn");

const sendKey = 13; // 13 = Enter

let websocket = new WebSocket(`ws://${location.hostname}:80`);

class GameConsole {
    constructor() {
        this.elm = document.getElementById("consoleOut");
    };

    clear() {
        this.elm.innerHTML = "";
        this.elm.scrollTop = this.elm.scrollHeight;
    };

    write(data) {
        this.elm.innerHTML += `<p>${data.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g,"<br>")}</p>`;
        this.elm.scrollTop = this.elm.scrollHeight;
    };
};

function genPacket(name, data) {
    return JSON.stringify({
        name: name,
        data: data
    });
};
function parsePacket(packet) {
    return JSON.parse(packet);
};

const consoleOut = new GameConsole();

consoleOut.clear();
consoleOut.write("Connecting to the Server...");

consoleIn.addEventListener("keydown", function (e) {
    if (e.keyCode === sendKey) {
        const cmd = consoleIn.value;
        consoleIn.value = "";
        if (cmd === ".clear") {
            consoleOut.clear();
            consoleOut.write("Cleared Console");
        } else if (cmd === ".disconnect") {
            consoleOut.write("Was disconnected from the server! Maybe this was intentional, or mabye not. If it wasn't, try reloading the page.");
            websocket.close(0);
        } else {
            websocket.send(genPacket("sendCommand", {cmd: cmd}));
        };
    };
});

websocket.onopen = function () {
    consoleOut.write("Connected!");
};

websocket.onerror = function (err) {
    consoleOut.write(`There was an error in the websocket! Info: ${err}`);
};

websocket.onmessage = function (packet) {
    const data = parsePacket(packet.data);

    if (data.name === "consoleOut") {
        consoleOut.write(data.data.text);
    };
};