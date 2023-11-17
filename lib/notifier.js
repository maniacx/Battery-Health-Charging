'use strict';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import * as SystemActions from 'resource:///org/gnome/shell/misc/systemActions.js';
import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

const NotificationDestroyedReason = MessageTray.NotificationDestroyedReason;
const Urgency = MessageTray.Urgency;

export class Notify {
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
        let notifyIcon = 'battery-level-100-charged-symbolic';
        let notifyTitle = _('Battery Health Charging');
        let urgency = Urgency.NORMAL;

        if ((action === 'error') || (action === 'show-settings')) {
            urgency = Urgency.CRITICAL;
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

        if (action === 'show-settings') {
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
        this._notify(_('Installation Successful.'));
    }

    notifyPolkitUpdateSuccessful() {
        this._notify(_('Installation Successful.'));
    }

    notifyUnInstallationSuccessful() {
        this._notify(_('Uninstallation Successful.'));
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

    notifyThresholdPasswordRequired() {
        this._notify(_('Apply correct Bios Password to set threshold.'), 'show-settings');
    }

    notifyUpdateThresholdBat1(endThresholdValue, startThresholdValue) {
        this._notify(_('Battery 1\nCharge thresholds are set to %d / %d %%')
                    .format(endThresholdValue, startThresholdValue));
    }

    notifyUpdateThreshold(endThresholdValue, startThresholdValue) {
        this._notify(_('Charge thresholds are set to %d / %d %%')
                    .format(endThresholdValue, startThresholdValue));
    }

    notifyUpdateLimitBat1(limitValue) {
        this._notify(_('Battery 1\nCharging Limit is set to %d%%').format(limitValue));
    }

    notifyUpdateLimit(limitValue) {
        this._notify(_('Charging Limit is set to %d%%').format(limitValue));
    }

    notifyUpdateThresholdBat2(endThresholdValue, startThresholdValue) {
        this._notify(_('Battery 2\nCharge thresholds are set to %d / %d %%')
                .format(endThresholdValue, startThresholdValue));
    }

    notifyUpdateLimitBat2(limitValue) {
        this._notify(_('Battery 2\nCharging Limit is set to %d%%')
                .format(limitValue));
    }

    notifyUpdateModeFul() {
        this._notify(_('Charging Mode is set to Full Capacity'));
    }

    notifyUpdateModeBal() {
        this._notify(_('Charging Mode is set to Balanced'));
    }

    notifyUpdateModeMax() {
        this._notify(_('Charging Mode is set to Maximum Lifespan'));
    }

    notifyUpdateModeExp() {
        this._notify(_('Charging Mode is set to Express'));
    }

    notifyUpdateModeAdv() {
        this._notify(_('Charging Mode is set to Adaptive'));
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
