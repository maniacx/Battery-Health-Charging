'use strict';
const {GLib} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, execCheck} = Helper;
const {
    Asus, Lg, Samsung, Sony, Huawei, Toshiba, System76,
    Lenovo, Thinkpad, ThinkpadLegacy, Apple, Acer, Dell, Msi,
} = Me.imports.devices;

const OUTDATED_SERVICE_PATH = '/etc/systemd/system/mani-battery-health-charging.service';
const OUTDATED_SERVICE_SYMLINK_PATH = '/etc/systemd/system/multi-user.target.wants/mani-battery-health-charging.service';

var currentDevice = null;

const deviceArray = [
    Asus.AsusSingleBatteryBAT0,                     // 1
    Asus.AsusSingleBatteryBAT1,                     // 2
    Asus.AsusSingleBatteryBATC,                     // 3
    Asus.AsusSingleBatteryBATT,                     // 4
    Lg.LgSingleBattery,                             // 5
    Samsung.SamsungSingleBattery,                   // 6
    Sony.SonySingleBattery,                         // 7
    Huawei.HuaweiSingleBattery,                     // 8
    Toshiba.ToshibaSingleBatteryBAT0,               // 9
    Toshiba.ToshibaSingleBatteryBAT1,               // 10
    System76.System76SingleBattery,                 // 11
    Lenovo.LenovoSingleBattery,                     // 12
    ThinkpadLegacy.ThinkpadLegacyDualBattery,       // 13
    ThinkpadLegacy.ThinkpadLegacySingleBatteryBAT0, // 14
    ThinkpadLegacy.ThinkpadLegacySingleBatteryBAT1, // 15
    Apple.AppleSingleBattery,                       // 16
    Acer.AcerSingleBattery,                         // 17
    Msi.MsiSingleBattery,                           // 18
    Thinkpad.ThinkpadDualBattery,                   // 19
    Thinkpad.ThinkpadSingleBatteryBAT0,             // 20
    Thinkpad.ThinkpadSingleBatteryBAT1,             // 21
    Dell.DellSmBiosSingleBattery,                   // 22
];

async function runInstallerScript(action) {
    const user = GLib.get_user_name();
    const argv = [
        'pkexec',
        Me.dir.get_child('tool').get_child('installer.sh').get_path(),
        '--tool-user',
        user,
        action,
    ];
    return await execCheck(argv, true, false);
}

async function runInstaller() {
    const status = await runInstallerScript('install');
    if (status === 0)
        ExtensionUtils.getSettings().set_int('install-service', 0);
}

async function runUpdater() {
    const status = await runInstallerScript('update');
    if (status === 0)
        ExtensionUtils.getSettings().set_int('install-service', 0);
}

async function runUninstaller() {
    const status = await runInstallerScript('uninstall');
    if (status === 0)
        ExtensionUtils.getSettings().set_int('install-service', 1);
}

async function checkInstallation() {
    const user = GLib.get_user_name();
    const ctlPath = GLib.find_program_in_path(`batteryhealthchargingctl-${user}`);

    if (ctlPath === null) {
        ExtensionUtils.getSettings().set_int('install-service', 1);
        return 2; //    // Polkit not installed
    }
    ExtensionUtils.getSettings().set_string('ctl-path', ctlPath);
    const resourceDir = Me.dir.get_child('resources').get_path();
    const argv = ['pkexec', ctlPath, 'CHECKINSTALLATION', resourceDir, user];

    const status = await execCheck(argv, false, false);
    if (status === 0) {   // Polkit Installed
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

    return await execCheck(argv, false, false);
}

function checkForOutdatedFiles() {
    if (fileExists(OUTDATED_SERVICE_PATH) ||  fileExists(OUTDATED_SERVICE_SYMLINK_PATH))
        return true;
    return false;
}

function getCurrentDevice() {
    let device = null;

    if (currentDevice !== null)
        return true;


    const type = ExtensionUtils.getSettings().get_int('device-type');

    if (type !== 0) {
        device = new deviceArray[type - 1]();
        if (device.type === type) {
            if (device.isAvailable()) {
                currentDevice = device;
                return true;
            } else {
                ExtensionUtils.getSettings().set_int('device-type', 0); // Reset device and check again.
            }
        }
    }
    device = null;
    deviceArray.some(item => {
        device = new item();
        if (device.isAvailable()) {
            currentDevice = device;
            ExtensionUtils.getSettings().set_int('device-type', currentDevice.type);
            return true;
        } else {
            return false;
        }
    });
    if (currentDevice !== null) {
        log(`Battery Health Extension: Supported device found = ${currentDevice.name}`);
        return true;
    }
    return false;
}

async function checkCompatibility() {
    if (getCurrentDevice() === false)
        return 1;   // Unsupported Device

    if (checkForOutdatedFiles()) // Notify Removal of depreciated service files from older version
        return 2;

    if (currentDevice.deviceNeedRootPermission) {
        const installStatus = await checkInstallation();
        if (installStatus === 1)
            return 3;   // Polkit Needs Update
        else if (installStatus === 2)
            return 4;   // Polkit not installed
    }
    let status;
    if (currentDevice.deviceHaveDualBattery)
        status = await currentDevice.setThresholdLimitDual();
    else
        status = await currentDevice.setThresholdLimit(ExtensionUtils.getSettings().get_string('charging-mode'));
    if (status !== 0)
        return 5;

    return 0;
}

function onDisable() {
    currentDevice = null;
}
