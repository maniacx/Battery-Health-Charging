'use strict';
const {Clutter, Gio, GLib, GObject, St} = imports.gi;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const QuickSettings = imports.ui.quickSettings;
const QuickSettingsMenu = imports.ui.main.panel.statusArea.quickSettings;
const Config = imports.misc.config;
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

function getIcon(iconName) {
    return Gio.icon_new_for_string(`${ICONS_FOLDER}/${iconName}.svg`);
}

async function openPreferences() {
    try {
        await Gio.DBus.session.call(
            'org.gnome.Shell.Extensions',
            '/org/gnome/Shell/Extensions',
            'org.gnome.Shell.Extensions',
            'OpenExtensionPrefs',
            new GLib.Variant('(ssa{sv})', [Me.metadata.uuid, '', {}]),
            null,
            Gio.DBusCallFlags.NONE,
            -1,
            null);
    } catch {
        // do nothing
    }
}

const ChargeLimitToggle = GObject.registerClass(
    class ChargeLimitToggle extends QuickSettings.QuickMenuToggle {
        _init() {
            super._init();
            this._settings = ExtensionUtils.getSettings();
            this._currentDevice = Driver.currentDevice;
            this._chargeLimitSection = new PopupMenu.PopupMenuSection();

            // TRANSLATORS: Keep translation short if possible. Maximum  10 characters can be displayed here
            this._batteryLabel = _('Battery');
            // TRANSLATORS: Keep translation short if possible. Maximum  10 characters can be displayed here
            this._battery1Label = _('Battery 1');
            // TRANSLATORS: Keep translation short if possible. Maximum  10 characters can be displayed here
            this._battery2Label = _('Battery 2');

            if (shellVersion44)
                this.title = this._batteryLabel;
            else
                this.label = this._batteryLabel;

            this.gicon = getIcon('charging-limit-sym-ful100-symbolic');
            // TRANSLATORS: Keep translation short if possible. Maximum  21 characters can be displayed here
            this.menu.setHeader(getIcon('charging-limit-sym-ful100-symbolic'), _('Battery Charging Mode'));

            if (this._currentDevice.deviceHaveDualBattery) {
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

            // Define Popup Menu
            this.menu.addMenuItem(this._chargeLimitSection);

            // Define Popup Menu for Full Capacity Mode
            // TRANSLATORS: Keep translation short if possible. Maximum  34 characters can be displayed here
            this._menuItemFul = new PopupMenu.PopupImageMenuItem(_('Full Capacity Mode'), '');
            this._chargeLimitSection.addMenuItem(this._menuItemFul);

            // Define Popup Menu for Balance Mode
            if (this._currentDevice.deviceHaveBalancedMode) {
                // TRANSLATORS: Keep translation short if possible. Maximum  34 characters can be displayed here
                this._menuItemBal = new PopupMenu.PopupImageMenuItem(_('Balanced Mode'), '');
                this._chargeLimitSection.addMenuItem(this._menuItemBal);
            }

            // Define Popup Menu for Maximum Life Span Mode
            // TRANSLATORS: Keep translation short if possible. Maximum  34 characters can be displayed here
            this._menuItemMax = new PopupMenu.PopupImageMenuItem(_('Maximum Lifespan Mode'), '');
            this._chargeLimitSection.addMenuItem(this._menuItemMax);

            if (this._currentDevice.type === 21) { // Dell Device
                // TRANSLATORS: Keep translation short if possible. Maximum  34 characters can be displayed here
                this._menuItemAdv = new PopupMenu.PopupImageMenuItem(_('Adaptive Mode'), getIcon('charging-limit-sym-adv100-symbolic'));
                this._chargeLimitSection.addMenuItem(this._menuItemAdv);
                // TRANSLATORS: Keep translation short if possible. Maximum  34 characters can be displayed here
                this._menuItemExp = new PopupMenu.PopupImageMenuItem(_('Express Mode'), getIcon('charging-limit-sym-exp100-symbolic'));
                this._chargeLimitSection.addMenuItem(this._menuItemExp);
            }

            this._chargeLimitSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            // Define display Current Threshold Reading on sysfs
            this._currentLimitItem = new PopupMenu.PopupImageMenuItem('', getIcon('charging-limit-current-value-symbolic'), {
                style_class: 'bhc-popup-menu',
            });
            this._chargeLimitSection.addMenuItem(this._currentLimitItem);

            // update panel
            this._notify = 0;                       // Notifcations 0-Dont notify, 1-notifyThreshold1, 2-notifyThreshold2
            this._updateIconStyle();                // update icon style
            this._updatePrefButtonVisibilty();      // Update Extension Pref Button Visibility
            this._updatePanelMenu();                // Update Panel items
            this._updateLabelAndHeaderSubtitle();   // Update lable and Header Subtitle

            // Observe changes to update Panel
            this._settings.connectObject(
                'changed::charging-mode', () => {
                    this._notify = 1;
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
                    this._updateIconStyle();
                },
                'changed::dummy-default-threshold', () => {
                    const currentMode = this._settings.get_string('charging-mode');
                    if (this._settings.get_boolean('default-threshold') && (currentMode !== 'adv') && (currentMode !== 'exp')) {
                        this._currentDevice.setThresholdLimit(currentMode);
                        this._notify = 1;
                    }
                },
                'changed::dummy-apply-threshold', () => {
                    this._notify = 1;
                    const currentMode = this._settings.get_string('charging-mode');
                    if ((currentMode !== 'adv') && (currentMode !== 'exp'))
                        this._currentDevice.setThresholdLimit(currentMode);
                },
                this
            );

            if (this._currentDevice.deviceHaveDualBattery) {
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
                    },
                    'changed::show-battery-panel2', () => {
                        this._notify = 0;
                        this._updateLabelAndHeaderSubtitle();
                        this._updatePanelMenu();
                    },
                    'changed::default-threshold2', () => {
                        this._updateIconStyle();
                    },
                    'changed::dummy-default-threshold2', () => {
                        if (this._settings.get_boolean('default-threshold2')) {
                            this._currentDevice.setThresholdLimit2(this._settings.get_string('charging-mode2'));
                            this._notify = 2;
                        }
                    },
                    'changed::dummy-apply-threshold2', () => {
                        this._currentDevice.setThresholdLimit2(this._settings.get_string('charging-mode2'));
                        this._notify = 2;
                    },
                    this
                );
            }

            this._menuItemFul.connectObject('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                if (this._settings.get_boolean('show-battery-panel2')) {
                    this._currentDevice.setThresholdLimit2('ful');
                    this._settings.set_string('charging-mode2', 'ful');
                } else {
                    this._currentDevice.setThresholdLimit('ful');
                    this._settings.set_string('charging-mode', 'ful');
                }
            }, this);
            if (this._currentDevice.deviceHaveBalancedMode) {
                this._menuItemBal.connectObject('activate', () => {
                    Main.overview.hide();
                    Main.panel.closeQuickSettings();
                    if (this._settings.get_boolean('show-battery-panel2')) {
                        this._currentDevice.setThresholdLimit2('bal');
                        this._settings.set_string('charging-mode2', 'bal');
                    } else {
                        this._currentDevice.setThresholdLimit('bal');
                        this._settings.set_string('charging-mode', 'bal');
                    }
                }, this);
            }
            this._menuItemMax.connectObject('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                if (this._settings.get_boolean('show-battery-panel2')) {
                    this._currentDevice.setThresholdLimit2('max');
                    this._settings.set_string('charging-mode2', 'max');
                } else {
                    this._currentDevice.setThresholdLimit('max');
                    this._settings.set_string('charging-mode', 'max');
                }
            }, this);
            if (this._currentDevice.type === 21) { // Dell Device
                this._menuItemAdv.connectObject('activate', () => {
                    Main.overview.hide();
                    Main.panel.closeQuickSettings();
                    this._currentDevice.setThresholdLimit('adv');
                    this._settings.set_string('charging-mode', 'adv');
                }, this);
                this._menuItemExp.connectObject('activate', () => {
                    Main.overview.hide();
                    Main.panel.closeQuickSettings();
                    this._currentDevice.setThresholdLimit('exp');
                    this._settings.set_string('charging-mode', 'exp');
                }, this);
            } // endif Dell Device
            this._preferencesButton.connectObject('clicked', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                openPreferences();
            }, this);
            this._currentDevice.connectObject('read-completed', () => {
                this._updatePanelMenu();
            }, this);
        }

        // UpdatePanelMenu UI
        _updatePanelMenu() {
            // Display Panel for Battery 1 (false) or Battery 2 (true)
            this._switchPanelToBattery2 = this._settings.get_boolean('show-battery-panel2');
            if (this._switchPanelToBattery2)
                this._currentModeSettings = this._settings.get_string('charging-mode2');
            else
                this._currentModeSettings = this._settings.get_string('charging-mode');

            // Read updated threshold values from sysfs and notify
            if (this._notify === 0) {
                this._currentEndLimitValue = this._switchPanelToBattery2 ? this._currentDevice.endLimit2Value
                    : this._currentDevice.endLimitValue;
                if (this._currentDevice.deviceHaveStartThreshold) {
                    this._currentStartLimitValue = this._switchPanelToBattery2 ? this._currentDevice.startLimit2Value
                        : this._currentDevice.startLimitValue;
                }
            }
            if ((this._notify === 1) && (this._currentModeSettings !== 'adv') && (this._currentModeSettings !== 'exp')) {
                this._currentEndLimitValue = this._currentDevice.endLimitValue;
                if (this._currentDevice.deviceHaveStartThreshold) {
                    this._currentStartLimitValue = this._currentDevice.startLimitValue;
                    Notify.notifyUpdateThreshold(this._currentEndLimitValue, this._currentStartLimitValue);
                } else {
                    Notify.notifyUpdateThreshold(this._currentEndLimitValue, 0);
                }
                this._notify = 0;
                if (this._switchPanelToBattery2)
                    return;
            } else if ((this._notify === 1) && (this._currentModeSettings === 'adv') || (this._currentModeSettings === 'exp')) {
                Notify.notifyUpdateMode(this._currentModeSettings);
                this._notify = 0;
            }
            if (this._notify === 2) {
                this._currentEndLimitValue = this._currentDevice.endLimit2Value;
                if (this._currentDevice.deviceHaveStartThreshold) {
                    this._currentStartLimitValue = this._currentDevice.startLimit2Value;
                    Notify.notifyUpdateThreshold2(this._currentEndLimitValue, this._currentStartLimitValue);
                } else {
                    Notify.notifyUpdateThreshold2(this._currentEndLimitValue, 0);
                }
                this._notify = 0;
                if (!this._switchPanelToBattery2)
                    return;
            }

            // Update quickmenu toggle subtitle
            this._updateQuickToggleSubtitle();

            // Update quickToggleMenu icon and header icon
            let currentModeIcon = '';
            if (this._currentModeSettings === 'ful')
                currentModeIcon = this._currentDevice.iconForFullCapMode; // Get full capacity mode for type of laptop
            else if (this._currentModeSettings === 'bal')
                currentModeIcon = this._currentDevice.iconForBalanceMode; // Get balance mode for type of laptop
            else if (this._currentModeSettings === 'max')
                currentModeIcon = this._currentDevice.iconForMaxLifeMode; // Get maxlife mode for type of laptop
            else if (this._currentModeSettings === 'adv')
                currentModeIcon = 'adv100';                               // Get adaptive mode for type of laptop
            else if (this._currentModeSettings === 'exp')
                currentModeIcon = 'exp100';                               // Get express mode for type of laptop

            const headerIconName = `charging-limit-${this._iconType}-${currentModeIcon}-symbolic`;
            this.gicon = getIcon(headerIconName);
            // TRANSLATORS: Keep translation short if possible. Maximum  21 characters can be displayed here
            this.menu.setHeader(getIcon(headerIconName), _('Battery Charging Mode'), this._setHeaderSubtitle);

            // Set text for popup menu display current values
            let currentLimitValueString = '';
            if (this._currentDevice.deviceHaveStartThreshold) {
                // TRANSLATORS: Keep translation short if possible. Maximum  34 characters can be displayed here
                currentLimitValueString = _('Charge thresholds are set to %d / %d %%')
                    .format(this._currentEndLimitValue, this._currentStartLimitValue);
            } else {
                // TRANSLATORS: Keep translation short if possible. Maximum  34 characters can be displayed here
                currentLimitValueString = _('Charging Limit is set to %d%%').format(this._currentEndLimitValue);
            }
            if (this._currentDevice.type === 21) {
                if (this._currentDevice.mode === 'adaptive') {
                    // TRANSLATORS: Keep translation short if possible. Maximum  34 characters can be displayed here
                    currentLimitValueString = _('Charging Mode: Adaptive');
                } else if (this._currentDevice.mode === 'express') {
                    // TRANSLATORS: Keep translation short if possible. Maximum  34 characters can be displayed here
                    currentLimitValueString = _('Charging Mode: Express');
                }
            }
            this._currentLimitItem.label.text = currentLimitValueString;

            // Display a dot (ornament) to highlight current mode
            this._menuItemFul.setOrnament(this._currentModeSettings === 'ful' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            if (this._currentDevice.deviceHaveBalancedMode)
                this._menuItemBal.setOrnament(this._currentModeSettings === 'bal' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            this._menuItemMax.setOrnament(this._currentModeSettings === 'max' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            if (this._currentDevice.type === 21) { // Dell Device
                this._menuItemAdv.setOrnament(this._currentModeSettings === 'adv' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
                this._menuItemExp.setOrnament(this._currentModeSettings === 'exp' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            }
        } // fi updatePanelMenu

        // Set Visibitly on extension pref button
        _updatePrefButtonVisibilty() {
            const prefButtonVisible = this._settings.get_boolean('show-preferences');
            this._preferencesButtonIcon.visible = prefButtonVisible;
            this._preferencesButton.visible = prefButtonVisible;
        }

        // Update quickmenu Label(Title) and Header subtitle
        _updateLabelAndHeaderSubtitle() {
            if (this._currentDevice.deviceHaveDualBattery) {
                if (this._settings.get_boolean('show-battery-panel2')) {
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

        // Update quickmenu Toggle subtitle (gnome 44 and above)
        _updateQuickToggleSubtitle() {
            if (shellVersion44 && this._settings.get_boolean('show-quickmenu-subtitle')) {
                if (this._currentModeSettings === 'ful') {
                    // TRANSLATORS: Keep translation short if possible. Maximum  13 characters can be displayed here
                    this.subtitle = _('Full Capacity');
                } else if (this._currentModeSettings === 'bal') {
                    // TRANSLATORS: Keep translation short if possible. Maximum  13 characters can be displayed here
                    this.subtitle = _('Balanced');
                } else if (this._currentModeSettings === 'max') {
                    // TRANSLATORS: Keep translation short if possible. Maximum  13 characters can be displayed here
                    this.subtitle = _('Max Lifespan');
                } else if (this._currentModeSettings === 'adv') {
                    // TRANSLATORS: Keep translation short if possible. Maximum  13 characters can be displayed here
                    this.subtitle = _('Adaptive');
                } else if (this._currentModeSettings === 'exp') {
                    // TRANSLATORS: Keep translation short if possible. Maximum  13 characters can be displayed here
                    this.subtitle = _('Express');
                }
            } else {
                this.subtitle = null;
            }
        }

        // Update icon sytle for popupmenu
        _updateIconStyle() {
            const iconStyle = this._settings.get_int('icon-style-type');
            this._iconType = 'sym';
            if (iconStyle === 1)
                this._iconType = 'mix';
            if (iconStyle === 2)
                this._iconType = 'num';

            // Set icons Popup Menu Modes
            this._menuItemFul.setIcon(getIcon(`charging-limit-${this._iconType}-${this._currentDevice.iconForFullCapMode}-symbolic`));
            if (this._currentDevice.deviceHaveBalancedMode)
                this._menuItemBal.setIcon(getIcon(`charging-limit-${this._iconType}-${this._currentDevice.iconForBalanceMode}-symbolic`));

            this._menuItemMax.setIcon(getIcon(`charging-limit-${this._iconType}-${this._currentDevice.iconForMaxLifeMode}-symbolic`));
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
            Driver.checkCompatibility().then(notifier => {
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
                    case 5:
                        Notify.notifyAnErrorOccured();
                        return;
                }
                this._startIndicator();
            });
        }

        _startIndicator() {
            this._currentDevice = Driver.currentDevice;
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
            if (this._currentDevice.deviceHaveDualBattery) {         // if laptop is dual battery
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
        }

        // start updating indicator icon
        _updateIndicator() {
            if (this._settings.get_boolean('show-system-indicator')) {    // if show indicator enabled
                this._indicator.visible = true;

                const iconStyle = this._settings.get_int('icon-style-type');
                this._iconType = 'sym';
                if (iconStyle === 1)
                    this._iconType = 'mix';
                if (iconStyle === 2)
                    this._iconType = 'num';

                if (this._settings.get_boolean('show-battery-panel2'))  // Display indicator for Battery 1 (false) or Battery 2 (true)
                    this._currentModeSettings = this._settings.get_string('charging-mode2');
                else
                    this._currentModeSettings = this._settings.get_string('charging-mode');

                let currentModeIcon = '';
                if (this._currentModeSettings === 'ful')
                    currentModeIcon = this._currentDevice.iconForFullCapMode;
                else if (this._currentModeSettings === 'bal')
                    currentModeIcon = this._currentDevice.iconForBalanceMode;
                else if (this._currentModeSettings === 'max')
                    currentModeIcon = this._currentDevice.iconForMaxLifeMode;
                else if (this._currentModeSettings === 'adv')
                    currentModeIcon = 'adv100';
                else if (this._currentModeSettings === 'exp')
                    currentModeIcon = 'exp100';

                this._indicator.gicon = getIcon(`charging-limit-${this._iconType}-${currentModeIcon}-symbolic`);
            } else {    // else show indicator enabled
                this._indicator.visible = false;
            }    // fi show indicator enabled
        }

        destroy() {
            this._settings.disconnectObject(this);
            this.quickSettingsItems.forEach(item => item.destroy());
            Notify.removeActiveNofications();
            Driver.onDisable();
            this._settings = null;
            this._indicator = null;
            this.run_dispose();
        }
    }

);
