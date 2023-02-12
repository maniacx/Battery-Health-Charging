'use strict';

const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const SystemActions = imports.misc.systemActions;
const Util = imports.misc.util;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;

function notify(msg, action = '') {
    let systemActions = new SystemActions.getDefault();
    let notifyTitle, notifyIcon;
    if (action === 'installed') {
        notifyTitle = _('Battery Health Charging');
        notifyIcon =  'system-reboot-symbolic';
    } else if (action === 'uninstalled') {
        notifyTitle = _('Battery Health Charging');
        notifyIcon = 'success-symbolic';
    } else if (action === 'update') {
        notifyTitle = _('Battery Health Charging');
        notifyIcon = 'battery-level-100-charged-symbolic';
    } else {
        notifyTitle = _('Battery Health Charging Gnome Extension Error');
        notifyIcon = 'mail-mark-junk-symbolic';
    }
    let source = new MessageTray.Source(Me.metadata.name, notifyIcon);
    Main.messageTray.add(source);

    let notification = new MessageTray.Notification(source, notifyTitle, msg);
    notification.setUrgency(3);
    notification.setTransient(true);
    if (action === 'installed') {
        notification.addAction(_('Log Out'), () => {
            systemActions.activateLogout();
        });
    } else if ((action === 'uninstalled') || (action === 'update')) {
        notification.setUrgency(1);
    } else if (action === 'show-settings') {
        notification.addAction(_('Settings'), () => {
            Util.spawn(['gnome-extensions', 'prefs', Me.metadata.uuid]);
        });
    }
    source.showNotification(notification);
}
