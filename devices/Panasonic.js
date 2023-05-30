'use strict';
/* Panasonic Laptops. */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const PANASONIC_PATH = '/sys/devices/platform/panasonic/eco_mode';

var PanasonicSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class PanasonicSingleBattery extends GObject.Object {
    name = 'Panasonic';
    type = 23;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = false;
    deviceHaveBalancedMode = false;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
    deviceUsesModeNotValue = true;

    isAvailable() {
        if (!fileExists(PANASONIC_PATH))
            return false;
        ExtensionUtils.getSettings().set_int('icon-style-type', 0);
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let ecoMode;
        if (chargingMode === 'ful')
            ecoMode = 0;
        else if (chargingMode === 'max')
            ecoMode = 1;
        if (readFileInt(PANASONIC_PATH) === ecoMode) {
            this.mode = chargingMode;
            this.emit('threshold-applied', true);
            return 0;
        }
        let status = await runCommandCtl('PANASONIC', `${ecoMode}`, null, false);
        if (status === 0)  {
            if (readFileInt(PANASONIC_PATH) === ecoMode) {
                this.mode = chargingMode;
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

