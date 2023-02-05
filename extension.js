'use strict';

const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const SystemActions = imports.misc.systemActions;
const Util = imports.misc.util;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const QuickSettings = imports.ui.quickSettings;
const QuickSettingsMenu = imports.ui.main.panel.statusArea.quickSettings;
const Driver = Me.imports.driver;
const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;

const ICONS_FOLDER = Me.dir.get_child('icons').get_path();

/**
 * Get icon
 *
 * @param {string} iconName Icon name
 * @returns {Gio.Icon}
 */
function getIcon(iconName) {
    return Gio.icon_new_for_string(`${ICONS_FOLDER}/${iconName}.svg`);
}

const SystemMenuToggle = GObject.registerClass(
    class SystemMenuToggle extends QuickSettings.QuickMenuToggle {
        _init() {
            super._init();
            this._settings = ExtensionUtils.getSettings();

            this._chargeLimitSection = new PopupMenu.PopupMenuSection();
            this.menu.addMenuItem(this._chargeLimitSection);
            this.label = _('Charger Limit');
            this.gicon = getIcon('charging-limit-mix-100-symbolic');
            this.toggleMode = false;
            this.menu.setHeader(getIcon('charging-limit-mix-100-symbolic'), _('Battery Health Mode'));
            this._isChargeStartThresholdSupported = Driver.isChargeStartThresholdSupported();
            this._updatePanelMenu();

            this._settings.connectObject(
                'changed::charger-limit', () => {
                    this._updatePanelMenu();
                },
                'changed::icon-style-type', () => {
                    this._updatePanelMenu();
                },
                this
            );
        }

        _updatePanelMenu() {
            const iconStyle = this._settings.get_int('icon-style-type');
            let iconType = 'mix';
            let currentLimitValueString = _('Error');
            switch (iconStyle) {
            case 0:
                iconType = 'mix';
                break;
            case 1:
                iconType = 'sym';
                break;
            case 2:
                iconType = 'num';
                break;
            }

            this._chargeLimitSection.removeAll();
            let currentLimitValue = Driver.getCurrentEndLimitValue();
            let currentLimitSettings = this._settings.get_int('charger-limit');
            let menuItem100 = new PopupMenu.PopupImageMenuItem(_('Full Capacity Mode  (100%)'),
                getIcon(`charging-limit-${iconType}-100-symbolic`));
            let menuItem80 = new PopupMenu.PopupImageMenuItem(_('Balanced Mode  (80%)'),
                getIcon(`charging-limit-${iconType}-80-symbolic`));
            let menuItem60 = new PopupMenu.PopupImageMenuItem(_('Maximum Lifespan Mode  (60%)'),
                getIcon(`charging-limit-${iconType}-60-symbolic`));
            if (currentLimitValue === 100)
                currentLimitValueString = _('100');
            else if (currentLimitValue === 80)
                currentLimitValueString = _('80');
            else if (currentLimitValue === 60)
                currentLimitValueString = _('60');
            let currentLimitItem = new PopupMenu.PopupMenuItem(_('Charging Limit is set to ' + currentLimitValueString));
            currentLimitItem.sensitive = false;
            currentLimitItem.active = false;

            menuItem100.connect('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                Driver.setLimit('100', this._isChargeStartThresholdSupported);
                this._settings.set_int('charger-limit', 100);
            });
            menuItem80.connect('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                Driver.setLimit('80', this._isChargeStartThresholdSupported);
                this._settings.set_int('charger-limit', 80);
            });
            menuItem60.connect('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                Driver.setLimit('60', this._isChargeStartThresholdSupported);
                this._settings.set_int('charger-limit', 60);
            });

            this._chargeLimitSection.addMenuItem(menuItem100);
            this._chargeLimitSection.addMenuItem(menuItem80);
            this._chargeLimitSection.addMenuItem(menuItem60);
            this._chargeLimitSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this._chargeLimitSection.addMenuItem(currentLimitItem);
            this.gicon = getIcon(`charging-limit-${iconType}-${currentLimitSettings}-symbolic`);
            this.menu.setHeader(getIcon(`charging-limit-${iconType}-${currentLimitSettings}-symbolic`), _('Battery Health Mode'));

            menuItem100.setOrnament(currentLimitSettings === 100
                ? PopupMenu.Ornament.DOT
                : PopupMenu.Ornament.NONE);
            menuItem80.setOrnament(currentLimitSettings === 80
                ? PopupMenu.Ornament.DOT
                : PopupMenu.Ornament.NONE);
            menuItem60.setOrnament(currentLimitSettings === 60
                ? PopupMenu.Ornament.DOT
                : PopupMenu.Ornament.NONE);
        }
    }
);

var SystemMenu = GObject.registerClass(
    class SystemMenu extends QuickSettings.SystemIndicator {
        _init() {
            super._init();
            // indicator initialization
            this._settings = ExtensionUtils.getSettings();
            this._indicator = this._addIndicator();
            this._indicator.gicon = getIcon('charging-limit-mix-100-symbolic');

            this.quickSettingsItems.push(new SystemMenuToggle());

            this.connect('destroy', () => {
                this.quickSettingsItems.forEach(item => item.destroy());
            });

            QuickSettingsMenu._indicators.insert_child_at_index(this, 0);
            QuickSettingsMenu._addItems(this.quickSettingsItems);
            this._updateIndicator();

            this._settings.connectObject(
                'changed::charger-limit', () => {
                    this._updateIndicator();
                },
                'changed::icon-style-type', () => {
                    this._updateIndicator();
                },
                'changed::show-system-indicator', () => {
                    this._updateIndicator();
                },
                this
            );
        }

        _updateIndicator() {
            // Iconstyle for indicator
            const iconStyle = this._settings.get_int('icon-style-type');
            let iconType = 'mix';
            switch (iconStyle) {
            case 0:
                iconType = 'mix';
                break;
            case 1:
                iconType = 'sym';
                break;
            case 2:
                iconType = 'num';
                break;
            }
            let currentLimitSettings = this._settings.get_int('charger-limit');
            this._indicator.gicon = getIcon(`charging-limit-${iconType}-${currentLimitSettings}-symbolic`);
            if (this._settings.get_boolean('show-system-indicator'))
                this._indicator.visible = true;
            else
                this._indicator.visible = false;
        }
    }
);

class ChargeLimit {
    constructor() {
        this._indicator = null;
    }

    enable() {
        this._systemActions = new SystemActions.getDefault();
        this._settings = ExtensionUtils.getSettings();
        let flag = false;

        // on service installation/removal completion notify to logout
        this._settings.connectObject(
            'changed::install-service', () => {
                if (flag) {
                    if (this._settings.get_boolean('install-service'))
                        this.notify(_('Installation Successfull. Please save your work and logout.'), 'installed');
                    else
                        this.notify(_('Uninstallation Successfull.'), 'uninstalled');
                }
            },
            this
        );

        // Check for incompatibilities and notify errors
        switch (Driver.checkInCompatibility()) {
        case 0:
            flag = true;
            break;
        case 1:
            this.notify(_('Unsupported Gnome version.\nThis extension is compatible only with Gnome version 43 and above.'));
            return;
        case 2:
            this.notify(_('Unsupported device.\nCannot detect sysfs path : charge_control_end_threshold.'));
            return;
        case 3:
            this.notify(_('Battery Health service not installed.\n' +
                'Please install required service from Battery Health Charging extension settings under Install / Remove Service'), 'show-settings');
            flag = true;
            return;
        }

        this._isChargeStartThresholdSupported = Driver.isChargeStartThresholdSupported();

        // On enable restore the previously set charging limit value.
        let currentStartLimitValue = false;
        let currentEndLimitValue = Driver.getCurrentEndLimitValue();
        if (this._isChargeStartThresholdSupported)
            currentStartLimitValue = Driver.getCurrentStartLimitValue();

        let currentLimitSettings = this._settings.get_int('charger-limit');
        if (currentEndLimitValue !== currentLimitSettings) {
            Driver.setLimit(currentLimitSettings, this._isChargeStartThresholdSupported);
        } else if (this._isChargeStartThresholdSupported) {
            if ((currentStartLimitValue + 2) !==  currentLimitSettings)
                Driver.setLimit(currentLimitSettings, this._isChargeStartThresholdSupported);
        }
        this._indicator = new SystemMenu();
    }

    notify(msg, action = '') {
        let notifyTitle, notifyIcon;
        if (action === 'installed') {
            notifyTitle = _('Battery Health Charging');
            notifyIcon =  'system-reboot-symbolic';
        } else if (action === 'uninstalled') {
            notifyTitle = _('Battery Health Charging');
            notifyIcon = 'success-symbolic';
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
                this._systemActions.activateLogout();
            });
        } else if (action === 'uninstalled') {
            notification.setUrgency(2);
        } else if (action === 'show-settings') {
            notification.addAction(_('Settings'), () => {
                Util.spawn(['gnome-extensions', 'prefs', Me.metadata.uuid]);
            });
        }
        source.showNotification(notification);
    }

    disable() {
        this._settings.disconnectObject(this);
        if (this._indicator != null)
            this._indicator.destroy();
        this._settings = null;
        this._systemActions = null;
        this._indicator = null;
    }
}

/**
 * Init
 */
function init() {
    ExtensionUtils.initTranslations(Me.metadata.uuid);
    return new ChargeLimit();
}
