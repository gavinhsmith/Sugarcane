const userTabel = document.getElementById("userTabel");
const newUsrBtn = document.getElementById("newUsrBtn");

newUsrBtn.addEventListener("click", function (e) {
    window.location.href = '/dashboard/users/new';
});

function promptForPasswordChange(username) {
    return function (e) {
        let newPassword = prompt(`New password for ${username}:`, "admin");
        $.post(`/app/user/${username}/changePass`, {password: newPassword}, function (err) {
            window.location.href = "/dashboard/users?status=usrpsdchn";
        });
    };
};

function promptForAccountDelete(username) {
    return function (e) {
        let yesno = confirm(`Are you sure you want to delete ${username}'s account?`);
        if (yesno) {
            window.location.href = `/app/user/${username}/delete`;
        };
    };
};

function generateHTML(username) {
    const row = document.createElement("tr");
    const name = document.createElement("td");
    const actions = document.createElement("td");

    row.appendChild(name);
    row.appendChild(actions);

    name.innerHTML = username;

    const buttons = [
        document.createElement("a"),
        document.createElement("a")
    ];

    buttons.forEach(btn => {
        actions.appendChild(btn);
    });

    buttons[0].innerHTML = `Change Password`;
    buttons[1].innerHTML = `Delete`;

    buttons[0].href = "#";
    buttons[0].addEventListener("click", promptForPasswordChange(username));
    buttons[0].classList.add("text-area-submit");

    buttons[1].href = `#`;
    buttons[1].addEventListener("click", promptForAccountDelete(username));
    buttons[1].classList.add("text-area-submit");
    buttons[1].style.margin = "1%";

    return row;
};

$.get("/app/userList", function (data) {
    if (data.status === 200) {
        for (let i = 0; i < data.data.length; i++) {
            if (data.data[i] == null) continue;
            userTabel.appendChild(generateHTML(data.data[i].username));
        };
        console.log(`Got User List!`);
    } else {
        console.error(`Couldn't Get User List!`);
    };
}).fail(function () {
    console.error(`Couldn't Get User List!`);
});