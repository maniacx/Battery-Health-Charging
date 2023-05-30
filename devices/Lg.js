'use strict';
/* LG Laptops */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const LG_PATH = '/sys/devices/platform/lg-laptop/battery_care_limit';

var LgSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class LgSingleBattery extends GObject.Object {
    name = 'LG';
    type = 5;
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
        if (!fileExists(LG_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let batteryCareLimit;
        if (chargingMode === 'ful')
            batteryCareLimit = 100;
        else if (chargingMode === 'max')
            batteryCareLimit = 80;
        if (readFileInt(LG_PATH) === batteryCareLimit) {
            this.endLimitValue = batteryCareLimit;
            this.emit('threshold-applied', true);
            return 0;
        }
        let status = await runCommandCtl('LG', `${batteryCareLimit}`, null, false);
        if (status === 0)  {
            this.endLimitValue = readFileInt(LG_PATH);
            if (batteryCareLimit === this.endLimitValue) {
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

