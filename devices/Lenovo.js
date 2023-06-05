'use strict';
/* Lenovo Ideapad Laptops */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const LENOVO_PATH = '/sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/conservation_mode';

var LenovoSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class LenovoSingleBattery extends GObject.Object {
    name = 'Lenovo non-thinkpad';
    type = 12;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = false;
    deviceHaveBalancedMode = false;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
    deviceUsesModeNotValue = true;

    isAvailable() {
        if (!fileExists(LENOVO_PATH))
            return false;
        ExtensionUtils.getSettings().set_int('icon-style-type', 0);
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let conservationMode;
        if (chargingMode === 'ful')
            conservationMode = 0;
        else if (chargingMode === 'max')
            conservationMode = 1;
        if (readFileInt(LENOVO_PATH) === conservationMode) {
            this.mode = chargingMode;
            this.emit('threshold-applied', true);
            return 0;
        }
        const status = await runCommandCtl('LENOVO', `${conservationMode}`, null, false);
        if (status === 0) {
            if (readFileInt(LENOVO_PATH) === conservationMode) {
                this.mode = chargingMode;
                this.emit('threshold-applied', true);
                return 0;
            }
        }
        this.emit('threshold-applied', false);
        return status;
    }

    destroy() {
        // Nothing to destroy for this device
    }
});

