'use strict';
const {Clutter, Gio, GLib, GObject, St} = imports.gi;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const QuickSettings = imports.ui.quickSettings;
const QuickSettingsMenu = imports.ui.main.panel.statusArea.quickSettings;
const Config = imports.misc.config;
const Util = imports.misc.util;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Driver = Me.imports.lib.driver;
const Notify = Me.imports.lib.notifier;

const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;

const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);
const shellVersion44 = shellVersion >= 44;

const ICONS_FOLDER = Me.dir.get_child('icons').get_path();
let delayPanelId = null;
let delayIndicatorId = null;

function getIcon(iconName) {
    return Gio.icon_new_for_string(`${ICONS_FOLDER}/${iconName}.svg`);
}

const ChargeLimitToggle = GObject.registerClass(
    class ChargeLimitToggle extends QuickSettings.QuickMenuToggle {
        _init() {
            super._init();
            this._settings = ExtensionUtils.getSettings();
            this._type = this._settings.get_int('device-type');

            this._deviceHaveDualBattery = Driver.deviceInfo[this._type][1] === '1';       // laptop has dual battery
            this._deviceHaveStartThreshold = Driver.deviceInfo[this._type][0] === '1';    // laptop has start threshold
            this._deviceHaveBalanceMode = Driver.deviceInfo[this._type][4] !== '-none-';   // laptop do not have balance mode

            this._chargeLimitSection = new PopupMenu.PopupMenuSection();

            this._batteryLabel = _('Battery');
            this._battery1Label = _('Battery 1');
            this._battery2Label = _('Battery 2');

            if (shellVersion44)
                this.title = this._batteryLabel;
            else
                this.label = this._batteryLabel;

            this.gicon = getIcon('charging-limit-sym-ful100-symbolic');
            this.menu.setHeader(getIcon('charging-limit-sym-ful100-symbolic'), _('Battery Charging Mode'));

            if (this._deviceHaveDualBattery) {
                if (shellVersion44)
                    this.title = this._battery1Label;
                else
                    this.label = this._battery1Label;
            } else {
                this._settings.set_boolean('show-battery-panel2', false);
            }

            // Add Extension Preference shortcut button icon
            this._preferencesButton = new St.Button({
                reactive: true,
                track_hover: true,
                can_focus: true,
                x_expand: true,
                y_align: Clutter.ActorAlign.CENTER,
                x_align: Clutter.ActorAlign.END,
                style_class: 'bhc-preferences-button',
            });
            this._preferencesButtonIcon = new St.Icon({
                gicon: getIcon('settings-symbolic'),
                icon_size: 16,
            });
            this._preferencesButton.child = this._preferencesButtonIcon;
            this.menu.addHeaderSuffix(this._preferencesButton);
            this._headerSpacer = this.menu.box.get_first_child().get_children()[4];
            this._headerSpacer.x_expand = false;


            this._preferencesButton.connectObject('clicked', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                Util.spawn(['gnome-extensions', 'prefs', Me.metadata.uuid]);
            });

            // Define Popup Menu
            this.menu.addMenuItem(this._chargeLimitSection);

            // Define Popup Menu for Full Capacity Mode
            this._menuItemFul = new PopupMenu.PopupImageMenuItem(_('Full Capacity Mode'), '');
            this._chargeLimitSection.addMenuItem(this._menuItemFul);

            // Define Popup Menu for Balance Mode
            if (this._deviceHaveBalanceMode) {
                this._menuItemBal = new PopupMenu.PopupImageMenuItem(_('Balanced Mode'), '');
                this._chargeLimitSection.addMenuItem(this._menuItemBal);
            }

            // Define Popup Menu for Maximum Life Span Mode
            this._menuItemMax = new PopupMenu.PopupImageMenuItem(_('Maximum Lifespan Mode'), '');
            this._chargeLimitSection.addMenuItem(this._menuItemMax);

            this._chargeLimitSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            // Define display Current Threshold Reading on sysfs
            this._currentLimitItem = new PopupMenu.PopupImageMenuItem('', '');
            this._chargeLimitSection.addMenuItem(this._currentLimitItem);
            this._currentLimitItem.sensitive = false;
            this._currentLimitItem.active = false;

            // update panel
            this._iconType = 'sym';
            this._notify = 0;                       // Notifcations 0-Dont notify, 1-notifyThreshold1, 2-notifyThreshold2
            this._updateIconStyle();                // update icon style
            this._updatePrefButtonVisibilty();      // Update Extension Pref Button Visibility
            this._updatePanelMenu();                // Update Panel items
            this._updateLabelAndHeaderSubtitle();   // Update lable and Header Subtitle

            // Observe changes to update Panel
            this._settings.connectObject(
                'changed::charging-mode', () => {
                    this._notify = 1;
                    this._updatePanelMenuWithDelay();
                },
                'changed::icon-style-type', () => {
                    this._notify = 0;
                    this._updateIconStyle();
                    this._updatePanelMenu();
                },
                'changed::show-preferences', () => {
                    this._updatePrefButtonVisibilty();
                },
                'changed::show-quickmenu-subtitle', () => {
                    this._updateQuickToggleSubtitle();
                },
                'changed::default-threshold', () => {
                    if (this._settings.get_boolean('default-threshold')) {
                        this._notify = 1;
                        this._updatePanelMenuWithDelay();
                    }
                },
                'changed::dummy-apply-threshold', () => {
                    this._notify = 1;
                    this._updateIconStyle();
                    this._updatePanelMenuWithDelay();
                },
                this
            );

            if (this._deviceHaveDualBattery) {
                this._settings.bind(
                    'show-battery-panel2',
                    this,
                    'checked',
                    Gio.SettingsBindFlags.DEFAULT);

                this.connectObject(
                    'clicked', () => {
                        this.checked = !this.checked;
                    },
                    this
                );

                this._settings.connectObject(
                    'changed::charging-mode2', () => {
                        this._notify = 2;
                        this._updatePanelMenuWithDelay();
                    },
                    'changed::show-battery-panel2', () => {
                        this._notify = 0;
                        this._updatePanelMenu();
                        this._updateLabelAndHeaderSubtitle();
                    },
                    'changed::default-threshold2', () => {
                        if (this._settings.get_boolean('default-threshold2')) {
                            this._notify = 2;
                            this._updatePanelMenuWithDelay();
                        }
                    },
                    'changed::dummy-apply-threshold2', () => {
                        this._notify = 2;
                        this._updateIconStyle();
                        this._updatePanelMenuWithDelay();
                    },
                    this
                );
            }

            this._menuItemFul.connectObject('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                if (this._settings.get_boolean('show-battery-panel2')) {
                    Driver.setThresholdLimit2('ful');
                    this._settings.set_string('charging-mode2', 'ful');
                } else {
                    Driver.setThresholdLimit('ful');
                    this._settings.set_string('charging-mode', 'ful');
                }
            }, this);
            if (this._deviceHaveBalanceMode) {
                this._menuItemBal.connectObject('activate', () => {
                    Main.overview.hide();
                    Main.panel.closeQuickSettings();
                    if (this._settings.get_boolean('show-battery-panel2')) {
                        Driver.setThresholdLimit2('bal');
                        this._settings.set_string('charging-mode2', 'bal');
                    } else {
                        Driver.setThresholdLimit('bal');
                        this._settings.set_string('charging-mode', 'bal');
                    }
                }, this);
            }
            this._menuItemMax.connectObject('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                if (this._settings.get_boolean('show-battery-panel2')) {
                    Driver.setThresholdLimit2('max');
                    this._settings.set_string('charging-mode2', 'max');
                } else {
                    Driver.setThresholdLimit('max');
                    this._settings.set_string('charging-mode', 'max');
                }
            }, this);
        }

        // Delayed updatePanelMenu for threshold to apply before reading from sysfs
        _updatePanelMenuWithDelay() {
            delayPanelId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
                this._updatePanelMenu();
                return GLib.SOURCE_REMOVE;
            });
        }

        // UpdatePanelMenu UI
        _updatePanelMenu() {
            // Display Panel for Battery 1 (false) or Battery 2 (true)
            this.switchPanelToBattery2 = this._settings.get_boolean('show-battery-panel2');

            // Read updated threshold values from sysfs and notify
            if (this._notify === 1) {
                this._currentEndLimitValue = Driver.getCurrentEndLimitValue();
                if (this._deviceHaveStartThreshold) {
                    this._currentStartLimitValue = Driver.getCurrentStartLimitValue();
                    Notify.notifyUpdateThreshold(this._currentEndLimitValue, this._currentStartLimitValue);
                } else {
                    Notify.notifyUpdateThreshold(this._currentEndLimitValue, 0);
                }
                if (this.switchPanelToBattery2)
                    return;
            }
            if (this._notify === 2) {
                this._currentEndLimitValue = Driver.getCurrentEndLimit2Value();
                if (this._deviceHaveStartThreshold) {
                    this._currentStartLimitValue = Driver.getCurrentStartLimit2Value();
                    Notify.notifyUpdateThreshold2(this._currentEndLimitValue, this._currentStartLimitValue);
                } else {
                    Notify.notifyUpdateThreshold2(this._currentEndLimitValue, 0);
                }
                if (!this.switchPanelToBattery2)
                    return;
            }
            if (this._notify === 0) {
                this._currentEndLimitValue = this.switchPanelToBattery2 ? Driver.getCurrentEndLimit2Value()
                    : Driver.getCurrentEndLimitValue();
                if (this._deviceHaveStartThreshold) {
                    this._currentStartLimitValue = this.switchPanelToBattery2 ? Driver.getCurrentStartLimit2Value()
                        : Driver.getCurrentStartLimitValue();
                }
            }

            if (delayPanelId !== null) {
                GLib.Source.remove(delayPanelId);
                delayPanelId = null;
            }

            if (this.switchPanelToBattery2)
                this.currentModeSettings = this._settings.get_string('charging-mode2');
            else
                this.currentModeSettings = this._settings.get_string('charging-mode');

            // Update quickmenu toggle subtitle
            this._updateQuickToggleSubtitle();

            // Update quickToggleMenu icon and header icon
            let currentModeIcon = '';
            if (this.currentModeSettings === 'ful')
                currentModeIcon = Driver.deviceInfo[this._type][3]; // Get full capacity mode for type of laptop
            else if (this.currentModeSettings === 'bal')
                currentModeIcon = Driver.deviceInfo[this._type][4]; // Get balance mode for type of laptop
            else if (this.currentModeSettings === 'max')
                currentModeIcon = Driver.deviceInfo[this._type][5]; // Get maxlife mode for type of laptop

            const headerIconName = `charging-limit-${this._iconType}-${currentModeIcon}-symbolic`;
            this.gicon = getIcon(headerIconName);
            this.menu.setHeader(getIcon(headerIconName), _('Battery Charging Mode'), this._setHeaderSubtitle);

            // Set text for popup menu display current values
            let currentLimitValueString = '';
            if (this._deviceHaveStartThreshold) {
                currentLimitValueString = _('Device will stop charging at %d%%\nDevice will start charging at %d%%')
                    .format(this._currentEndLimitValue, this._currentStartLimitValue);
            } else {
                currentLimitValueString = _('Charging Limit is set to %d%%').format(this._currentEndLimitValue);
            }
            this._currentLimitItem.label.text = currentLimitValueString;


            // Display a dot (ornament) to highlight current mode
            this._menuItemFul.setOrnament(this.currentModeSettings === 'ful' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            if (this._deviceHaveBalanceMode)
                this._menuItemBal.setOrnament(this.currentModeSettings === 'bal' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            this._menuItemMax.setOrnament(this.currentModeSettings === 'max' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
        } // fi updatePanelMenu

        // Set Visibitly on extension pref button
        _updatePrefButtonVisibilty() {
            let prefButtonVisible = this._settings.get_boolean('show-preferences');
            this._preferencesButtonIcon.visible = prefButtonVisible;
            this._preferencesButton.visible = prefButtonVisible;
        }

        // Update quickmenu Label(Title) and Header subtitle
        _updateLabelAndHeaderSubtitle() {
            if (this._deviceHaveDualBattery) {
                if (this.switchPanelToBattery2) {
                    this._setHeaderSubtitle = this._battery2Label;
                    if (shellVersion44)
                        this.title = this._battery2Label;
                    else
                        this.label = this._battery2Label;
                } else {
                    this._setHeaderSubtitle = this._battery1Label;
                    if (shellVersion44)
                        this.title = this._battery1Label;
                    else
                        this.label = this._battery1Label;
                }
            } else  {
                this._setHeaderSubtitle = '';
                if (shellVersion44)
                    this.title = this._batteryLabel;
                else
                    this.label = this._batteryLabel;
            }
        }

        // Update quickmenu Label(Title) and Header subtitle
        _updateQuickToggleSubtitle() {
            if (shellVersion44 && this._settings.get_boolean('show-quickmenu-subtitle')) {
                if (this.currentModeSettings === 'ful')
                    this.subtitle = _('Full Capacity');
                else if (this.currentModeSettings === 'bal')
                    this.subtitle = _('Balanced');
                else if (this.currentModeSettings === 'max')
                    this.subtitle = _('Max Lifespan');
            } else {
                this.subtitle = null;
            }
        }

        // Update icon sytle for popupmenu
        _updateIconStyle() {
            const iconStyle = this._settings.get_int('icon-style-type');
            if (iconStyle === 1)
                this._iconType = 'mix';
            if (iconStyle === 2)
                this._iconType = 'num';

            // Set icons Popup Menu Modes
            this._menuItemFul.setIcon(getIcon(`charging-limit-${this._iconType}-${Driver.deviceInfo[this._type][3]}-symbolic`));
            if (this._deviceHaveBalanceMode)
                this._menuItemBal.setIcon(getIcon(`charging-limit-${this._iconType}-${Driver.deviceInfo[this._type][4]}-symbolic`));

            this._menuItemMax.setIcon(getIcon(`charging-limit-${this._iconType}-${Driver.deviceInfo[this._type][5]}-symbolic`));
        }
    }
);

var ThresholdPanel = GObject.registerClass(
    class ThresholdPanel extends QuickSettings.SystemIndicator {
        constructor() {
            super();
            this._settings = ExtensionUtils.getSettings();
            let installationCheckCompleted = false;
            let installationStatus = 0;

            if (shellVersion < 43) {
                Notify.notifyGnomeIncompatible();
                return;
            }

            // Observe changes (only after initialization) in install service and notify accordingly
            this._settings.connectObject(
                'changed::install-service', () => {
                    if (installationCheckCompleted) {
                        const installStatus = this._settings.get_int('install-service');
                        if ((installationStatus === 1) && (installStatus === 0)) {
                            Notify.notifyPolkitInstallationSuccessfull();
                            installationStatus = 0;
                        }
                        if ((installationStatus === 2) && (installStatus === 0)) {
                            Notify.notifyPolkitUpdateSuccessfull();
                            installationStatus = 0;
                        }
                        if ((installationStatus === 0) && (installStatus === 1)) {
                            Notify.notifyUnInstallationSuccessfull();
                            installationStatus = 1;
                        }
                    }
                },
                this
            );

            // Check for device compatibilty, notify and initialize driver
            Driver.checkInCompatibility().then(notifier => {
                switch (notifier) {
                    case 0:
                        installationCheckCompleted = true;
                        break;
                    case 1:
                        Notify.notifyUnsupportedDevice();
                        return;
                    case 2:
                        Notify.notifyRemoveOutdatedFiles();
                        return;
                    case 3:
                        Notify.notifyNeedPolkitUpdate();// 2
                        installationStatus = 2;
                        installationCheckCompleted = true;
                        return;
                    case 4:
                        Notify.notifyNoPolkitInstalled();// 1
                        installationStatus = 1;
                        installationCheckCompleted = true;
                        return;
                }

                // Delayed start indicator for threshold to apply before reading from sysfs
                delayIndicatorId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
                    this._startIndicator();
                    return GLib.SOURCE_REMOVE;
                });
            });
        }

        _startIndicator() {
            this._indicator = this._addIndicator();
            this._indicator.gicon = getIcon('charging-limit-sym-ful100-symbolic');
            this.quickSettingsItems.push(new ChargeLimitToggle());

            QuickSettingsMenu._indicators.insert_child_at_index(this, 0);
            QuickSettingsMenu._addItems(this.quickSettingsItems);
            this._updateIndicator();

            // Observe for changes to update indicator
            this._settings.connectObject(
                'changed::charging-mode', () => {
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
            if (Driver.deviceInfo[this._type][1] === '1') {         // if laptop is dual battery
                this._settings.connectObject(
                    'changed::charging-mode2', () => {
                        this._updateIndicator();
                    },
                    'changed::show-battery-panel2', () => {
                        this._updateIndicator();
                    },
                    this
                );
            }
            if (delayIndicatorId !== null) {
                GLib.Source.remove(delayIndicatorId);
                delayIndicatorId = null;
            }
        }

        // start updating indicator icon
        _updateIndicator() {
            if (this._settings.get_boolean('show-system-indicator')) {    // if show indicator enabled
                this._indicator.visible = true;
                this._type = this._settings.get_int('device-type');

                const iconStyle = this._settings.get_int('icon-style-type');
                this._iconType = 'sym';
                if (iconStyle === 1)
                    this._iconType = 'mix';
                if (iconStyle === 2)
                    this._iconType = 'num';

                if (this._settings.get_boolean('show-battery-panel2'))  // Display indicator for Battery 1 (false) or Battery 2 (true)
                    this.currentModeSettings = this._settings.get_string('charging-mode2');
                else
                    this.currentModeSettings = this._settings.get_string('charging-mode');

                let currentModeIcon = '';
                if (this.currentModeSettings === 'ful')
                    currentModeIcon = Driver.deviceInfo[this._type][3];
                else if (this.currentModeSettings === 'bal')
                    currentModeIcon = Driver.deviceInfo[this._type][4];
                else if (this.currentModeSettings === 'max')
                    currentModeIcon = Driver.deviceInfo[this._type][5];

                this._indicator.gicon = getIcon(`charging-limit-${this._iconType}-${currentModeIcon}-symbolic`);
            } else {    // else show indicator enabled
                this._indicator.visible = false;
            }    // fi show indicator enabled
        }

        destroy() {
            this._settings.disconnectObject(this);
            this.quickSettingsItems.forEach(item => item.destroy());
            if (delayPanelId !== null) {
                GLib.Source.remove(delayPanelId);
                delayPanelId = null;
            }
            if (delayIndicatorId !== null) {
                GLib.Source.remove(delayIndicatorId);
                delayIndicatorId = null;
            }
            Notify.removeActiveNofications();
            this._settings = null;
            this._indicator = null;
            this.run_dispose();
        }
    }

);
