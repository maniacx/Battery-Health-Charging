'use strict';
const {Gio, GLib} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Config = imports.misc.config;

const OUTDATED_SERVICE_PATH = '/etc/systemd/system/mani-battery-health-charging.service';
const OUTDATED_SERVICE_SYMLINK_PATH = '/etc/systemd/system/multi-user.target.wants/mani-battery-health-charging.service';

const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
const BAT0_START_PATH = '/sys/class/power_supply/BAT0/charge_control_start_threshold';
const BAT1_END_PATH = '/sys/class/power_supply/BAT1/charge_control_end_threshold';
const BAT1_START_PATH = '/sys/class/power_supply/BAT1/charge_control_start_threshold';
const LG_PATH = '/sys/devices/platform/lg-laptop/battery_care_limit';
const LENOVA_PATH = '/sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/conservation_mode';
const SONY_PATH = '/sys/devices/platform/sony-laptop/battery_care_limiter';
const HUWAEI_PATH = '/sys/devices/platform/huawei-wmi/charge_thresholds';
const SAMSUNG_PATH = '/sys/devices/platform/samsung/battery_life_extender';
const ACER_PATH = '/sys/bus/wmi/drivers/acer-wmi-battery/health_mode';
const BATC_END_PATH = '/sys/class/power_supply/BATC/charge_control_end_threshold';
const BATT_END_PATH = '/sys/class/power_supply/BATT/charge_control_end_threshold';
const TP_BAT0_END = '/sys/devices/platform/smapi/BAT0/stop_charge_thresh';
const TP_BAT0_START = '/sys/devices/platform/smapi/BAT0/start_charge_thresh';
const TP_BAT1_END = '/sys/devices/platform/smapi/BAT1/stop_charge_thresh';
const TP_BAT1_START = '/sys/devices/platform/smapi/BAT1/start_charge_thresh';

const VENDOR_TOSIBHA = '/sys/module/toshiba_acpi';
const VENDOR_APPLE_I = '/sys/module/applesmc';

/* Device info
0 - No Device
1 - Device with Dual Battery - BAT0 and BAT1 end/start threshold (Thinkpad) > input 0 to 100 > output 0 to 100
2 - Device with BAT1 end/start threshold (unknown) > input 0 to 100 > output 0 to 100
3 - Device with BAT0 end/start  threshold (Thinkpad) > input 0 to 100 > output 0 to 100
4 - Device with BAT1 end only (Asus) > input 0 to 100 > output 0 to 100
5 - Device with BAT0 end only (Asus) > input 0 to 100 > output 0 to 100
6 - Device with BAT1 end only (Toshiba) > input 80 , 100 > output 80 , 100
7 - Device with BAT0 end only (Apple-Intel) > input 0 to 100 > output 0 to 100
8 - LG > input 80 , 100 > output 80 , 100
9 - Lenova > input 1 , 0 > output 60 , 100
10 - Sony > input 50, 80, 0 > output 50, 80, 100
11 - Huwaei >  input 0 to 100 > output 0 to 100
12 - Samsung > input 1 , 0 > output 80 , 100
13 - Acer > input 1 , 0 > output 80 , 100
14 - Device with BATC end only (Asus) > input 0 to 100 > output 0 to 100
15 - Device with BATT end only (Asus) > input 0 to 100 > output 0 to 100
16 - Thinkpad with end/start config single bat
17 - Thinkpad with end/start dual bat
*/

/*
 deviceArray = [0:haveStartThreshold, 1:haveDualBattery, 2:NoFixedThreshold(isVariable),
                3:bat0FullIcon, 4:bat0BalIcon, 5:bat0MaxIcon]
 */
const DUALBAT = ['1', '1', '1', 'ful100', 'bal080', 'max060']; // 1
const BAT1ESX = ['1', '0', '1', 'ful100', 'bal080', 'max060']; // 2
const BAT0ESX = ['1', '0', '1', 'ful100', 'bal080', 'max060']; // 3
const BAT1END = ['0', '0', '1', 'ful100', 'bal080', 'max060']; // 4
const BAT0END = ['0', '0', '1', 'ful100', 'bal080', 'max060']; // 5
const TOSHIBA = ['0', '0', '0', 'ful100', '-none-', 'max080']; // 6
const APP_INT = ['0', '0', '1', 'ful100', 'bal080', 'max060']; // 7
const LGXXXXX = ['0', '0', '0', 'ful100', '-none-', 'max080']; // 8
const LENOVAX = ['0', '0', '0', 'ful100', '-none-', 'max060']; // 9
const SONYXXX = ['0', '0', '0', 'ful100', 'bal080', 'max050']; // 10
const HUWAEIX = ['1', '0', '1', 'ful100', 'bal080', 'max060']; // 11
const SAMSUNG = ['0', '0', '0', 'ful100', '-none-', 'max080']; // 12
const ACERXXX = ['0', '0', '0', 'ful100', '-none-', 'max080']; // 13
const BATCEND = ['0', '0', '1', 'ful100', 'bal080', 'max060']; // 14
const BATTEND = ['0', '0', '1', 'ful100', 'bal080', 'max060']; // 15
const TP1BATT = ['1', '0', '1', 'ful100', 'bal080', 'max060']; // 16
const TP2BATT = ['1', '1', '1', 'ful100', 'bal080', 'max060']; // 17

var deviceInfo = [null, DUALBAT, BAT1ESX, BAT0ESX, BAT1END, BAT0END, TOSHIBA, APP_INT,
    LGXXXXX, LENOVAX, SONYXXX, HUWAEIX, SAMSUNG, ACERXXX, BATCEND, BATTEND, TP1BATT, TP2BATT];


var DEBUG = false; // Debug mode
function debugLog(msg) {
    if (DEBUG)
        log(`Battey-Health-Charging: ${msg}`);
}

function isSupported() {
    const currentVersion = Config.PACKAGE_VERSION.split('.');
    return currentVersion[0] >= 43;
}

function fileExists(path) {
    try {
        const f = Gio.File.new_for_path(path);
        return f.query_exists(null);
    } catch (e) {
        return false;
    }
}

function readFile(path) {
    try {
        const f = Gio.File.new_for_path(path);
        const [, contents] = f.load_contents(null);
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(contents);
    } catch (e) {
        return null;
    }
}

function readFileInt(path) {
    try {
        const v = readFile(path);
        if (v)
            return parseInt(v);
        else
            return null;
    } catch (e) {
        return null;
    }
}

function checkAuthRequired(path) {
    try {
        const f = Gio.File.new_for_path(path);
        const info = f.query_info('access::*', Gio.FileQueryInfoFlags.NONE, null);
        if (!info.get_attribute_boolean('access::can-write'))
            return true;
    } catch (e) {
        // Ignored
    }
    return false;
}


function spawnCommandLine(command) {
    try {
        debugLog(`spawnCommandLine = ${command}`);
        GLib.spawn_command_line_async(command);
    } catch (e) {
        logError(`Spawning command failed: ${command}`, e);
    }
}

function echoCommand(value, path) {
    const command = `bash -c "echo ${value} > ${path}\n"`;
    spawnCommandLine(command);
}

async function execCheck(argv, input = null, cancellable = null) {
    let cancelId = 0;
    let flags = Gio.SubprocessFlags.STDOUT_PIPE |
                 Gio.SubprocessFlags.STDERR_PIPE;

    debugLog(`execCheck command = ${argv}`);

    if (input !== null)
        flags |= Gio.SubprocessFlags.STDIN_PIPE;

    const proc = new Gio.Subprocess({
        argv,
        flags,
    });
    proc.init(cancellable);

    if (cancellable instanceof Gio.Cancellable)
        cancelId = cancellable.connect(() => proc.force_exit());


    return new Promise((resolve, reject) => {
        proc.communicate_utf8_async(input, null, (proc, res) => {
            try {
                const [, stdout, stderr] = proc.communicate_utf8_finish(res);
                const status = proc.get_exit_status();
                debugLog(`execCheck stdout = ${stdout.trim()}`);
                debugLog(`execCheck stderr = ${stderr.trim()}`);
                debugLog(`execCheck status = ${status}`);
                resolve(status);
            } catch (e) {
                reject(e);
            } finally {
                if (cancelId > 0)
                    cancellable.disconnect(cancelId);
            }
        });
    });
}

function installedCtlPath() {
    const pathUsername = [];
    pathUsername[1] = GLib.get_user_name();
    pathUsername[0] = GLib.find_program_in_path(`batteryhealthchargingctl-${pathUsername[1]}`);
    if (pathUsername[0] !== null) {
        debugLog(`installedCtlPath path by find_program: ${pathUsername[0]}`);
        return pathUsername;
    } else {
        debugLog(`installedCtlPath no files found standard: ${pathUsername[0]}`);
    }
    pathUsername[0] = `/usr/local/bin/batteryhealthchargingctl-${pathUsername[1]}`;
    debugLog(`Looking for: ${pathUsername[0]}`);
    if (fileExists(pathUsername[0])) {
        debugLog(`installedCtlPath returning path: ${pathUsername[0]}`);
        return pathUsername;
    } else {
        debugLog(`installedCtlPath file not exitst path: ${pathUsername[0]}`);
    }
    pathUsername[0] = '';
    return pathUsername;
}

function runCmdCtl(limit, pathName) {
    const ctlPath = ExtensionUtils.getSettings().get_string('ctl-path');
    if (ctlPath !== '')
        spawnCommandLine(`pkexec ${ctlPath} ${pathName} ${limit}`);
    else
        debugLog('No ctl found.');
}

function checkDeviceType() {
    let foundDevice = false;
    let type = 0;
    let bat0end = false;
    let bat0start = false;
    let bat1end = false;
    let bat1start = false;


    for (let i = 0; i < 2; i++) {
        const currentType = ExtensionUtils.getSettings().get_int('device-type');
        debugLog(`Pre Check device = ${currentType}`);
        switch (currentType) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
                if (fileExists(BAT1_START_PATH))
                    bat1start = true;
            case 6:
                if (fileExists(BAT1_END_PATH)) {
                    if (fileExists(VENDOR_TOSIBHA)) {
                        type = 6;
                        foundDevice = true;
                        break;
                    }
                    bat1end = true;
                }
                if (fileExists(BAT0_START_PATH))
                    bat0start = true;
            case 7:
                if (fileExists(BAT0_END_PATH)) {
                    if (fileExists(VENDOR_APPLE_I)) {
                        type = 7;
                        foundDevice = true;
                        break;
                    }
                    bat0end = true;
                }
                debugLog(`bat ${bat0end} ${bat0start} ${bat1end} ${bat1start}`);
                if (bat0end && bat0start && bat1end && bat1start) {
                    type = 1;
                    foundDevice = true;
                    break;
                }
                if (!bat0end && !bat0start && bat1end && bat1start) {
                    type = 2;
                    foundDevice = true;
                    break;
                }
                if (bat0end && bat0start && !bat1end && !bat1start) {
                    type = 3;
                    foundDevice = true;
                    break;
                }
                if (!bat0end && !bat0start && bat1end && !bat1start) {
                    type = 4;
                    foundDevice = true;
                    break;
                }
                if (bat0end && !bat0start && !bat1end && !bat1start) {
                    type = 5;
                    foundDevice = true;
                    break;
                }
            case 8:
                if (fileExists(LG_PATH)) {
                    type = 8;
                    foundDevice = true;
                    break;
                }
            case 9:
                if (fileExists(LENOVA_PATH)) {
                    type = 9;
                    foundDevice = true;
                    break;
                }
            case 10:
                if (fileExists(SONY_PATH)) {
                    type = 10;
                    foundDevice = true;
                    break;
                }
            case 11:
                if (fileExists(HUWAEI_PATH)) {
                    type = 11;
                    foundDevice = true;
                    break;
                }
            case 12:
                if (fileExists(SAMSUNG_PATH)) {
                    type = 12;
                    foundDevice = true;
                    break;
                }
            case 13:
                if (fileExists(ACER_PATH)) {
                    type = 13;
                    foundDevice = true;
                    break;
                }
            case 14:
                if (fileExists(BATC_END_PATH)) {
                    type = 14;
                    foundDevice = true;
                    break;
                }
            case 15:
                if (fileExists(BATT_END_PATH)) {
                    type = 15;
                    foundDevice = true;
                    break;
                }
            case 16:
            case 17:
                if (fileExists(TP_BAT1_START))
                    bat1start = true;
                if (fileExists(TP_BAT1_END))
                    bat1end = true;
                if (fileExists(TP_BAT0_START))
                    bat0start = true;
                if (fileExists(TP_BAT0_END))
                    bat0end = true;

                debugLog(`bat ${bat0end} ${bat0start} ${bat1end} ${bat1start}`);
                if (bat0end && bat0start && bat1end && bat1start) {
                    type = 17;
                    foundDevice = true;
                    break;
                }
                if (bat0end && bat0start && !bat1end && !bat1start) {
                    type = 16;
                    foundDevice = true;
                    break;
                }
        }
        if (foundDevice) {
            i = 3;
            debugLog(`Found device = ${type}`);
            ExtensionUtils.getSettings().set_int('device-type', type);
        } else {
            ExtensionUtils.getSettings().set_int('device-type', 0);
            debugLog('No found device');
        }
    }
    return foundDevice;
}


function isDeviceAuthRequired() {
    const type = ExtensionUtils.getSettings().get_int('device-type');
    switch (type) {
        case 1:
            if (checkAuthRequired(BAT1_START_PATH))
                return true;
            if (checkAuthRequired(BAT1_END_PATH))
                return true;
        case 3:
            if (checkAuthRequired(BAT0_START_PATH))
                return true;
        case 5:
        case 7:
            if (checkAuthRequired(BAT0_END_PATH))
                return true;
            break;
        case 2:
            if (checkAuthRequired(BAT1_START_PATH))
                return true;
        case 4:
        case 6:
            if (checkAuthRequired(BAT1_END_PATH))
                return true;
            break;
        case 8:
            if (checkAuthRequired(LG_PATH))
                return true;
            break;
        case 9:
            if (checkAuthRequired(LENOVA_PATH))
                return true;
            break;
        case 10:
            if (checkAuthRequired(SONY_PATH))
                return true;
            break;
        case 11:
            if (checkAuthRequired(HUWAEI_PATH))
                return true;
            break;
        case 12:
            if (checkAuthRequired(SAMSUNG_PATH))
                return true;
            break;
        case 13:
            if (checkAuthRequired(ACER_PATH))
                return true;
            break;
        case 14:
            if (checkAuthRequired(BATC_END_PATH))
                return true;
            break;
        case 15:
            if (checkAuthRequired(BATT_END_PATH))
                return true;
            break;
        case 17:
            if (checkAuthRequired(TP_BAT1_START))
                return true;
            if (checkAuthRequired(TP_BAT1_END))
                return true;
        case 16:
            if (checkAuthRequired(TP_BAT0_START))
                return true;
            if (checkAuthRequired(TP_BAT0_END))
                return true;
            break;
    }
    return false;
}

function getCurrentEndLimitValue() {
    let limitValue;
    const type = ExtensionUtils.getSettings().get_int('device-type');
    switch (type) {
        case 1:
        case 3:
        case 5:
        case 7:
            return readFileInt(BAT0_END_PATH);
        case 2:
        case 4:
        case 6:
            return readFileInt(BAT1_END_PATH);
        case 8:
            return readFileInt(LG_PATH);
        case 9:
            limitValue = readFileInt(LENOVA_PATH);
            if (limitValue == 1)
                return 60;
            else
                return 100;
        case 10:
            limitValue = readFileInt(SONY_PATH);
            if (limitValue == 0)
                return 100;
            else
                return limitValue;
        case 11:
            limitValue = readFile(HUWAEI_PATH).split(' ');
            return limitValue[1];
        case 12:
            limitValue = readFileInt(SAMSUNG_PATH);
            if (limitValue == 1)
                return 80;
            else
                return 100;
        case 13:
            limitValue = readFileInt(ACER_PATH);
            if (limitValue == 1)
                return 80;
            else
                return 100;
        case 14:
            return readFileInt(BATC_END_PATH);
        case 15:
            return readFileInt(BATT_END_PATH);
        case 16:
        case 17:
            return readFileInt(TP_BAT0_END);
    }
    return 0; // should expect to reach here but incase just return 0
}

function getCurrentStartLimitValue() {
    let limitValue;
    const type = ExtensionUtils.getSettings().get_int('device-type');
    switch (type) {
        case 1:
        case 3:
            return readFileInt(BAT0_START_PATH);
        case 2:
            return readFileInt(BAT1_START_PATH);
        case 11:
            limitValue = readFile(HUWAEI_PATH).split(' ');
            return limitValue[0];
        case 16:
        case 17:
            return readFileInt(TP_BAT0_START);
    }
    return 0; // should expect to reach here but incase just return 0
}

function getCurrentEndLimit2Value() {
    const type = ExtensionUtils.getSettings().get_int('device-type');
    switch (type) {
        case 1:
            return readFileInt(BAT1_END_PATH);
        case 17:
            return readFileInt(TP_BAT1_END);
    }
    return 0; // should expect to reach here but incase just return 0
}

function getCurrentStartLimit2Value() {
    const type = ExtensionUtils.getSettings().get_int('device-type');
    switch (type) {
        case 1:
            return readFileInt(BAT1_START_PATH);
        case 17:
            return readFileInt(TP_BAT1_START);
    }
    return 0; // should expect to reach here but incase just return 0
}

function setThresholdLimit(chargingMode) {
    let startValue = 0;
    let endValue = 0;
    const Settings = ExtensionUtils.getSettings();
    const type = Settings.get_int('device-type');
    const rootMode = Settings.get_boolean('root-mode');

    if (chargingMode === 'ful') {
        switch (type) {
            case 1:
            case 3:
                startValue = Settings.get_int('current-full-capacity-start-threshold');
                if (rootMode)
                    runCmdCtl(`${startValue}`, 'BAT0_START_PATH');
                else
                    echoCommand(`${startValue}`, BAT0_START_PATH);

            case 5:
            case 7:
                endValue = Settings.get_int('current-full-capacity-end-threshold');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'BAT0_END_PATH');
                else
                    echoCommand(`${endValue}`, BAT0_END_PATH);

                break;
            case 2:
                startValue = Settings.get_int('current-full-capacity-start-threshold');
                if (rootMode)
                    runCmdCtl(`${startValue}`, 'BAT1_START_PATH');
                else
                    echoCommand(`${startValue}`, BAT1_START_PATH);

            case 4:
                endValue = Settings.get_int('current-full-capacity-end-threshold');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'BAT1_END_PATH');
                else
                    echoCommand(`${endValue}`, BAT1_END_PATH);

                break;
            case 6:
                if (rootMode)
                    runCmdCtl('100', 'BAT1_END_PATH');
                else
                    echoCommand('100', BAT1_END_PATH);

                break;
            case 8:
                if (rootMode)
                    runCmdCtl('100', 'LG_PATH');
                else
                    echoCommand('100', LG_PATH);

                break;
            case 9:
                if (rootMode)
                    runCmdCtl('0', 'LENOVA_PATH');
                else
                    echoCommand('0', LENOVA_PATH);

                break;
            case 10:
                if (rootMode)
                    runCmdCtl('0', 'SONY_PATH');
                else
                    echoCommand('0', SONY_PATH);

                break;
            case 11:
                startValue = Settings.get_int('current-full-capacity-start-threshold');
                endValue = Settings.get_int('current-full-capacity-end-threshold');
                if (rootMode)
                    runCmdCtl(`${startValue} ${endValue}`, 'HUWAEI_PATH');
                else
                    echoCommand(`${startValue} ${endValue}`, HUWAEI_PATH);
                break;
            case 12:
                if (rootMode)
                    runCmdCtl('0', 'SAMSUNG_PATH');
                else
                    echoCommand('0', SAMSUNG_PATH);

                break;
            case 13:
                if (rootMode)
                    runCmdCtl('0', 'ACER_PATH');
                else
                    echoCommand('0', ACER_PATH);

                break;
            case 14:
                endValue = Settings.get_int('current-full-capacity-end-threshold');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'BATC_END_PATH');
                else
                    echoCommand(`${endValue}`, BATC_END_PATH);

                break;
            case 15:
                endValue = Settings.get_int('current-full-capacity-end-threshold');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'BATT_END_PATH');
                else
                    echoCommand(`${endValue}`, BATT_END_PATH);

                break;
            case 16:
            case 17:
                startValue = Settings.get_int('current-full-capacity-start-threshold');
                if (rootMode)
                    runCmdCtl(`${startValue}`, 'TP_BAT0_START');
                else
                    echoCommand(`${startValue}`, TP_BAT0_START);
                endValue = Settings.get_int('current-full-capacity-end-threshold');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'TP_BAT0_END');
                else
                    echoCommand(`${endValue}`, TP_BAT0_END);

                break;
        }
    }

    if (chargingMode === 'bal') {
        switch (type) {
            case 1:
            case 3:
                startValue = Settings.get_int('current-balanced-start-threshold');
                if (rootMode)
                    runCmdCtl(`${startValue}`, 'BAT0_START_PATH');
                else
                    echoCommand(`${startValue}`, BAT0_START_PATH);

            case 5:
            case 7:
                endValue = Settings.get_int('current-balanced-end-threshold');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'BAT0_END_PATH');
                else
                    echoCommand(`${endValue}`, BAT0_END_PATH);

                break;
            case 2:
                startValue = Settings.get_int('current-balanced-start-threshold');
                if (rootMode)
                    runCmdCtl(`${startValue}`, 'BAT1_START_PATH');
                else
                    echoCommand(`${startValue}`, BAT1_START_PATH);

            case 4:
                endValue = Settings.get_int('current-balanced-end-threshold');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'BAT0_END_PATH');
                else
                    echoCommand(`${endValue}`, BAT1_END_PATH);

                break;
            case 10:
                if (rootMode)
                    runCmdCtl('80', 'SONY_PATH');
                else
                    echoCommand('80', SONY_PATH);

                break;
            case 11:
                startValue = Settings.get_int('current-balanced-start-threshold');
                endValue = Settings.get_int('current-balanced-end-threshold');
                if (rootMode)
                    runCmdCtl(`${startValue} ${endValue}`, 'HUWAEI_PATH');
                else
                    echoCommand(`${startValue} ${endValue}`, HUWAEI_PATH);

                break;
            case 14:
                endValue = Settings.get_int('current-balanced-end-threshold');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'BATC_END_PATH');
                else
                    echoCommand(`${endValue}`, BATC_END_PATH);

                break;
            case 15:
                endValue = Settings.get_int('current-balanced-end-threshold');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'BATT_END_PATH');
                else
                    echoCommand(`${endValue}`, BATT_END_PATH);

                break;
            case 16:
            case 17:
                startValue = Settings.get_int('current-balanced-start-threshold');
                if (rootMode)
                    runCmdCtl(`${startValue}`, 'TP_BAT0_START');
                else
                    echoCommand(`${startValue}`, TP_BAT0_START);

                endValue = Settings.get_int('current-balanced-end-threshold');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'TP_BAT0_END');
                else
                    echoCommand(`${endValue}`, TP_BAT0_END);

                break;
        }
    }

    if (chargingMode === 'max') {
        switch (type) {
            case 1:
            case 3:
                startValue = Settings.get_int('current-maxlife-start-threshold');
                if (rootMode)
                    runCmdCtl(`${startValue}`, 'BAT0_START_PATH');
                else
                    echoCommand(`${startValue}`, BAT0_START_PATH);

            case 5:
            case 7:
                endValue = Settings.get_int('current-maxlife-end-threshold');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'BAT0_END_PATH');
                else
                    echoCommand(`${endValue}`, BAT0_END_PATH);

                break;
            case 2:
                startValue = Settings.get_int('current-maxlife-start-threshold');
                if (rootMode)
                    runCmdCtl(`${startValue}`, 'BAT1_START_PATH');
                else
                    echoCommand(`${startValue}`, BAT1_START_PATH);

            case 4:
                endValue = Settings.get_int('current-maxlife-end-threshold');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'BAT1_END_PATH');
                else
                    echoCommand(`${endValue}`, BAT1_END_PATH);

                break;
            case 6:
                if (rootMode)
                    runCmdCtl('80', 'BAT1_END_PATH');
                else
                    echoCommand('80', BAT1_END_PATH);

                break;
            case 8:
                if (rootMode)
                    runCmdCtl('80', 'LG_PATH');
                else
                    echoCommand('80', LG_PATH);

                break;
            case 9:
                if (rootMode)
                    runCmdCtl('1', 'LENOVA_PATH');
                else
                    echoCommand('1', LENOVA_PATH);

                break;
            case 10:
                if (rootMode)
                    runCmdCtl('50', 'SONY_PATH');
                else
                    echoCommand('50', SONY_PATH);

                break;
            case 11:
                startValue = Settings.get_int('current-maxlife-start-threshold');
                endValue = Settings.get_int('current-maxlife-end-threshold');
                if (rootMode)
                    runCmdCtl(`${startValue} ${endValue}`, 'HUWAEI_PATH');
                else
                    echoCommand(`${startValue} ${endValue}`, HUWAEI_PATH);

                break;
            case 12:
                if (rootMode)
                    runCmdCtl('1', 'SAMSUNG_PATH');
                else
                    echoCommand('1', SAMSUNG_PATH);

                break;
            case 13:
                if (rootMode)
                    runCmdCtl('1', 'ACER_PATH');
                else
                    echoCommand('1', ACER_PATH);

                break;
            case 14:
                endValue = Settings.get_int('current-maxlife-end-threshold');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'BATC_END_PATH');
                else
                    echoCommand(`${endValue}`, BATC_END_PATH);

                break;
            case 15:
                endValue = Settings.get_int('current-maxlife-end-threshold');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'BATT_END_PATH');
                else
                    echoCommand(`${endValue}`, BATT_END_PATH);

                break;
            case 16:
            case 17:
                startValue = Settings.get_int('current-maxlife-start-threshold');
                if (rootMode)
                    runCmdCtl(`${startValue}`, 'TP_BAT0_START');
                else
                    echoCommand(`${startValue}`, TP_BAT0_START);
                endValue = Settings.get_int('current-maxlife-end-threshold');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'TP_BAT0_END');
                else
                    echoCommand(`${endValue}`, TP_BAT0_END);
                break;
        }
    }
}

function setThresholdLimit2(chargingMode) {
    let startValue = 0;
    let endValue = 0;
    const Settings = ExtensionUtils.getSettings();
    const type = Settings.get_int('device-type');
    const rootMode = Settings.get_boolean('root-mode');

    if (chargingMode === 'ful') {
        switch (type) {
            case 1:
                startValue = Settings.get_int('current-full-capacity-start-threshold2');
                if (rootMode)
                    runCmdCtl(`${startValue}`, 'BAT1_START_PATH');
                else
                    echoCommand(`${startValue}`, BAT1_START_PATH);

                endValue = Settings.get_int('current-full-capacity-end-threshold2');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'BAT1_END_PATH');
                else
                    echoCommand(`${endValue}`, BAT1_END_PATH);
                break;
            case 17:
                startValue = Settings.get_int('current-full-capacity-start-threshold2');
                if (rootMode)
                    runCmdCtl(`${startValue}`, 'TP_BAT1_START');
                else
                    echoCommand(`${startValue}`, TP_BAT1_START);

                endValue = Settings.get_int('current-full-capacity-end-threshold2');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'TP_BAT1_END');
                else
                    echoCommand(`${endValue}`, TP_BAT1_END);
                break;
        }
    }

    if (chargingMode === 'bal') {
        switch (type) {
            case 1:
                startValue = Settings.get_int('current-balanced-start-threshold2');
                if (rootMode)
                    runCmdCtl(`${startValue}`, 'BAT1_START_PATH');
                else
                    echoCommand(`${startValue}`, BAT1_START_PATH);

                endValue = Settings.get_int('current-balanced-end-threshold2');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'BAT1_END_PATH');
                else
                    echoCommand(`${endValue}`, BAT1_END_PATH);
                break;
            case 17:
                startValue = Settings.get_int('current-balanced-start-threshold2');
                if (rootMode)
                    runCmdCtl(`${startValue}`, 'TP_BAT1_START');
                else
                    echoCommand(`${startValue}`, TP_BAT1_START);

                endValue = Settings.get_int('current-balanced-end-threshold2');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'TP_BAT1_END');
                else
                    echoCommand(`${endValue}`, TP_BAT1_END);
                break;
        }
    }

    if (chargingMode === 'max') {
        switch (type) {
            case 1:
                startValue = Settings.get_int('current-maxlife-start-threshold2');
                if (rootMode)
                    runCmdCtl(`${startValue}`, 'BAT1_START_PATH');
                else
                    echoCommand(`${startValue}`, BAT1_START_PATH);

                endValue = Settings.get_int('current-maxlife-end-threshold2');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'BAT1_END_PATH');
                else
                    echoCommand(`${endValue}`, BAT1_END_PATH);
                break;
            case 17:
                startValue = Settings.get_int('current-maxlife-start-threshold2');
                if (rootMode)
                    runCmdCtl(`${startValue}`, 'TP_BAT1_START');
                else
                    echoCommand(`${startValue}`, TP_BAT1_START);

                endValue = Settings.get_int('current-maxlife-end-threshold2');
                if (rootMode)
                    runCmdCtl(`${endValue}`, 'TP_BAT1_END');
                else
                    echoCommand(`${endValue}`, TP_BAT1_END);
                break;
        }
    }
}

async function runInstallerScript(action) {
    const user = GLib.get_user_name();
    debugLog(`? installer.sh --tool-user ${user} ${action}`);
    const argv = [
        Me.dir.get_child('tool').get_child('installer.sh').get_path(),
        '--tool-user',
        user,
        action,
    ];

    argv.unshift('pkexec');

    try {
        return await execCheck(argv, null, null);
    } catch (err) {
        logError(err, 'InstallError');
    }
}



async function runInstaller() {
    const status = await runInstallerScript('install');
    if (status == 0)
        ExtensionUtils.getSettings().set_int('install-service', 0);
}

async function runUpdater() {
    const status = await runInstallerScript('update');
    if (status == 0)
        ExtensionUtils.getSettings().set_int('install-service', 0);
}

async function runUninstaller() {
    const status = await runInstallerScript('uninstall');
    if (status == 0)
        ExtensionUtils.getSettings().set_int('install-service', 1);
}

async function checkInstallation() {
    const pathUsername = installedCtlPath();
    if (pathUsername[0] === '') {
        ExtensionUtils.getSettings().set_int('install-service', 1);
        return 2; //    // Polkit not installed
    }
    ExtensionUtils.getSettings().set_string('ctl-path', pathUsername[0]);
    const resourceDir = Me.dir.get_child('resources').get_path();
    const argv = ['pkexec', pathUsername[0], 'CHECKINSTALLATION', resourceDir, pathUsername[1]];

    const status = await execCheck(argv, null, null);
    if (status == 0) {   // Polkit Installed
        ExtensionUtils.getSettings().set_int('install-service', 0);
        return 0;
    } else {  // Polkit Needs Update
        ExtensionUtils.getSettings().set_int('install-service', 2);
        return 1;
    }
}

/**
 * "VERSION 3" of this extension, installed a systemd service mani-battery-health-charging.service to control.
 * to change permission of charge_control_end_threshold/charge_control_start_threshold on boot.
 * Since we moved to polkit. This services will not be required and will prompt user to remove it.
 *
 * Remove symlink instead of "systemctl disable service" as the command fails if for some reason
 * mani-battery-health-charging.service goes missing. This ensures cleaner removal of services since
 * we know exactly where the symlink resides.
 *  Following command are executed.
 *    # rm -f /etc/systemd/system/multi-user.target.wants/mani-battery-health-charging.service
 *    # rm -f /etc/systemd/system/mani-battery-health-charging.service
 *    # chmod 644 /etc/systemd/system/mani-battery-health-charging.service
 *    # systemctl daemon-reload
 *    # systemctl reset-failed
 */
async function cleanOutdatedFiles() {
    const addCmd = ' && ';
    const rmSymlimkCmd = 'rm -f /etc/systemd/system/multi-user.target.wants/mani-battery-health-charging.service';
    const rmCmd = 'rm -f /etc/systemd/system/mani-battery-health-charging.service';
    const sysctlReloadCmd = 'systemctl daemon-reload';
    const sysctlResetCmd = 'systemctl reset-failed';
    const command = `${rmSymlimkCmd}${addCmd}${rmCmd}${addCmd}${sysctlReloadCmd}${addCmd}${sysctlResetCmd}`;

    const argv = ['pkexec', '/bin/sh', '-c', command];

    return await execCheck(argv, null, null);
}

function checkForOutdatedFiles() {
    if (fileExists(OUTDATED_SERVICE_PATH) ||  fileExists(OUTDATED_SERVICE_SYMLINK_PATH))
        return true;
    return false;
}

async function checkInCompatibility() {
    if (!isSupported())
        return 1;   // Gnome not complatible

    if (checkDeviceType() === false)
        return 2;   // Unsupported Device

    if (checkForOutdatedFiles()) // Notify Removal of depreciated service files from older version
        return 3;

    if (isDeviceAuthRequired()) {
        ExtensionUtils.getSettings().set_boolean('root-mode', true);
        const installStatus = await checkInstallation();
        debugLog(`installStatus : ${installStatus}`);
        if (installStatus === 1)
            return 4;   // Polkit Needs Update
        else if (installStatus === 2)
            return 5;   // Polkit not installed
    }
    // restore mode
    const currentType = ExtensionUtils.getSettings().get_int('device-type');
    setThresholdLimit(ExtensionUtils.getSettings().get_string('charging-mode'));
    if (deviceInfo[currentType][1] === '1')
        setThresholdLimit2(ExtensionUtils.getSettings().get_string('charging-mode2'));

    return 0;
}
