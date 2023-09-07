'use strict';
/* Acer Laptops using dkms https://github.com/frederik-h/acer-wmi-battery/issues */
const {GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const ACER_PATH = '/sys/bus/wmi/drivers/acer-wmi-battery/health_mode';

var AcerSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class AcerSingleBattery extends GObject.Object {
    name = 'Acer';
    type = 17;
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
        if (!fileExists(ACER_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._status = 0;
        this._chargingMode = chargingMode;
        if (this._chargingMode === 'ful')
            this._healthMode = 0;
        else if (this._chargingMode === 'max')
            this._healthMode = 1;
        if (this._verifyThreshold())
            return this._status;
        this._status = await runCommandCtl('ACER', `${this._healthMode}`, null, false);
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
        const endLimitValue = readFileInt(ACER_PATH);
        if (this._healthMode === endLimitValue) {
            if (endLimitValue === 1)
                this.endLimitValue = 80;
            else
                this.endLimitValue = 100;
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

