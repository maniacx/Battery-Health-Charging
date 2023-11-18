'use strict';
const {GLib} = imports.gi;
const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Notifier = Me.imports.lib.notifier;
const Helper = Me.imports.lib.helper;
const DeviceList = Me.imports.lib.deviceList;
const {execCheck} = Helper;

const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);

const TPanel = shellVersion > 42 ? Me.imports.lib.thresholdPanel : Me.imports.lib.thresholdPanel42;

var IntializeDriver = class {
    constructor(settings, extensionObject) {
        this._extensionObject = extensionObject;
        this._settings = settings;
        this._dir = extensionObject.dir;
        this._currentDevice = null;
        this._thresholdPanel = null;
        this._installationCheckCompleted = false;
        this._notifier = new Notifier.Notify(settings, extensionObject);

        this._settings.connectObject(
            'changed::polkit-status', (_settings = this._settings) => {
                if (this._installationCheckCompleted) {
                    const installType = _settings.get_string('polkit-status');
                    if (installType === 'not-installed' || installType === 'need-update') {
                        this._disableUI();
                    } else if (installType === 'installed') {
                        this._disableUI();
                        this._checkCompatibility();
                    }
                }
            },
            this
        );
        this._checkCompatibility();
    }

    async _checkInstallation() {
        const user = GLib.get_user_name();
        const ctlPath = GLib.find_program_in_path(`batteryhealthchargingctl-${user}`);

        if (ctlPath === null) {
            this._settings.set_string('polkit-status', 'not-installed');
            return 2;       // Polkit not installed
        }
        this._settings.set_string('ctl-path', ctlPath);
        const resourceDir = this._dir.get_child('resources').get_path();
        const argv = ['pkexec', ctlPath, 'CHECKINSTALLATION', resourceDir, user];
        const [status] = await execCheck(argv);
        if (status === 1) {
            this._settings.set_string('polkit-status', 'need-update');
            return 1;       // Polkit Needs Update
        }
        this._settings.set_string('polkit-status', 'installed');
        return 0;       // Polkit is installed
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
            const installStatus = await this._checkInstallation(); // installStatus: 0 = Installed, 1 = NeedUpdate, 2 = Not-installed
            this._installationCheckCompleted = true;
            if (installStatus === 1) {
                this._notifier.notifyNeedPolkitUpdate();
                return;
            } else if (installStatus === 2) {
                this._notifier.notifyNoPolkitInstalled();
                return;
            }
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

    _disableUI() {
        if (this._thresholdPanel)
            this._thresholdPanel.destroy();
        this._thresholdPanel = null;
        if (this._currentDevice)
            this._currentDevice.destroy();
        this._currentDevice = null;
    }

    destroy() {
        this._disableUI();
        if (this._notifier)
            this._notifier.destroy();
        this._notifier = null;
        this._settings.disconnectObject(this);
        this._settings = null;
    }
}

