const os = require("os");
;
const formatBytes = function (bytes, decimals = 2) {
    if (bytes === 0)
        return {
            value: 0,
            suffix: 'Bytes'
        };
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return {
        value: parseFloat((bytes / Math.pow(k, i)).toFixed(dm)),
        suffix: sizes[i]
    };
};
const getAdverageCPUUsage = async function () {
    return new Promise(function (resolve, reject) {
        function cpuAverage() {
            var totalIdle = 0, totalTick = 0;
            var cpus = os.cpus();
            for (var i = 0, len = cpus.length; i < len; i++) {
                var cpu = cpus[i];
                for (let type in cpu.times) {
                    totalTick += cpu.times[type];
                }
                totalIdle += cpu.times.idle;
            }
            return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
        }
        ;
        var startMeasure = cpuAverage();
        setTimeout(function () {
            var endMeasure = cpuAverage();
            var idleDifference = endMeasure.idle - startMeasure.idle;
            var totalDifference = endMeasure.total - startMeasure.total;
            var percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
            resolve(percentageCPU);
        }, 100);
    });
};
const getAdverageMemUsage = async function () {
    return new Promise(function (resolve, reject) {
        resolve([formatBytes(os.totalmem() - os.freemem()), formatBytes(os.totalmem())]);
    });
};
exports.getAdverageCPUUsage = getAdverageCPUUsage;
exports.getAdverageMemUsage = getAdverageMemUsage;
exports.formatBytes = formatBytes;
