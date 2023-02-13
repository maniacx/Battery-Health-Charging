'use strict';
const {Gio, GLib} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Config = imports.misc.config;

const END_THRESHOLD_DEVICE_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
const START_THRESHOLD_DEVICE_PATH = '/sys/class/power_supply/BAT0/charge_control_start_threshold';
const DEPRECIATED_SERVICE_PATH = '/etc/systemd/system/mani-battery-health-charging.service';
const DEPRECIATED_SERVICE_SYMLINK_PATH = '/etc/systemd/system/multi-user.target.wants/mani-battery-health-charging.service';

/* These paths define below are for testing purpose only on my laptop.
 * They will be changed to actual path later once the extension is ready.
 * For example:
 * BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
 * LENOVA_PATH = '/sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/conservation_mode'
 */
const BAT0_END_PATH = '/usr/test/b0e';
const BAT0_START_PATH = '/usr/test/b0s';
const BAT1_END_PATH = '/usr/test/b1e';
const BAT1_START_PATH = '/usr/test/b1s';
const LG_PATH = '/usr/test/lg';
const LENOVA_PATH = '/usr/test/le';
const SONY_PATH = '/usr/test/so';
const HUWAEI_PATH = '/usr/test/hu';
const SAMSUNG_PATH = '/usr/test/sa';
const ACER_PATH = '/usr/test/ac';
const BATC_END_PATH = '/usr/test/bce';
const BATT_END_PATH = '/usr/test/bte';

const VENDOR_TOSIBHA = '/usr/test/vto';
const VENDOR_APPLE_I = '/usr/test/vap';
/* Device info
0 - No Device
1 - Device with Dual Battery - BAT0 and BAT1 end/start threshold (Thinkpad) > input 0 to 100 > output 0 to 100
2 - Device with BAT1 end/start threshold (unknown) > input 0 to 100 > output 0 to 100
3 - Device with BAT0 end/start  threshold (Thinkpad) > input 0 to 100 > output 0 to 100
4 - Device with BAT1 end only (Asus) > input 0 to 100 > output 0 to 100
5 - Device with BAT0 end only (Asus) > input 0 to 100 > output 0 to 100
6 - Device with BAT0 end only (Toshiba) > input 80 , 100 > output 80 , 100
7 - Device with BAT0 end only (Apple-Intel) > input 0 to 100 > output 0 to 100
8 - LG > input 80 , 100 > output 80 , 100
9 - Lenova > input 1 , 0 > output 60 , 100
10 - Sony > input 50, 80, 0 > output 50, 80, 100
11 - Huwaei >  input 0 to 100 > output 0 to 100
12 - Samsung > input 1 , 0 > output 80 , 100
13 - Acer > input 1 , 0 > output 80 , 100
14 - Device with BATC end only (Asus) > input 0 to 100 > output 0 to 100
15 - Device with BATT end only (Asus) > input 0 to 100 > output 0 to 100
*/

var DEBUG = true; // Debug mode
const debug = function (msg) {
    if (DEBUG)
        log(`Battey-Health-Charging: ${msg}`);
};



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

function spawnCommandLine(command) {
    try {
        GLib.spawn_command_line_async(command);
    } catch (e) {
        logError(`Spawning command failed: ${command}`, e);
    }
}

function checkAuthRequired() {
    try {
        const f = Gio.File.new_for_path(END_THRESHOLD_DEVICE_PATH);
        const info = f.query_info('access::*', Gio.FileQueryInfoFlags.NONE, null);
        if (!info.get_attribute_boolean('access::can-write'))
            return true;
    } catch (e) {
        // Ignored
    }
    return false;
}

async function execCheck(argv, input = null, cancellable = null) {
    let cancelId = 0;
    let flags = Gio.SubprocessFlags.STDOUT_PIPE |
                 Gio.SubprocessFlags.STDERR_PIPE;

    if (input !== null)
        flags |= Gio.SubprocessFlags.STDIN_PIPE;

    let proc = new Gio.Subprocess({
        argv,
        flags,
    });
    proc.init(cancellable);

    if (cancellable instanceof Gio.Cancellable)
        cancelId = cancellable.connect(() => proc.force_exit());


    return new Promise((resolve, reject) => {
        proc.communicate_utf8_async(input, null, (proc, res) => {
            try {
                let [, stdout, stderr] = proc.communicate_utf8_finish(res);
                let status = proc.get_exit_status();
                debug(stdout.trim());
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

function checkDeviceType() {
    let foundDevice = false;
    let type = 0;
    let bat0end = false;
    let bat0start = false;
    let bat1end = false;
    let bat1start = false;

    for (let i = 0; i < 2; i++) {
        let currentType = ExtensionUtils.getSettings().get_int('device-type');
        debug(currentType);
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
            debug(`bat ${bat0end} ${bat0start} ${bat1end} ${bat1start}`);
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
        }
        if (foundDevice) {
            i = 3;
            debug(`Found device = ${type}`);
            ExtensionUtils.getSettings().set_int('device-type', type);
        } else {
            ExtensionUtils.getSettings().set_int('device-type', 0);
            debug('No found device');
        }
    }
}


function getCurrentEndLimitValue() {
    return readFileInt(END_THRESHOLD_DEVICE_PATH);
}

function getCurrentStartLimitValue() {
    return readFileInt(START_THRESHOLD_DEVICE_PATH);
}



function setThresholdLimit() {
    //to do
}

async function _runInstaller(action, asRoot) {
    const user = GLib.get_user_name();
    debug(`? installer.sh --tool-user ${user} ${action}`);
    let argv = [
        Me.dir.get_child('tool').get_child('installer.sh').get_path(),
        '--tool-user',
        user,
        action,
    ];

    if (asRoot)
        argv.unshift('pkexec');

    try {
        return await execCheck(argv, null, null);
    } catch (err) {
        logError(err, 'InstallError');
    }
}

async function runInstaller() {
    let status = await _runInstaller('install', true);
    if (status == 0)
        ExtensionUtils.getSettings().set_int('install-service', 0);
}

async function runUpdater() {
    let status = await _runInstaller('update', true);
    if (status == 0)
        ExtensionUtils.getSettings().set_int('install-service', 0);
}

async function runUninstaller() {
    let status = await _runInstaller('uninstall', true);
    if (status == 0)
        ExtensionUtils.getSettings().set_int('install-service', 1);
}

async function checkInstallation() {
    let status = await _runInstaller('check', false);
    if (status == 0)
        ExtensionUtils.getSettings().set_int('install-service', 0);
    else if (status == 3)
        ExtensionUtils.getSettings().set_int('install-service', 2);
    else if (status == 5)
        ExtensionUtils.getSettings().set_int('install-service', 1);
    else
        debug(`Installer check mode Error${status}`);
}

function installedCtlPath() {
    for (const name of [
        'batteryhealthchargingctl',
        `batteryhealthchargingctl-${GLib.get_user_name()}`,
    ]) {
        const standard = GLib.find_program_in_path(name);
        if (standard !== null)
            return standard;

        for (const bindir of ['/usr/local/bin/', '/usr/bin/']) {
            const path = bindir + name;
            debug(`Looking for: ${path}`);
            if (Gio.File.new_for_path(path).query_exists(null))
                return path;
        }
    }
    return null;
}

function runCmdCtl(args) {
    const installedCtl = installedCtlPath();
    if (installedCtl !== null)
        execCheck(['pkexec', installedCtl].concat(args), null, false);
    else
        debug('Battery Health Charging: No ctl found.');
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
function runCleanOutdatedFiles() {
    let addCmd = ' && ';
    let rmSymlimkCmd = 'rm -f /etc/systemd/system/multi-user.target.wants/mani-battery-health-charging.service';
    let rmCmd = 'rm -f /etc/systemd/system/mani-battery-health-charging.service';
    let sysctlReloadCmd = 'systemctl daemon-reload';
    let sysctlResetCmd = 'systemctl reset-failed';
    let command = `pkexec /bin/sh -c "${rmSymlimkCmd}${addCmd}${rmCmd}${addCmd}${sysctlReloadCmd}${addCmd}${sysctlResetCmd}"`;

    spawnCommandLine(command);
}

function isSupported() {
    let currentVersion = Config.PACKAGE_VERSION.split('.');
    return currentVersion[0] >= 43;
}

function checkForDepreciatedFIles() {
    if (fileExists(DEPRECIATED_SERVICE_PATH) ||  fileExists(DEPRECIATED_SERVICE_SYMLINK_PATH))
        return true;
    return false;
}

function checkInCompatibility() {
    if (checkForDepreciatedFIles())
        runCleanOutdatedFiles();

    if (!isSupported())
        return 1;

    if (!fileExists(END_THRESHOLD_DEVICE_PATH))
        return 2;

    if (checkAuthRequired()) {
        checkInstallation();
        return 3;
    }

    return 0;
}
