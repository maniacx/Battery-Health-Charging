'use strict';
const {Gio, GLib} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Config = imports.misc.config;

const END_THRESHOLD_DEVICE_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
const START_THRESHOLD_DEVICE_PATH = '/sys/class/power_supply/BAT0/charge_control_start_threshold';
const DEPRECIATED_SERVICE_PATH = '/etc/systemd/system/mani-battery-health-charging.service';
const DEPRECIATED_SERVICE_SYMLINK_PATH = '/etc/systemd/system/multi-user.target.wants/mani-battery-health-charging.service';

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

function isChargeStartThresholdSupported() {
    if (fileExists(START_THRESHOLD_DEVICE_PATH))
        return true;

    return false;
}

function getCurrentEndLimitValue() {
    return readFileInt(END_THRESHOLD_DEVICE_PATH);
}

function getCurrentStartLimitValue() {
    return readFileInt(START_THRESHOLD_DEVICE_PATH);
}

function spawnCommandLine(command) {
    try {
        GLib.spawn_command_line_async(command);
    } catch (e) {
        logError(`Spawning command failed: ${command}`, e);
    }
}

function setEndThresholdLimit(endValue) {
    let chargeEndThresholdCmd = `bash -c "echo ${endValue} > ${END_THRESHOLD_DEVICE_PATH}\n"`;
    spawnCommandLine(chargeEndThresholdCmd);
}

function setStartThresholdLimit(startValue) {
    let chargeStartThresholdCmd = `bash -c "echo ${startValue} > ${START_THRESHOLD_DEVICE_PATH}\n"`;
    spawnCommandLine(chargeStartThresholdCmd);
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

function checkAuthRequired() {
    try {
        const f = Gio.File.new_for_path(END_THRESHOLD_DEVICE_PATH);
        const info = f.query_info('access::*', Gio.FileQueryInfoFlags.NONE, null);
        if (!info.get_attribute_boolean('access::can-write'))
            return true;
    } catch (e) {
        // Ignored
    }
    if (isChargeStartThresholdSupported()) {
        try {
            const f = Gio.File.new_for_path(START_THRESHOLD_DEVICE_PATH);
            const info = f.query_info('access::*', Gio.FileQueryInfoFlags.NONE, null);
            if (!info.get_attribute_boolean('access::can-write'))
                return true;
        } catch (e) {
            // Ignored
        }
    }
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
        ExtensionUtils.getSettings().set_boolean('install-service', false);
        return 3;
    }

    return 0;
}

function runInstaller() {
}

function runUninstaller() {
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
    let command = 'pkexec /bin/sh -c "' + rmSymlimkCmd + addCmd + rmCmd + addCmd + sysctlReloadCmd + addCmd + sysctlResetCmd + '"';

    spawnCommandLine(command);
}
