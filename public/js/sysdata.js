const sysMemUsage = document.getElementById("sysMemUsage");
const sysCpuUsage = document.getElementById("sysCpuUsage");

$.get("/server/sysdata", function (data) {
    if (data.status === 200) {
        sysMemUsage.innerHTML = `${data.data.mem.used}/${data.data.mem.total} ${data.data.mem.suffix}`;
        sysCpuUsage.innerHTML = `${data.data.cpu}%`;
        console.log(`Got System Info!`);
    } else {
        sysMemUsage.innerHTML = `Couldn't Get Data!`;
        sysCpuUsage.innerHTML = `Couldn't Get Data!`;
        console.error(`Couldn't Get System Info!`);
    };
}).fail(function () {
    sysMemUsage.innerHTML = `Couldn't Get Data!`;
    sysCpuUsage.innerHTML = `Couldn't Get Data!`;
    console.error(`Couldn't Get System Info!`);
});