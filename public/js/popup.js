function getQueryParams() {
    let keyval = location.toString().split("?")[1].split("7");
    let finalObj = {};
    for (let i = 0; i < keyval.length; i++) {
        finalObj[keyval[i].split("=")[0]] = keyval[i].split("=")[1];
    };
    return finalObj;
};

const urlParams = getQueryParams();

const msgMap = new Map();

class PopupMessage {
    static Create(msg) {
        const popupElm = document.createElement("div");
        popupElm.classList.add(`popup`);
        popupElm.classList.add(`popup-${msg.type}`);
        popupElm.innerHTML =  `<span>${msg.text}    </span><a class="popup-close" href="#" onclick="closePopup();"><i class="fas fa-times-circle"></i></a>`;
        document.body.appendChild(popupElm);
    };

    constructor(text, type) {
        this.text = text,
        this.type = type;
    };
}

function closePopup() {
    let elm = document.querySelectorAll(".popup")[0];
    elm.parentElement.removeChild(elm);
};

msgMap.set("logreq", new PopupMessage("You need to log in for that!", "ERR"));
msgMap.set("generr", new PopupMessage("An Error Occured! Try Again.", "ERR"));
msgMap.set("logsuc", new PopupMessage("Successfully logged in!", "SUC"));
msgMap.set("cnfudt", new PopupMessage("Successfully updated server config!", "SUC"));
msgMap.set("svrstpof", new PopupMessage("Server must be started to be stopped!", "ERR"));
msgMap.set("svrsrton", new PopupMessage("Server must be stopped to be started!", "ERR"));
msgMap.set("svrstpsc", new PopupMessage("Stopping server!", "SUC"));
msgMap.set("svrsrtsc", new PopupMessage("Starting server!", "SUC"));
msgMap.set("usrexist", new PopupMessage("User already exists!", "ERR"));
msgMap.set("newusrsc", new PopupMessage("Created New User!", "SUC"));
msgMap.set("usrno", new PopupMessage("Username & password do not exist/are incorrect!", "ERR"));
msgMap.set("logsucset", new PopupMessage("Logged in using default account! Get your own soon to stay safe!", "SUC"));
msgMap.set("usrpsdchn", new PopupMessage("Changed User Password!", "SUC"));
msgMap.set("usrdel", new PopupMessage("Successfully Deleted User!", "SUC"));

if (urlParams.status) {
    let msg = msgMap.get(urlParams.status);
    if (msg) {
        PopupMessage.Create(msg);
    };
};