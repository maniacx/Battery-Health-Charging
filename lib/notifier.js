'use strict';
const {Gio, GLib} = imports.gi;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const SystemActions = imports.misc.systemActions;
const NotificationDestroyedReason = imports.ui.messageTray.NotificationDestroyedReason;
const Urgency = imports.ui.messageTray.Urgency;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;

var Notify = class {
    constructor(settings, extensionObject) {
        this._settings = settings;
        this._uuid = extensionObject.uuid;
        this._name = extensionObject.metadata.name;
        this._source = null;
    }

    _checkActiveNotification() {
        let status = false;
        const activeSource = Main.messageTray.getSources();
        if (activeSource[0] == null) {
            this._source = null;
        } else {
            activeSource.forEach(item => {
                if (item === this._source)
                    status = true;
            });
        }
        return status;
    }

    _notify(msg, action) {
        let notifyIcon;
        let notifyTitle = _('Battery Health Charging');
        let urgency = Urgency.CRITICAL;

        if (action === 'installed') {
            notifyIcon = 'system-reboot-symbolic';
        } else if (action === 'uninstalled') {
            notifyIcon = 'success-symbolic';
        } else if (action === 'update') {
            notifyIcon = 'battery-level-100-charged-symbolic';
        } else if ((action === 'error') || (action === 'show-settings')) {
            notifyTitle = _('Battery Health Charging Error');
            notifyIcon = 'dialog-warning-symbolic';
        }

        if (this._checkActiveNotification()) {
            this._source.destroy(NotificationDestroyedReason.REPLACED);
            this._source = null;
        }
        this._source = new MessageTray.Source(this._name, notifyIcon);
        Main.messageTray.add(this._source);
        const notification = new MessageTray.Notification(this._source, notifyTitle, msg);

        if (action === 'installed') {
            notification.addAction(_('Log Out'), () => {
                SystemActions.getDefault().activateLogout();
            });
        } else if ((action === 'uninstalled') || (action === 'update')) {
            urgency = Urgency.NORMAL;
        } else if (action === 'show-settings') {
            notification.addAction(_('Settings'), () => {
                this.openPreferences();
            });
        }
        notification.setUrgency(urgency);
        notification.setTransient(true);
        this._source.showNotification(notification);
    }

    notifyGnomeIncompatible() {
        this._notify(_('Unsupported Gnome version.\nThis extension is compatible only with Gnome version 42 and above.'), 'error');
    }

    notifyUnsupportedDevice() {
        this._notify(_('Unsupported device.\nThis extension is not compatible with your device.'), 'error');
    }

    notifyNoPolkitInstalled() {
        this._notify(_('Please install polkit from extension settings under Installation.'), 'show-settings');
    }

    notifyNeedPolkitUpdate() {
        this._notify(_('Please update polkit from extension settings under Installation.'), 'show-settings');
    }

    notifyPolkitInstallationSuccessful() {
        this._notify(_('Installation Successful. Please save your work and logout.'), 'installed');
    }

    notifyPolkitUpdateSuccessful() {
        this._notify(_('Installation Successful. Please save your work and logout.'), 'installed');
    }

    notifyUnInstallationSuccessful() {
        this._notify(_('Uninstallation Successful.'), 'uninstalled');
    }

    notifyAnErrorOccured(name) {
        if (this._settings.get_boolean('show-dell-option'))
            this._notify(_('Encountered an unexpected error. (%s)\nChoose correct dell package in extension settings.\nDisable and enable the extension').format(name), 'show-settings');
        else
            this._notify(_('Encountered an unexpected error. (%s)').format(name), 'error');
    }

    notifyThresholdNotUpdated(name) {
        if (this._settings.get_boolean('show-dell-option'))
            this._notify(_('Charging threshold not updated. (%s)\nChoose correct dell package in extension settings\nDisable and enable the extension').format(name), 'show-settings');
        else
            this._notify(_('Charging threshold not updated. (%s)').format(name), 'error');
    }

    notifyUpdateThresholdBat1(endThresholdValue, startThresholdValue) {
        this._notify(_('Battery 1\nCharge thresholds are set to %d / %d %%')
                    .format(endThresholdValue, startThresholdValue), 'update');
    }

    notifyUpdateThreshold(endThresholdValue, startThresholdValue) {
        this._notify(_('Charge thresholds are set to %d / %d %%')
                    .format(endThresholdValue, startThresholdValue), 'update');
    }

    notifyUpdateLimitBat1(limitValue) {
        this._notify(_('Battery 1\nCharging Limit is set to %d%%').format(limitValue), 'update');
    }

    notifyUpdateLimit(limitValue) {
        this._notify(_('Charging Limit is set to %d%%').format(limitValue), 'update');
    }

    notifyUpdateThresholdBat2(endThresholdValue, startThresholdValue) {
        this._notify(_('Battery 2\nCharge thresholds are set to %d / %d %%')
                .format(endThresholdValue, startThresholdValue), 'update');
    }

    notifyUpdateLimitBat2(limitValue) {
        this._notify(_('Battery 2\nCharging Limit is set to %d%%')
                .format(limitValue), 'update');
    }

    notifyUpdateModeFul() {
        this._notify(_('Charging Mode is set to Full Capacity'), 'update');
    }

    notifyUpdateModeBal() {
        this._notify(_('Charging Mode is set to Balanced'), 'update');
    }

    notifyUpdateModeMax() {
        this._notify(_('Charging Mode is set to Maximum Lifespan'), 'update');
    }

    notifyUpdateModeExp() {
        this._notify(_('Charging Mode is set to Express'), 'update');
    }

    notifyUpdateModeAdv() {
        this._notify(_('Charging Mode is set to Adaptive'), 'update');
    }

    async openPreferences() {
        try {
            await Gio.DBus.session.call(
                'org.gnome.Shell.Extensions',
                '/org/gnome/Shell/Extensions',
                'org.gnome.Shell.Extensions',
                'OpenExtensionPrefs',
                new GLib.Variant('(ssa{sv})', [this._uuid, '', {}]),
                null,
                Gio.DBusCallFlags.NONE,
                -1,
                null);
        } catch {
        // do nothing
        }
    }

    _removeActiveNofications() {
        if (this._checkActiveNotification())
            this._source.destroy(NotificationDestroyedReason.SOURCE_CLOSED);
        this._source = null;
    }

    destroy() {
        this._removeActiveNofications();
        this._settings = null;
    }
}
