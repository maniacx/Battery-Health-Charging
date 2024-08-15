'use strict';
/* Framework Laptops using dkms  https://github.com/DHowett/framework-laptop-kmod */
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as Helper from '../lib/helper.js';

const {fileExists, readFileInt,readFile, runCommandCtl} = Helper;

const VENDOR_FRAMEWORK = '/sys/devices/platform/framework_laptop';
const BAT1_END_PATH = '/sys/class/power_supply/BAT1/charge_control_end_threshold';


export const FrameworkSingleBatteryBAT1 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class FrameworkSingleBatteryBAT1 extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Framework';
        this.type = 31;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = false;
        this.deviceHaveStartThreshold = false;
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
        this.incrementsStep = 1;
        this.incrementsPage = 5;

        this._settings = settings;
    }

    isAvailable() {
        // check if framework_tool is installed and check if is framework laptop
        if (fileExists("/usr/bin/framework_tool") && readFile('/sys/devices/virtual/dmi/id/sys_vendor').includes("Framework"))
            return true;
        if (!fileExists(VENDOR_FRAMEWORK))
            return false;
        if (!fileExists(BAT1_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._status = 0;
        const ctlPath = this._settings.get_string('ctl-path');
        this._endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
        
        if (await this._verifyThreshold())
            return this._status;

        //if framework tool exists, use it
        if(fileExists("/usr/bin/framework_tool"))
            [this._status] = await runCommandCtl(ctlPath, 'FRAMEWORK_TOOL_SET_END', `${this._endValue}`,null, null)
        else
            [this._status] = await runCommandCtl(ctlPath, 'BAT1_END', `${this._endValue}`, null, null);


        if (this._status === 0) {
            if (await this._verifyThreshold())
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

    async _verifyThreshold() {

        //if framework tool exists, use it
        if(fileExists("/usr/bin/framework_tool"))
        {
            const ctlPath = this._settings.get_string('ctl-path');

            this._stdout = "";
            [this._status,this._stdout] = await runCommandCtl(ctlPath, 'FRAMEWORK_TOOL_GET_END', null,null, null)
            if(this._status === 0)
                this.endLimitValue = parseInt(this._stdout.split(" ")[3].slice(0,-1));
            else
                return false;

        }
        else
            this.endLimitValue = readFileInt(BAT1_END_PATH);
        
        if (this._endValue === this.endLimitValue) {
            this.emit('threshold-applied', 'success');
            return true;
        }
        return false;
    }


    async _reVerifyThreshold() {
        if (this._status === 0) {
            if (await this._verifyThreshold())
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

