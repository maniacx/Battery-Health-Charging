'use strict';
/* Toshiba Laptops */
const {Gio, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, readFileUri, runCommandCtl} = Helper;

const VENDOR_TOSHIBA = '/sys/module/toshiba_acpi';
const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
const BAT1_END_PATH = '/sys/class/power_supply/BAT1/charge_control_end_threshold';
const BAT0_CAPACITY_PATH = '/sys/class/power_supply/BAT0/capacity';
const BAT1_CAPACITY_PATH = '/sys/class/power_supply/BAT1/capacity';

const BUS_NAME = 'org.freedesktop.UPower';
const OBJECT_PATH = '/org/freedesktop/UPower/devices/DisplayDevice';

var ToshibaSingleBatteryBAT0 = GObject.registerClass({
    Signals: {
        'threshold-applied': {param_types: [GObject.TYPE_STRING]},
        'battery-level-changed': {},
    },
}, class ToshibaSingleBatteryBAT0 extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Toshiba BAT0';
        this.type = 9;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = false;
        this.deviceHaveStartThreshold = false;
        this.deviceHaveVariableThreshold = false;
        this.deviceHaveBalancedMode = false;
        this.deviceHaveAdaptiveMode = false;
        this.deviceHaveExpressMode = false;
        this.deviceUsesModeNotValue = false;
        this.iconForFullCapMode = '100';
        this.iconForMaxLifeMode = '080';
        this.dischargeBeforeSet = 80;

        this._settings = settings;
    }

    isAvailable() {
        if (!fileExists(VENDOR_TOSHIBA))
            return false;
        if (!fileExists(BAT0_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        const ctlPath = this._settings.get_string('ctl-path');
        let endValue;
        if (chargingMode === 'ful')
            endValue = 100;
        else if (chargingMode === 'max')
            endValue = 80;
        const [status] = await runCommandCtl(ctlPath, 'BAT0_END', `${endValue}`, null, null);
        if (status === 0) {
            this.endLimitValue = endValue;
            this.emit('threshold-applied', 'success');
            return 0;
        }
        this.emit('threshold-applied', 'failed');
        return 1;
    }

    initializeBatteryMonitoring() {
        const xmlFile = 'resource:///org/gnome/shell/dbus-interfaces/org.freedesktop.UPower.Device.xml';
        const powerManagerProxy = Gio.DBusProxy.makeProxyWrapper(readFileUri(xmlFile));
        this._proxy = new powerManagerProxy(Gio.DBus.system, BUS_NAME, OBJECT_PATH,
            (proxy, error) => {
                if (error) {
                    log(error.message);
                } else {
                    this._proxyId = this._proxy.connect('g-properties-changed', () => {
                        const batteryLevel = this._proxy.Percentage;
                        if (this.batteryLevel !== batteryLevel) {
                            this.batteryLevel = batteryLevel;
                            this.emit('battery-level-changed');
                        }
                    });
                }
            });

        this.batteryLevel = readFileInt(BAT0_CAPACITY_PATH);
        this.emit('battery-level-changed');
    }

    destroy() {
        if (this._proxy)
            this._proxy.disconnect(this._proxyId);
        this._proxyId = null;
        this._proxy = null;
    }
});

var ToshibaSingleBatteryBAT1 = GObject.registerClass({
    Signals: {
        'threshold-applied': {param_types: [GObject.TYPE_STRING]},
        'battery-level-changed': {},
    },
}, class ToshibaSingleBatteryBAT1 extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Toshiba BAT1';
        this.type = 10;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = false;
        this.deviceHaveStartThreshold = false;
        this.deviceHaveVariableThreshold = false;
        this.deviceHaveBalancedMode = false;
        this.deviceHaveAdaptiveMode = false;
        this.deviceHaveExpressMode = false;
        this.deviceUsesModeNotValue = false;
        this.iconForFullCapMode = '100';
        this.iconForMaxLifeMode = '080';
        this.dischargeBeforeSet = 80;

        this._settings = settings;
    }

    isAvailable() {
        if (!fileExists(VENDOR_TOSHIBA))
            return false;
        if (!fileExists(BAT1_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        const ctlPath = this._settings.get_string('ctl-path');
        let endValue;
        if (chargingMode === 'ful')
            endValue = 100;
        else if (chargingMode === 'max')
            endValue = 80;
        const [status] = await runCommandCtl(ctlPath, 'BAT1_END', `${endValue}`, null, null);
        if (status === 0) {
            this.endLimitValue = endValue;
            this.emit('threshold-applied', 'success');
            return 0;
        }
        this.emit('threshold-applied', 'failed');
        return 1;
    }

    initializeBatteryMonitoring() {
        const xmlFile = 'resource:///org/gnome/shell/dbus-interfaces/org.freedesktop.UPower.Device.xml';
        const powerManagerProxy = Gio.DBusProxy.makeProxyWrapper(readFileUri(xmlFile));
        this._proxy = new powerManagerProxy(Gio.DBus.system, BUS_NAME, OBJECT_PATH,
            (proxy, error) => {
                if (error) {
                    log(error.message);
                } else {
                    this._proxyId = this._proxy.connect('g-properties-changed', () => {
                        const batteryLevel = this._proxy.Percentage;
                        if (this.batteryLevel !== batteryLevel) {
                            this.batteryLevel = batteryLevel;
                            this.emit('battery-level-changed');
                        }
                    });
                }
            });

        this.batteryLevel = readFileInt(BAT1_CAPACITY_PATH);
        this.emit('battery-level-changed');
    }

    destroy() {
        if (this._proxy)
            this._proxy.disconnect(this._proxyId);
        this._proxyId = null;
        this._proxy = null;
    }
});


