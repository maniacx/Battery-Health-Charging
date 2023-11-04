'use strict';
/* Thinkpad Laptops */
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as Helper from '../lib/helper.js';

const {fileExists, readFile, readFileInt, readFileUri, runCommandCtl} = Helper;

const VENDOR_THINKPAD = '/sys/devices/platform/thinkpad_acpi';
const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
const BAT0_START_PATH = '/sys/class/power_supply/BAT0/charge_control_start_threshold';
const BAT1_END_PATH = '/sys/class/power_supply/BAT1/charge_control_end_threshold';
const BAT1_START_PATH = '/sys/class/power_supply/BAT1/charge_control_start_threshold';
const BAT0_CAPACITY_PATH = '/sys/class/power_supply/BAT0/capacity';
const BAT1_CAPACITY_PATH = '/sys/class/power_supply/BAT1/capacity';
const BAT0_FORCE_DISCHARGE_PATH = '/sys/class/power_supply/BAT0/charge_behaviour';
const BAT1_FORCE_DISCHARGE_PATH = '/sys/class/power_supply/BAT1/charge_behaviour';

const BUS_NAME = 'org.freedesktop.UPower';
const OBJECT_PATH = '/org/freedesktop/UPower/devices/DisplayDevice';

export const ThinkpadDualBattery = GObject.registerClass({
    Signals: {
        'threshold-applied': {param_types: [GObject.TYPE_STRING]},
        'battery-status-changed': {},
    },
}, class ThinkpadDualBattery extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Thinkpad BAT0/BAT1';
        this.type = 19;
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
        this.startFullCapacityRangeMax = 98;
        this.startFullCapacityRangeMin = 75;
        this.startBalancedRangeMax = 83;
        this.startBalancedRangeMin = 60;
        this.startMaxLifeSpanRangeMax = 83;
        this.startMaxLifeSpanRangeMin = 40;
        this.minDiffLimit = 2;
        this.incrementsStep = 1;
        this.incrementsPage = 5;

        this._settings = settings;
    }

    isAvailable() {
        const deviceType = this._settings.get_int('device-type');
        if (deviceType === 0) {
            if (!fileExists(VENDOR_THINKPAD))
                return false;
            if (!fileExists(BAT1_START_PATH))
                return false;
            if (!fileExists(BAT1_END_PATH))
                return false;
            if (!fileExists(BAT0_START_PATH))
                return false;
            if (!fileExists(BAT0_END_PATH))
                return false;
            this.battery0Removed = false;
            this.battery1Removed = false;
        } else if (deviceType === this.type) {
            this.battery0Removed = !fileExists(BAT0_END_PATH);
            this.battery1Removed = !fileExists(BAT1_END_PATH);
        }
        this._initializeBatteryMonitoring();
        return true;
    }

    async setThresholdLimit(chargingMode) {
        if (this.battery0Removed)
            return 0;
        let status;
        const ctlPath = this._settings.get_string('ctl-path');
        const endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
        const startValue = this._settings.get_int(`current-${chargingMode}-start-threshold`);
        const oldEndValue = readFileInt(BAT0_END_PATH);
        const oldStartValue = readFileInt(BAT0_START_PATH);
        if ((oldEndValue === endValue) && (oldStartValue === startValue)) {
            this.endLimitValue = endValue;
            this.startLimitValue = startValue;
            this.emit('threshold-applied', 'success');
            return 0;
        }
        // Some device wont update end threshold if start threshold > end threshold
        if (startValue >= oldEndValue)
            [status] = await runCommandCtl(ctlPath, 'BAT0_END_START', `${endValue}`, `${startValue}`, null);
        else
            [status] = await runCommandCtl(ctlPath, 'BAT0_START_END', `${endValue}`, `${startValue}`, null);
        if (status === 0) {
            this.endLimitValue = readFileInt(BAT0_END_PATH);
            this.startLimitValue = readFileInt(BAT0_START_PATH);
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
        const oldEndValue = readFileInt(BAT1_END_PATH);
        const oldStartValue = readFileInt(BAT1_START_PATH);
        if ((oldEndValue === endValue) && (oldStartValue === startValue)) {
            this.endLimit2Value = endValue;
            this.startLimit2Value = startValue;
            this.emit('threshold-applied', 'success');
            return 0;
        }
        // Some device wont update end threshold if start threshold > end threshold
        if (startValue >= oldEndValue)
            [status] = await runCommandCtl(ctlPath, 'BAT1_END_START', `${endValue}`, `${startValue}`, null);
        else
            [status] = await runCommandCtl(ctlPath, 'BAT1_START_END', `${endValue}`, `${startValue}`, null);
        if (status === 0) {
            this.endLimit2Value = readFileInt(BAT1_END_PATH);
            this.startLimit2Value = readFileInt(BAT1_START_PATH);
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

    _initializeBatteryMonitoring() {
        this._battery0LevelPath = Gio.File.new_for_path(BAT0_END_PATH);
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

        this._battery1LevelPath = Gio.File.new_for_path(BAT1_END_PATH);
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

export const ThinkpadSingleBatteryBAT0 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class ThinkpadSingleBatteryBAT0 extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Thinkpad BAT0';
        this.type = 20;
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
        this.startFullCapacityRangeMax = 98;
        this.startFullCapacityRangeMin = 75;
        this.startBalancedRangeMax = 83;
        this.startBalancedRangeMin = 60;
        this.startMaxLifeSpanRangeMax = 83;
        this.startMaxLifeSpanRangeMin = 40;
        this.minDiffLimit = 2;
        this.incrementsStep = 1;
        this.incrementsPage = 5;

        this._settings = settings;
    }

    isAvailable() {
        if (!fileExists(VENDOR_THINKPAD))
            return false;
        if (!fileExists(BAT0_START_PATH))
            return false;
        if (!fileExists(BAT0_END_PATH))
            return false;
        if (fileExists(BAT1_END_PATH))
            return false;
        this._batteryMonitoringInitialized = false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._status = 0;
        this._ctlPath = this._settings.get_string('ctl-path');
        this._endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
        this._startValue = this._settings.get_int(`current-${chargingMode}-start-threshold`);

        if (!this._batteryMonitoringInitialized)
            this._initializeBatteryMonitoring();
        if (this._settings.get_boolean('force-discharge-enabled'))
            this._forceDischarge();

        if (this._verifyThreshold())
            return this._status;
        // Some device wont update end threshold if start threshold > end threshold
        if (this._startValue >= this._oldEndValue)
            [this._status] = await runCommandCtl(this._ctlPath, 'BAT0_END_START', `${this._endValue}`, `${this._startValue}`, null);
        else
            [this._status] = await runCommandCtl(this._ctlPath, 'BAT0_START_END', `${this._endValue}`, `${this._startValue}`, null);

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
        this._oldEndValue = readFileInt(BAT0_END_PATH);
        this._oldStartValue = readFileInt(BAT0_START_PATH);
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

    _readForceDischargeMode() {
        const forceDischargeModeRead = readFile(BAT0_FORCE_DISCHARGE_PATH).replace(/\r?\n|\r/g, '');
        return forceDischargeModeRead.substring(
          forceDischargeModeRead.indexOf("[") + 1,
          forceDischargeModeRead.lastIndexOf("]")
        );
    }

    _enableForceDischarge() {
        const forceDischargeModeRead = this._readForceDischargeMode();
        if (forceDischargeModeRead !== 'force-discharge')
            runCommandCtl(this._ctlPath, 'FORCE_DISCHARGE_BAT0', 'force-discharge', null, null);
    }

    _disableForceDischarge() {
        const forceDischargeModeRead = this._readForceDischargeMode();
        if (forceDischargeModeRead !== 'auto')
            runCommandCtl(this._ctlPath, 'FORCE_DISCHARGE_BAT0', 'auto', null, null);
    }

    _forceDischarge() {
        const chargingMode = this._settings.get_string('charging-mode');
        const currentThresholdValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
        if (this._batteryLevel > currentThresholdValue)
            this._enableForceDischarge();
        else
            this._disableForceDischarge();
    }

    _initializeBatteryMonitoring() {
        if (this._settings.get_boolean('force-discharge-enabled'))
            this._enableBatteryCapacityMonitoring();
        this._settings.connectObject(
            'changed::force-discharge-enabled', () => {
                if (this._settings.get_boolean('force-discharge-enabled'))
                    this._enableBatteryCapacityMonitoring();
                else
                    this._disableBatteryCapacityMonitoring();
            },
            this
        );
        this._batteryMonitoringInitialized = true;
    }

    _enableBatteryCapacityMonitoring() {
        this._batteryLevel = readFileInt(BAT0_CAPACITY_PATH);
        this._forceDischarge();
        const xmlFile = 'resource:///org/gnome/shell/dbus-interfaces/org.freedesktop.UPower.Device.xml';
        const powerManagerProxy = Gio.DBusProxy.makeProxyWrapper(readFileUri(xmlFile));
        this._proxy = new powerManagerProxy(Gio.DBus.system, BUS_NAME, OBJECT_PATH, (proxy, error) => {
            if (error) {
                log(error.message);
            } else {
                this._proxyId = this._proxy.connect('g-properties-changed', () => {
                    const batteryLevel = this._proxy.Percentage;
                    if (this._batteryLevel !== batteryLevel) {
                        this._batteryLevel = batteryLevel;
                        if (this._batteryMonitoringInitialized)
                            this._forceDischarge();
                    }
                });
            }
        });
    }

    _disableBatteryCapacityMonitoring() {
        this._disableForceDischarge();
        if (this._proxy)
            this._proxy.disconnect(this._proxyId);
        this._proxyId = null;
        this._proxy = null;
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;
        this._disableBatteryCapacityMonitoring();
        this._settings.disconnectObject(this);
    }
});

export const ThinkpadSingleBatteryBAT1 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class ThinkpadSingleBatteryBAT1 extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Thinkpad BAT1';
        this.type = 21;
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
        this.startFullCapacityRangeMax = 98;
        this.startFullCapacityRangeMin = 75;
        this.startBalancedRangeMax = 83;
        this.startBalancedRangeMin = 60;
        this.startMaxLifeSpanRangeMax = 83;
        this.startMaxLifeSpanRangeMin = 40;
        this.minDiffLimit = 2;
        this.incrementsStep = 1;
        this.incrementsPage = 5;

        this._settings = settings;
    }

    isAvailable() {
        if (!fileExists(VENDOR_THINKPAD))
            return false;
        if (!fileExists(BAT1_START_PATH))
            return false;
        if (!fileExists(BAT1_END_PATH))
            return false;
        if (fileExists(BAT0_END_PATH))
            return false;
        this._batteryMonitoringInitialized = false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._status = 0;
        this._ctlPath = this._settings.get_string('ctl-path');
        this._endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
        this._startValue = this._settings.get_int(`current-${chargingMode}-start-threshold`);

        if (!this._batteryMonitoringInitialized)
            this._initializeBatteryMonitoring();
        if (this._settings.get_boolean('force-discharge-enabled'))
            this._forceDischarge();

        if (this._verifyThreshold())
            return this._status;
        // Some device wont update end threshold if start threshold > end threshold
        if (this._startValue >= this._oldEndValue)
            [this._status] = await runCommandCtl(this._ctlPath, 'BAT1_END_START', `${this._endValue}`, `${this._startValue}`, null);
        else
            [this._status] = await runCommandCtl(this._ctlPath, 'BAT1_START_END', `${this._endValue}`, `${this._startValue}`, null);

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
        this._oldEndValue = readFileInt(BAT1_END_PATH);
        this._oldStartValue = readFileInt(BAT1_START_PATH);
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

    _readForceDischargeMode() {
        const forceDischargeModeRead = readFile(BAT1_FORCE_DISCHARGE_PATH).replace(/\r?\n|\r/g, '');
        return forceDischargeModeRead.substring(
          forceDischargeModeRead.indexOf("[") + 1,
          forceDischargeModeRead.lastIndexOf("]")
        );
    }

    _enableForceDischarge() {
        const forceDischargeModeRead = this._readForceDischargeMode();
        if (forceDischargeModeRead !== 'force-discharge')
            runCommandCtl(this._ctlPath, 'FORCE_DISCHARGE_BAT1', 'force-discharge', null, null);
    }

    _disableForceDischarge() {
        const forceDischargeModeRead = this._readForceDischargeMode();
        if (forceDischargeModeRead !== 'auto')
            runCommandCtl(this._ctlPath, 'FORCE_DISCHARGE_BAT1', 'auto', null, null);
    }

    _forceDischarge() {
        const chargingMode = this._settings.get_string('charging-mode');
        const currentThresholdValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
        if (this._batteryLevel > currentThresholdValue)
            this._enableForceDischarge();
        else
            this._disableForceDischarge();
    }

    _initializeBatteryMonitoring() {
        if (this._settings.get_boolean('force-discharge-enabled'))
            this._enableBatteryCapacityMonitoring();
        this._settings.connectObject(
            'changed::force-discharge-enabled', () => {
                if (this._settings.get_boolean('force-discharge-enabled'))
                    this._enableBatteryCapacityMonitoring();
                else
                    this._disableBatteryCapacityMonitoring();
            },
            this
        );
        this._batteryMonitoringInitialized = true;
    }

    _enableBatteryCapacityMonitoring() {
        this._batteryLevel = readFileInt(BAT1_CAPACITY_PATH);
        this._forceDischarge();
        const xmlFile = 'resource:///org/gnome/shell/dbus-interfaces/org.freedesktop.UPower.Device.xml';
        const powerManagerProxy = Gio.DBusProxy.makeProxyWrapper(readFileUri(xmlFile));
        this._proxy = new powerManagerProxy(Gio.DBus.system, BUS_NAME, OBJECT_PATH, (proxy, error) => {
            if (error) {
                log(error.message);
            } else {
                this._proxyId = this._proxy.connect('g-properties-changed', () => {
                    const batteryLevel = this._proxy.Percentage;
                    if (this._batteryLevel !== batteryLevel) {
                        this._batteryLevel = batteryLevel;
                        if (this._batteryMonitoringInitialized)
                            this._forceDischarge();
                    }
                });
            }
        });
    }

    _disableBatteryCapacityMonitoring() {
        this._disableForceDischarge();
        if (this._proxy)
            this._proxy.disconnect(this._proxyId);
        this._proxyId = null;
        this._proxy = null;
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;
        this._disableBatteryCapacityMonitoring();
        this._settings.disconnectObject(this);
    }
});

