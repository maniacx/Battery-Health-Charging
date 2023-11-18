'use strict';
import GLib from 'gi://GLib';
import * as DeviceList from './deviceList.js';
import * as Helper from './helper.js';
import * as Notifier from './notifier.js';
import * as TPanel from './thresholdPanel.js';
import * as PolkitErrorIndicator from './polkitErrorIndicator.js';

const {execCheck} = Helper;

export class IntializeDriver {
    constructor(settings, extensionObject) {
        this._extensionObject = extensionObject;
        this._settings = settings;
        this._dir = extensionObject.dir;
        this._currentDevice = null;
        this._thresholdPanel = null;
        this._notifier = new Notifier.Notify(settings, extensionObject);
        this._checkCompatibility();
    }

    _monitorPolkitStatusSetting(enable) {
        if (enable) {
            this._settings.connectObject(
                'changed::polkit-status', (_settings = this._settings) => {
                    const installType = _settings.get_string('polkit-status');
                    if (installType === 'not-installed' || installType === 'need-update') {
                        this._disableUI();
                        this._enablePolkitErrorIndicator();
                    } else if (installType === 'installed') {
                        this._disablePolkitErrorIndicator();
                        this._disableUI();
                        this._checkCompatibility();
                    }
                },
                this
            );
        } else {
            this._settings.disconnectObject(this);
        }
    }

    async _checkInstallation() {
        const user = GLib.get_user_name();
        const ctlPath = GLib.find_program_in_path(`batteryhealthchargingctl-${user}`);

        if (ctlPath === null)
            return 'not-installed';     // Polkit not installed

        this._settings.set_string('ctl-path', ctlPath);
        const resourceDir = this._dir.get_child('resources').get_path();
        const argv = ['pkexec', ctlPath, 'CHECKINSTALLATION', resourceDir, user];
        const [status] = await execCheck(argv);
        if (status === 1)
            return 'need-update';       // Polkit Needs Update

        return 'installed';             // Polkit is installed
    }

    _getCurrentDevice() {
        let device = null;
        if (this._currentDevice)
            return true;

        const type = this._settings.get_int('device-type');
        if (type !== 0) {
            device = new DeviceList.deviceArray[type - 1](this._settings);
            if (device.type === type) {
                if (device.isAvailable()) {
                    this._currentDevice = device;
                    return true;
                } else {
                    this._settings.set_int('device-type', 0); // Reset device and check again.
                    this._settings.set_string('charging-mode', 'ful');
                }
            }
        }

        device = null;
        DeviceList.deviceArray.some(item => {
            device = new item(this._settings);
            if (device.isAvailable()) {
                this._currentDevice = device;
                this._settings.set_int('device-type', this._currentDevice.type);
                return true;
            } else {
                return false;
            }
        });

        if (this._currentDevice) {
            log(`Battery Health Extension: Supported device found = ${this._currentDevice.name}`);
            return true;
        }
        return false;
    }

    async _checkCompatibility() {
        if (this._getCurrentDevice() === false) {
            this._notifier.notifyUnsupportedDevice();
            return;
        }

        if (this._currentDevice.deviceNeedRootPermission) {
            this._monitorPolkitStatusSetting(false);
            const installStatus = await this._checkInstallation();
            this._settings.set_string('polkit-status', installStatus);
            this._monitorPolkitStatusSetting(true);
            if (installStatus === 'need-update') {
                this._enablePolkitErrorIndicator();
                this._notifier.notifyNeedPolkitUpdate();
                return;
            } else if (installStatus === 'not-installed') {
                this._enablePolkitErrorIndicator();
                this._notifier.notifyNoPolkitInstalled();
                return;
            }
            this._disablePolkitErrorIndicator();
        }

        let status;
        if (this._currentDevice.deviceHaveDualBattery)
            status = await this._currentDevice.setThresholdLimitDual();
        else
            status = await this._currentDevice.setThresholdLimit(this._settings.get_string('charging-mode'));
        if (status !== 0) {
            this._notifier.notifyAnErrorOccured(this._currentDevice.name);
            return;
        }
        this._thresholdPanel = new TPanel.ThresholdPanel(this._settings, this._extensionObject, this._currentDevice, this._notifier);
    }

    _enablePolkitErrorIndicator() {
        if (!this._polkitErrorIndicator)
            this._polkitErrorIndicator = new PolkitErrorIndicator.PolkitErrorIndicator(this._dir);
    }

    _disablePolkitErrorIndicator() {
        if (this._polkitErrorIndicator)
            this._polkitErrorIndicator.destroy();
        this._polkitErrorIndicator = null;
    }

    _disableUI() {
        if (this._thresholdPanel)
            this._thresholdPanel.destroy();
        this._thresholdPanel = null;
        if (this._currentDevice)
            this._currentDevice.destroy();
        this._currentDevice = null;
    }

    destroy() {
        this._disablePolkitErrorIndicator();
        this._disableUI();
        if (this._notifier)
            this._notifier.destroy();
        this._notifier = null;
        this._settings.disconnectObject(this);
        this._settings = null;
    }
}

