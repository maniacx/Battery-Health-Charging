'use strict';
/* Thinkpad Legacy Laptops using dkms https://github.com/linux-thinkpad/tp_smapi  */
const {Gio, GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const TP_BAT0_END = '/sys/devices/platform/smapi/BAT0/stop_charge_thresh';
const TP_BAT0_START = '/sys/devices/platform/smapi/BAT0/start_charge_thresh';
const TP_BAT1_END = '/sys/devices/platform/smapi/BAT1/stop_charge_thresh';
const TP_BAT1_START = '/sys/devices/platform/smapi/BAT1/start_charge_thresh';

var ThinkpadLegacyDualBattery = GObject.registerClass({
    Signals: {
        'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]},
        'battery-status-changed': {},
    },
}, class ThinkpadLegacyDualBattery extends GObject.Object {
    name = 'Thinkpad tpsmapi BAT0/BAT1';
    type = 13;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = true;
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
    endMaxLifeSpanRangeMin = 50;
    startFullCapacityRangeMax = 95;
    startFullCapacityRangeMin = 75;
    startBalancedRangeMax = 80;
    startBalancedRangeMin = 60;
    startMaxLifeSpanRangeMax = 80;
    startMaxLifeSpanRangeMin = 40;
    minDiffLimit = 5;

    isAvailable() {
        const deviceType = ExtensionUtils.getSettings().get_int('device-type');
        if (deviceType === 0) {
            if (!fileExists(TP_BAT1_START))
                return false;
            if (!fileExists(TP_BAT1_END))
                return false;
            if (!fileExists(TP_BAT0_START))
                return false;
            if (!fileExists(TP_BAT0_END))
                return false;
            this.battery0Removed = false;
            this.battery1Removed = false;
        } else if (deviceType === this.type) {
            this.battery0Removed = !fileExists(TP_BAT0_END);
            this.battery1Removed = !fileExists(TP_BAT1_END);
        }
        return true;
    }

    async setThresholdLimit(chargingMode) {
        if (this.battery0Removed)
            return 0;
        let status;
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        const startValue = settings.get_int(`current-${chargingMode}-start-threshold`);
        const oldEndValue = readFileInt(TP_BAT0_END);
        const oldStartValue = readFileInt(TP_BAT0_START);
        if ((oldEndValue === endValue) && (oldStartValue === startValue)) {
            this.endLimitValue = endValue;
            this.startLimitValue = startValue;
            this.emit('threshold-applied', true);
            return 0;
        }
        // Some device wont update end threshold if start threshold > end threshold
        if (startValue >= oldEndValue)
            status = await runCommandCtl('TP_BAT0_END_START', `${endValue}`, `${startValue}`, false);
        else
            status = await runCommandCtl('TP_BAT0_START_END', `${endValue}`, `${startValue}`, false);
        if (status === 0) {
            this.endLimitValue = readFileInt(TP_BAT0_END);
            this.startLimitValue = readFileInt(TP_BAT0_START);
            if ((endValue === this.endLimitValue) && (startValue === this.startLimitValue)) {
                this.emit('threshold-applied', true);
                return 0;
            }
        }
        this.emit('threshold-applied', false);
        return 1;
    }

    async setThresholdLimit2(chargingMode2) {
        if (this.battery1Removed)
            return 0;
        let status;
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode2}-end-threshold2`);
        const startValue = settings.get_int(`current-${chargingMode2}-start-threshold2`);
        const oldEndValue = readFileInt(TP_BAT1_END);
        const oldStartValue = readFileInt(TP_BAT1_START);
        if ((oldEndValue === endValue) && (oldStartValue === startValue)) {
            this.endLimit2Value = endValue;
            this.startLimit2Value = startValue;
            this.emit('threshold-applied', true);
            return 0;
        }
        // Some device wont update end threshold if start threshold > end threshold
        if (startValue >= oldEndValue)
            status = await runCommandCtl('TP_BAT1_END_START', `${endValue}`, `${startValue}`, false);
        else
            status = await runCommandCtl('TP_BAT1_START_END', `${endValue}`, `${startValue}`, false);
        if (status === 0) {
            this.endLimit2Value = readFileInt(TP_BAT1_END);
            this.startLimit2Value = readFileInt(TP_BAT1_START);
            if ((endValue === this.endLimit2Value) && (startValue === this.startLimit2Value)) {
                this.emit('threshold-applied', true);
                return 0;
            }
        }
        return 1;
    }

    async setThresholdLimitDual() {
        const settings = ExtensionUtils.getSettings();
        let status = await this.setThresholdLimit(settings.get_string('charging-mode'));
        if (status === 0)
            status = await this.setThresholdLimit2(settings.get_string('charging-mode2'));
        return status;
    }

    initializeBatteryMonitoring() {
        this._battery0LevelPath = Gio.File.new_for_path(TP_BAT0_END);
        this._monitorLevel = this._battery0LevelPath.monitor_file(Gio.FileMonitorFlags.NONE, null);
        this._monitorLevelId = this._monitorLevel.connect('changed', (obj, theFile, otherFile, eventType) => {
            if (eventType === Gio.FileMonitorEvent.DELETED) {
                this.battery0Removed = true;
                this.emit('battery-status-changed');
            }
            if (eventType === Gio.FileMonitorEvent.CREATED) {
                this.battery0Removed = false;
                this.setThresholdLimit(ExtensionUtils.getSettings().get_string('charging-mode'));
                this.emit('battery-status-changed');
            }
        });


        this._battery1LevelPath = Gio.File.new_for_path(TP_BAT1_END);
        this._monitorLevel2 = this._battery1LevelPath.monitor_file(Gio.FileMonitorFlags.NONE, null);
        this._monitorLevel2Id = this._monitorLevel2.connect('changed', (obj, theFile, otherFile, eventType) => {
            if (eventType === Gio.FileMonitorEvent.DELETED) {
                this.battery1Removed = true;
                this.emit('battery-status-changed');
            }
            if (eventType === Gio.FileMonitorEvent.CREATED) {
                this.battery1Removed = false;
                this.setThresholdLimit2(ExtensionUtils.getSettings().get_string('charging-mode2'));
                this.emit('battery-status-changed');
            }
        });
    }

    destroy() {
        if (this._monitorLevelId)
            this._monitorLevel.disconnect(this._monitorLevelId);
        this._monitorLevelId = null;
        this._monitorLevel.cancel();
        this._monitorLevel = null;
        this._battery0LevelPath = null;

        if (this._monitorLevel2Id)
            this._monitorLevel2.disconnect(this._monitorLevel2Id);
        this._monitorLevel2Id = null;
        this._monitorLevel2.cancel();
        this._monitorLevel2 = null;
        this._battery1LevelPath = null;
    }
});

var ThinkpadLegacySingleBatteryBAT0 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class ThinkpadLegacySingleBatteryBAT0 extends GObject.Object {
    name = 'Thinkpad tpsmapi BAT0';
    type = 14;
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
    endMaxLifeSpanRangeMin = 50;
    startFullCapacityRangeMax = 95;
    startFullCapacityRangeMin = 75;
    startBalancedRangeMax = 80;
    startBalancedRangeMin = 60;
    startMaxLifeSpanRangeMax = 80;
    startMaxLifeSpanRangeMin = 40;
    minDiffLimit = 5;

    isAvailable() {
        if (!fileExists(TP_BAT0_START))
            return false;
        if (!fileExists(TP_BAT0_END))
            return false;
        if (fileExists(TP_BAT1_END))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._status = 0;
        this._endValue = ExtensionUtils.getSettings().get_int(`current-${chargingMode}-end-threshold`);
        this._startValue = ExtensionUtils.getSettings().get_int(`current-${chargingMode}-start-threshold`);
        if (this._verifyThreshold())
            return this._status;
        // Some device wont update end threshold if start threshold > end threshold
        if (this._startValue >= this._oldEndValue)
            this._status = await runCommandCtl('TP_BAT0_END_START', `${this._endValue}`, `${this._startValue}`, false);
        else
            this._status = await runCommandCtl('TP_BAT0_START_END', `${this._endValue}`, `${this._startValue}`, false);

        if (this._status === 0) {
            if (this._verifyThreshold())
                return this._status;
        }

        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        delete this._delayReadTimeoutId;

        this._delayReadTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 200, () => {
            this._reVerifyThreshold();
            delete this._delayReadTimeoutId;
            return GLib.SOURCE_REMOVE;
        });
        return this._status;
    }

    _verifyThreshold() {
        this._oldEndValue = readFileInt(TP_BAT0_END);
        this._oldStartValue = readFileInt(TP_BAT0_START);
        if ((this._oldEndValue === this._endValue) && (this._oldStartValue === this._startValue)) {
            this.endLimitValue = this._endValue;
            this.startLimitValue = this._startValue;
            this.emit('threshold-applied', true);
            return true;
        }
        return false;
    }

    _reVerifyThreshold() {
        if (this._status === 0) {
            if (this._verifyThreshold())
                return;
        }
        this.emit('threshold-applied', false);
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        delete this._delayReadTimeoutId;
    }
});


var ThinkpadLegacySingleBatteryBAT1 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class ThinkpadLegacySingleBatteryBAT1 extends GObject.Object {
    name = 'Thinkpad tpsmapi BAT1';
    type = 15;
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
    endMaxLifeSpanRangeMin = 50;
    startFullCapacityRangeMax = 95;
    startFullCapacityRangeMin = 75;
    startBalancedRangeMax = 80;
    startBalancedRangeMin = 60;
    startMaxLifeSpanRangeMax = 80;
    startMaxLifeSpanRangeMin = 40;
    minDiffLimit = 5;

    isAvailable() {
        if (!fileExists(TP_BAT1_START))
            return false;
        if (!fileExists(TP_BAT1_END))
            return false;
        if (fileExists(TP_BAT0_END))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._status = 0;
        this._endValue = ExtensionUtils.getSettings().get_int(`current-${chargingMode}-end-threshold`);
        this._startValue = ExtensionUtils.getSettings().get_int(`current-${chargingMode}-start-threshold`);
        if (this._verifyThreshold())
            return this._status;
        // Some device wont update end threshold if start threshold > end threshold
        if (this._startValue >= this._oldEndValue)
            this._status = await runCommandCtl('TP_BAT1_END_START', `${this._endValue}`, `${this._startValue}`, false);
        else
            this._status = await runCommandCtl('TP_BAT1_START_END', `${this._endValue}`, `${this._startValue}`, false);

        if (this._status === 0) {
            if (this._verifyThreshold())
                return this._status;
        }

        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        delete this._delayReadTimeoutId;

        this._delayReadTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 200, () => {
            this._reVerifyThreshold();
            delete this._delayReadTimeoutId;
            return GLib.SOURCE_REMOVE;
        });
        return this._status;
    }

    _verifyThreshold() {
        this._oldEndValue = readFileInt(TP_BAT1_END);
        this._oldStartValue = readFileInt(TP_BAT1_START);
        if ((this._oldEndValue === this._endValue) && (this._oldStartValue === this._startValue)) {
            this.endLimitValue = this._endValue;
            this.startLimitValue = this._startValue;
            this.emit('threshold-applied', true);
            return true;
        }
        return false;
    }

    _reVerifyThreshold() {
        if (this._status === 0) {
            if (this._verifyThreshold())
                return;
        }
        this.emit('threshold-applied', false);
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        delete this._delayReadTimeoutId;
    }
});

