'use strict';
/* Thinkpad Legacy Laptops using dkms https://github.com/linux-thinkpad/tp_smapi  */
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as Helper from '../lib/helper.js';

const {fileExists, readFileInt, runCommandCtl} = Helper;

const TP_BAT0_END = '/sys/devices/platform/smapi/BAT0/stop_charge_thresh';
const TP_BAT0_START = '/sys/devices/platform/smapi/BAT0/start_charge_thresh';
const TP_BAT1_END = '/sys/devices/platform/smapi/BAT1/stop_charge_thresh';
const TP_BAT1_START = '/sys/devices/platform/smapi/BAT1/start_charge_thresh';

export const ThinkpadLegacyDualBattery = GObject.registerClass({
    Signals: {
        'threshold-applied': {param_types: [GObject.TYPE_STRING]},
        'battery-status-changed': {},
    },
}, class ThinkpadLegacyDualBattery extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Thinkpad tpsmapi BAT0/BAT1';
        this.type = 13;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = true;
        this.deviceHaveStartThreshold = true;
        this.deviceHaveVariableThreshold = true;
        this.deviceHaveBalancedMode = true;
        this.deviceHaveAdaptiveMode = false;
        this.deviceHaveExpressMode = false;
        this.deviceUsesModeNotValue = false;
        this.iconForFullCapMode = '100';
        this.iconForBalanceMode = '080';
        this.iconForMaxLifeMode = '060';
        this.endFullCapacityRangeMax = 100;
        this.endFullCapacityRangeMin = 80;
        this.endBalancedRangeMax = 85;
        this.endBalancedRangeMin = 65;
        this.endMaxLifeSpanRangeMax = 85;
        this.endMaxLifeSpanRangeMin = 50;
        this.startFullCapacityRangeMax = 95;
        this.startFullCapacityRangeMin = 75;
        this.startBalancedRangeMax = 80;
        this.startBalancedRangeMin = 60;
        this.startMaxLifeSpanRangeMax = 80;
        this.startMaxLifeSpanRangeMin = 40;
        this.minDiffLimit = 5;
        this.incrementsStep = 1;
        this.incrementsPage = 5;

        this._settings = settings;
    }

    isAvailable() {
        const deviceType = this._settings.get_int('device-type');
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
        const ctlPath = this._settings.get_string('ctl-path');
        const endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
        const startValue = this._settings.get_int(`current-${chargingMode}-start-threshold`);
        const oldEndValue = readFileInt(TP_BAT0_END);
        const oldStartValue = readFileInt(TP_BAT0_START);
        if ((oldEndValue === endValue) && (oldStartValue === startValue)) {
            this.endLimitValue = endValue;
            this.startLimitValue = startValue;
            this.emit('threshold-applied', 'success');
            return 0;
        }
        // Some device wont update end threshold if start threshold > end threshold
        if (startValue >= oldEndValue)
            [status] = await runCommandCtl(ctlPath, 'TP_BAT0_END_START', `${endValue}`, `${startValue}`, null);
        else
            [status] = await runCommandCtl(ctlPath, 'TP_BAT0_START_END', `${endValue}`, `${startValue}`, null);
        if (status === 0) {
            this.endLimitValue = readFileInt(TP_BAT0_END);
            this.startLimitValue = readFileInt(TP_BAT0_START);
            if ((endValue === this.endLimitValue) && (startValue === this.startLimitValue)) {
                this.emit('threshold-applied', 'success');
                return 0;
            }
        }
        this.emit('threshold-applied', 'failed');
        return 1;
    }

    async setThresholdLimit2(chargingMode2) {
        if (this.battery1Removed)
            return 0;
        let status;
        const ctlPath = this._settings.get_string('ctl-path');
        const endValue = this._settings.get_int(`current-${chargingMode2}-end-threshold2`);
        const startValue = this._settings.get_int(`current-${chargingMode2}-start-threshold2`);
        const oldEndValue = readFileInt(TP_BAT1_END);
        const oldStartValue = readFileInt(TP_BAT1_START);
        if ((oldEndValue === endValue) && (oldStartValue === startValue)) {
            this.endLimit2Value = endValue;
            this.startLimit2Value = startValue;
            this.emit('threshold-applied', 'success');
            return 0;
        }
        // Some device wont update end threshold if start threshold > end threshold
        if (startValue >= oldEndValue)
            [status] = await runCommandCtl(ctlPath, 'TP_BAT1_END_START', `${endValue}`, `${startValue}`, null);
        else
            [status] = await runCommandCtl(ctlPath, 'TP_BAT1_START_END', `${endValue}`, `${startValue}`, null);
        if (status === 0) {
            this.endLimit2Value = readFileInt(TP_BAT1_END);
            this.startLimit2Value = readFileInt(TP_BAT1_START);
            if ((endValue === this.endLimit2Value) && (startValue === this.startLimit2Value)) {
                this.emit('threshold-applied', 'success');
                return 0;
            }
        }
        return 1;
    }

    async setThresholdLimitDual() {
        let status = await this.setThresholdLimit(this._settings.get_string('charging-mode'));
        if (status === 0)
            status = await this.setThresholdLimit2(this._settings.get_string('charging-mode2'));
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
                this.setThresholdLimit(this._settings.get_string('charging-mode'));
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
                this.setThresholdLimit2(this._settings.get_string('charging-mode2'));
                this.emit('battery-status-changed');
            }
        });
    }

    destroy() {
        if (this._monitorLevelId)
            this._monitorLevel.disconnect(this._monitorLevelId);
        this._monitorLevelId = null;
        if (this._monitorLevel)
            this._monitorLevel.cancel();
        this._monitorLevel = null;
        this._battery0LevelPath = null;

        if (this._monitorLevel2Id)
            this._monitorLevel2.disconnect(this._monitorLevel2Id);
        this._monitorLevel2Id = null;
        if (this._monitorLevel2)
            this._monitorLevel2.cancel();
        this._monitorLevel2 = null;
        this._battery1LevelPath = null;
    }
});

export const ThinkpadLegacySingleBatteryBAT0 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class ThinkpadLegacySingleBatteryBAT0 extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Thinkpad tpsmapi BAT0';
        this.type = 14;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = false;
        this.deviceHaveStartThreshold = true;
        this.deviceHaveVariableThreshold = true;
        this.deviceHaveBalancedMode = true;
        this.deviceHaveAdaptiveMode = false;
        this.deviceHaveExpressMode = false;
        this.deviceUsesModeNotValue = false;
        this.iconForFullCapMode = '100';
        this.iconForBalanceMode = '080';
        this.iconForMaxLifeMode = '060';
        this.endFullCapacityRangeMax = 100;
        this.endFullCapacityRangeMin = 80;
        this.endBalancedRangeMax = 85;
        this.endBalancedRangeMin = 65;
        this.endMaxLifeSpanRangeMax = 85;
        this.endMaxLifeSpanRangeMin = 50;
        this.startFullCapacityRangeMax = 95;
        this.startFullCapacityRangeMin = 75;
        this.startBalancedRangeMax = 80;
        this.startBalancedRangeMin = 60;
        this.startMaxLifeSpanRangeMax = 80;
        this.startMaxLifeSpanRangeMin = 40;
        this.minDiffLimit = 5;
        this.incrementsStep = 1;
        this.incrementsPage = 5;

        this._settings = settings;
    }

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
        const ctlPath = this._settings.get_string('ctl-path');
        this._endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
        this._startValue = this._settings.get_int(`current-${chargingMode}-start-threshold`);
        if (this._verifyThreshold())
            return this._status;
        // Some device wont update end threshold if start threshold > end threshold
        if (this._startValue >= this._oldEndValue)
            [this._status] = await runCommandCtl(ctlPath, 'TP_BAT0_END_START', `${this._endValue}`, `${this._startValue}`, null);
        else
            [this._status] = await runCommandCtl(ctlPath, 'TP_BAT0_START_END', `${this._endValue}`, `${this._startValue}`, null);

        if (this._status === 0) {
            if (this._verifyThreshold())
                return this._status;
        }

        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;

        this._delayReadTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 200, () => {
            this._reVerifyThreshold();
            this._delayReadTimeoutId = null;
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
            this.emit('threshold-applied', 'success');
            return true;
        }
        return false;
    }

    _reVerifyThreshold() {
        if (this._status === 0) {
            if (this._verifyThreshold())
                return;
        }
        this.emit('threshold-applied', 'failed');
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;
    }
});

export const ThinkpadLegacySingleBatteryBAT1 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class ThinkpadLegacySingleBatteryBAT1 extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Thinkpad tpsmapi BAT1';
        this.type = 15;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = false;
        this.deviceHaveStartThreshold = true;
        this.deviceHaveVariableThreshold = true;
        this.deviceHaveBalancedMode = true;
        this.deviceHaveAdaptiveMode = false;
        this.deviceHaveExpressMode = false;
        this.deviceUsesModeNotValue = false;
        this.iconForFullCapMode = '100';
        this.iconForBalanceMode = '080';
        this.iconForMaxLifeMode = '060';
        this.endFullCapacityRangeMax = 100;
        this.endFullCapacityRangeMin = 80;
        this.endBalancedRangeMax = 85;
        this.endBalancedRangeMin = 65;
        this.endMaxLifeSpanRangeMax = 85;
        this.endMaxLifeSpanRangeMin = 50;
        this.startFullCapacityRangeMax = 95;
        this.startFullCapacityRangeMin = 75;
        this.startBalancedRangeMax = 80;
        this.startBalancedRangeMin = 60;
        this.startMaxLifeSpanRangeMax = 80;
        this.startMaxLifeSpanRangeMin = 40;
        this.minDiffLimit = 5;
        this.incrementsStep = 1;
        this.incrementsPage = 5;

        this._settings = settings;
    }

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
        const ctlPath = this._settings.get_string('ctl-path');
        this._endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
        this._startValue = this._settings.get_int(`current-${chargingMode}-start-threshold`);
        if (this._verifyThreshold())
            return this._status;
        // Some device wont update end threshold if start threshold > end threshold
        if (this._startValue >= this._oldEndValue)
            [this._status] = await runCommandCtl(ctlPath, 'TP_BAT1_END_START', `${this._endValue}`, `${this._startValue}`, null);
        else
            [this._status] = await runCommandCtl(ctlPath, 'TP_BAT1_START_END', `${this._endValue}`, `${this._startValue}`, null);

        if (this._status === 0) {
            if (this._verifyThreshold())
                return this._status;
        }

        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;

        this._delayReadTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 200, () => {
            this._reVerifyThreshold();
            this._delayReadTimeoutId = null;
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
            this.emit('threshold-applied', 'success');
            return true;
        }
        return false;
    }

    _reVerifyThreshold() {
        if (this._status === 0) {
            if (this._verifyThreshold())
                return;
        }
        this.emit('threshold-applied', 'failed');
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;
    }
});

