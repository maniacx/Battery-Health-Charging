'use strict';
/* Apple Mac book with M-series processor - Asahi linux Laptops https://asahilinux.org/ */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFile, readFileInt, runCommandCtl} = Helper;

const ASAHI_END_PATH = '/sys/class/power_supply/macsmc-battery/charge_control_end_threshold';
const ASAHI_START_PATH = '/sys/class/power_supply/macsmc-battery/charge_control_start_threshold';
const KERNEL_VERSION_PATH = '/proc/sys/kernel/osrelease';

var AsahiSingleBattery62 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class AsahiSingleBattery62 extends GObject.Object {
    name = 'AppleAsahiLinux-VariableThreshold';
    type = 25;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = true;
    deviceHaveVariableThreshold = true;
    deviceHaveBalancedMode = true;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
    deviceUsesModeNotValue = false;
    iconForFullCapMode = '100';
    iconForBalanceMode = '080';
    iconForMaxLifeMode = '060';
    endFullCapacityRangeMax = 100;
    endFullCapacityRangeMin = 80;
    endBalancedRangeMax = 85;
    endBalancedRangeMin = 65;
    endMaxLifeSpanRangeMax = 85;
    endMaxLifeSpanRangeMin = 52;
    startFullCapacityRangeMax = 98;
    startFullCapacityRangeMin = 75;
    startBalancedRangeMax = 83;
    startBalancedRangeMin = 60;
    startMaxLifeSpanRangeMax = 83;
    startMaxLifeSpanRangeMin = 50;
    minDiffLimit = 2;

    isAvailable() {
        if (!fileExists(ASAHI_END_PATH))
            return false;
        if (!fileExists(ASAHI_START_PATH))
            return false;
        const kernelVersion = readFile(KERNEL_VERSION_PATH).trim().split('.', 2);
        if ((parseInt(kernelVersion[0]) >= 6) && (parseInt(kernelVersion[1]) >= 3))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        const startValue = settings.get_int(`current-${chargingMode}-start-threshold`);
        if ((readFileInt(ASAHI_END_PATH) === endValue) && (readFileInt(ASAHI_START_PATH) === startValue)) {
            this.endLimitValue = endValue;
            this.startLimitValue = startValue;
            this.emit('threshold-applied', true);
            return 0;
        }
        const status = await runCommandCtl('ASAHI_END_START', `${endValue}`, `${startValue}`, false);
        if (status === 0) {
            this.endLimitValue = readFileInt(ASAHI_END_PATH);
            this.startLimitValue = readFileInt(ASAHI_START_PATH);
            if ((endValue === this.endLimitValue) && (startValue === this.startLimitValue)) {
                this.emit('threshold-applied', true);
                return 0;
            }
        }
        this.emit('threshold-applied', false);
        return 1;
    }

    destroy() {
        // Nothing to destroy for this device
    }
});

var AsahiSingleBattery63 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class AsahiSingleBattery63 extends GObject.Object {
    name = 'AppleAsahiLinux-FixedThreshold';
    type = 29;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = false;
    deviceHaveBalancedMode = false;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
    deviceUsesModeNotValue = false;
    iconForFullCapMode = '100';
    iconForMaxLifeMode = '080';

    isAvailable() {
        if (!fileExists(ASAHI_END_PATH))
            return false;
        if (!fileExists(ASAHI_START_PATH))
            return false;
        const kernelVersion = readFile(KERNEL_VERSION_PATH).trim().split('.', 2);
        if ((parseInt(kernelVersion[0]) <= 6) && (parseInt(kernelVersion[1]) <= 2))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let endValue, startValue;
        if (chargingMode === 'ful') {
            endValue = 100;
            startValue = 100;
        } else if (chargingMode === 'max') {
            endValue = 80;
            startValue = 75;
        }
        if (readFileInt(ASAHI_END_PATH) === endValue) {
            this.endLimitValue = endValue;
            this.emit('threshold-applied', true);
            return 0;
        }
        const status = await runCommandCtl('ASAHI_END_START', `${endValue}`, `${startValue}`, false);
        if (status === 0) {
            this.endLimitValue = readFileInt(ASAHI_END_PATH);
            if (endValue === this.endLimitValue) {
                this.emit('threshold-applied', true);
                return 0;
            }
        }
        this.emit('threshold-applied', false);
        return 1;
    }

    destroy() {
        // Nothing to destroy for this device
    }
});


