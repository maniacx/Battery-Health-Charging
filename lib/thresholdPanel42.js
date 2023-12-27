'use strict';
const {Clutter, Gio, GObject, St} = imports.gi;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const AggregateMenu = Main.panel.statusArea.aggregateMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;

var ThresholdPanel = GObject.registerClass(
    class ThresholdPanel extends PanelMenu.SystemIndicator {
        constructor(settings, extensionObject, currentDevice, notifier) {
            super();
            this._notifier = notifier;
            this._settings = settings;
            this._device = currentDevice;
            this._iconFolder = extensionObject.dir.get_child('icons/hicolor/scalable/actions').get_path();

            if (this._device.deviceHaveDualBattery) {
                this._battery0Removed = this._device.battery0Removed;
                this._battery1Removed = this._device.battery1Removed;
            } else {
                this._battery0Removed = false;
                this._battery1Removed = false;
            }

            this._dischargeBeforeSetLimitValue = this._device.dischargeBeforeSet ?? 0;
            this._deviceRestrictThresholdChange = this._dischargeBeforeSetLimitValue !== 0;
            this._batteryLevelAboveLimit = false;

            this._indicator = this._addIndicator();
            this._indicatorPosition = this._settings.get_int('indicator-position');
            this._indicatorIndex = this._settings.get_int('indicator-position-index');
            this._lastIndicatorPosition = this._indicatorPosition;

            AggregateMenu._indicators.insert_child_at_index(this, this._indicatorIndex);
            AggregateMenu._batteryHealthCharging = this;

            this._updateLastIndicatorPosition();
            this._chargingMode = this._settings.get_string('charging-mode');
            this._chargingMode2 = this._settings.get_string('charging-mode2');
            this._indicator.visible = this._settings.get_boolean('show-system-indicator');
            this._updateIndicator();
            this._startPanel();
        }

        _getIcon(iconName) {
            return Gio.icon_new_for_string(`${this._iconFolder}/${iconName}.svg`);
        }

        _updateIndicator() {
            this._switchPanelToBattery2 = this._settings.get_boolean('show-battery-panel2');

            const iconStyle = this._settings.get_int('icon-style-type');
            let iconType = 'sym';
            if (iconStyle === 1)
                iconType = 'mix';
            if (iconStyle === 2)
                iconType = 'num';

            let currentMode;
            if (this._switchPanelToBattery2)  // Display indicator for Battery 1 (false) or Battery 2 (true)
                currentMode = this._chargingMode2;
            else
                currentMode = this._chargingMode;

            if ((!this._switchPanelToBattery2 && this._battery0Removed) || (this._switchPanelToBattery2 && this._battery1Removed)) {
                currentMode = 'rem';
                iconType = 'bat';
            }

            let modeIconValue;
            if (iconType === 'sym' || currentMode === 'adv' || currentMode === 'exp ' || currentMode === 'rem')
                modeIconValue = '';
            else if (currentMode === 'ful')
                modeIconValue = this._device.iconForFullCapMode;
            else if (currentMode === 'bal')
                modeIconValue = this._device.iconForBalanceMode;
            else if (currentMode === 'max')
                modeIconValue = this._device.iconForMaxLifeMode;

            this._indicator.gicon = this._getIcon(`bhc-qs-${iconType}-${currentMode}${modeIconValue}-symbolic`);
        }

        _updateLastIndicatorPosition() {
            let pos = -1;
            const nbItems = AggregateMenu._indicators.get_n_children();
            let targetIndicator = null;

            for (let i = 0; i < nbItems; i++) {
                targetIndicator = AggregateMenu._indicators.get_child_at_index(i);
                if (targetIndicator.is_visible())
                    pos += 1;
            }
            this._settings.set_int('indicator-position-max', pos);
        }

        _incrementIndicatorPosIndex() {
            if (this._lastIndicatorPosition < this._indicatorPosition)
                this._indicatorIndex += 1;
            else
                this._indicatorIndex -= 1;
        }

        _updateIndicatorPosition() {
            this._updateLastIndicatorPosition();
            const newPosition = this._settings.get_int('indicator-position');

            if (this._indicatorPosition !== newPosition) {
                this._indicatorPosition = newPosition;
                this._incrementIndicatorPosIndex();

                let targetIndicator =
                AggregateMenu._indicators.get_child_at_index(this._indicatorIndex);
                const maxIndex = AggregateMenu._indicators.get_n_children();
                while (this._indicatorIndex < maxIndex && !targetIndicator.is_visible() && this._indicatorIndex > -1) {
                    this._incrementIndicatorPosIndex();
                    targetIndicator =
                    AggregateMenu._indicators.get_child_at_index(this._indicatorIndex);
                }

                if (this._indicatorPosition === 0)
                    this._indicatorIndex = 0;

                this._lastIndicatorPosition = newPosition;

                AggregateMenu._indicators.remove_actor(this);
                AggregateMenu._indicators.insert_child_at_index(this, this._indicatorIndex);
                this._settings.set_int('indicator-position-index', this._indicatorIndex);
            }
        }

        _startPanel() {
            this._item = new PopupMenu.PopupSubMenuMenuItem('Battery Charging Mode', true);
            this._item.icon.gicon = this._indicator.gicon;
            this._item.label.clutter_text.x_expand = true;
            this.menu.addMenuItem(this._item);

            if (this._device.deviceHaveDualBattery) {
                const switchLabel = this._settings.get_boolean('show-battery-panel2') ? _('Battery 2') : _('Battery 1');
                this._titleSwitchMenu = new PopupMenu.PopupSwitchMenuItem(switchLabel, this._settings.get_boolean('show-battery-panel2'));
                this._item.menu.addMenuItem(this._titleSwitchMenu);

                this._item.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                // make switcher toggle without popup menu closing
                this._titleSwitchMenu.activate = __ => {
                    if (this._titleSwitchMenu._switch.mapped)
                        this._titleSwitchMenu.toggle();
                };

                this._titleSwitchMenu.connectObject('toggled', () => {
                    this._settings.set_boolean('show-battery-panel2', this._titleSwitchMenu.state);
                    this._titleSwitchMenu.label.text = this._titleSwitchMenu.state ? _('Battery 2') : _('Battery 1');
                    this._updateIndicator();
                    this._updatePanelMenu();
                });
            }

            this._menuItemFul = new PopupMenu.PopupMenuItem(_('Full Capacity Mode'));
            this._item.menu.addMenuItem(this._menuItemFul);

            if (this._device.deviceHaveBalancedMode) {
                this._menuItemBal = new PopupMenu.PopupMenuItem(_('Balanced Mode'));
                this._item.menu.addMenuItem(this._menuItemBal);
            }

            this._menuItemMax = new PopupMenu.PopupMenuItem(_('Maximum Lifespan Mode'));
            this._item.menu.addMenuItem(this._menuItemMax);

            if (this._device.deviceHaveAdaptiveMode) {
                this._menuItemAdv = new PopupMenu.PopupMenuItem(_('Adaptive Mode'));
                this._item.menu.addMenuItem(this._menuItemAdv);
            }
            if (this._device.deviceHaveExpressMode) {
                this._menuItemExp = new PopupMenu.PopupMenuItem(_('Express Mode'));
                this._item.menu.addMenuItem(this._menuItemExp);
            }

            this._currentStateMenuItem = new PopupMenu.PopupMenuItem('');
            this._preferencesButton = new St.Button({
                x_expand: true,
                y_align: Clutter.ActorAlign.CENTER,
                x_align: Clutter.ActorAlign.END,
                style_class: 'bhc-preferences-button',
            });
            this._preferencesButtonIcon = new St.Icon({
                gicon: this._getIcon('bhc-settings-symbolic'),
                icon_size: 12,
            });
            this._preferencesButton.child = this._preferencesButtonIcon;
            this._currentStateMenuItem.add_child(this._preferencesButton);

            this._item.menu.addMenuItem(this._currentStateMenuItem);
            this._currentStateMenuItem.reactive = false;

            const menuItems = AggregateMenu.menu._getMenuItems();
            const powerMenuIndex = AggregateMenu._power ? menuItems.indexOf(AggregateMenu._power.menu) : -1;
            const menuIndex = powerMenuIndex > -1 ? powerMenuIndex : 4;
            AggregateMenu.menu.addMenuItem(this.menu, menuIndex + 1);

            this._showNotifications = this._settings.get_boolean('show-notifications');
            this._updatePrefButtonVisibilty();

            this._settings.connectObject(
                'changed::charging-mode', () => {
                    this._chargingMode = this._settings.get_string('charging-mode');
                    this._updateNotification = true;
                    this._device.setThresholdLimit(this._chargingMode);
                },
                'changed::icon-style-type', () => {
                    this._updateIndicator();
                    this._updatePanelMenu();
                },
                'changed::show-notifications', () => {
                    this._showNotifications = this._settings.get_boolean('show-notifications');
                },
                'changed::show-preferences', () => {
                    this._updatePrefButtonVisibilty();
                },
                'changed::show-system-indicator', () => {
                    this._indicator.visible = this._settings.get_boolean('show-system-indicator');
                },
                'changed::indicator-position', () => {
                    this._updateIndicatorPosition();
                },
                this
            );

            if (this._device.deviceHaveVariableThreshold) { // customizable threshold
                this._settings.connectObject(
                    'changed::dummy-default-threshold', () => {
                        if (this._settings.get_boolean('default-threshold') && (this._chargingMode !== 'adv') && (this._chargingMode !== 'exp')) {
                            this._updateNotification = true;
                            this._device.setThresholdLimit(this._chargingMode);
                        }
                    },
                    'changed::dummy-apply-threshold', () => {
                        if ((this._chargingMode !== 'adv') && (this._chargingMode !== 'exp')) {
                            this._updateNotification = true;
                            this._device.setThresholdLimit(this._chargingMode);
                        }
                    },
                    this
                );
            }

            if (this._device.type === 20 || this._device.type === 21) { // device.type 20|21 is Thinkpad
                this._settings.connectObject(
                    'changed::force-discharge-feature', () => {
                        if (this._settings.get_boolean('force-discharge-feature'))
                            this._addForceDischargeToggle();
                        else
                            this._removeForceDischargeToggle();
                    },
                    this
                );
            }

            if (this._device.deviceHaveDualBattery) {
                this._updateNotificationBat2 = false;
                this._settings.connectObject(
                    'changed::charging-mode2', () => {
                        this._chargingMode2 = this._settings.get_string('charging-mode2');
                        this._updateNotificationBat2 = true;
                        this._device.setThresholdLimit2(this._chargingMode2);
                    },
                    'changed::show-battery-panel2', () => {
                        this._updateIndicator();
                        this._updatePanelMenu();
                    },
                    'changed::dummy-default-threshold2', () => {
                        if (this._settings.get_boolean('default-threshold2')) {
                            this._updateNotificationBat2 = true;
                            this._device.setThresholdLimit2(this._chargingMode2);
                        }
                    },
                    'changed::dummy-apply-threshold2', () => {
                        this._updateNotificationBat2 = true;
                        this._device.setThresholdLimit2(this._chargingMode2);
                    },
                    this
                );
                this._device.connectObject(
                    'battery-status-changed', () => {
                        this._battery0Removed = this._device.battery0Removed;
                        this._battery1Removed = this._device.battery1Removed;
                        this._updateIndicator();
                        this._updatePanelMenu();
                    },
                    this);
            }

            this._menuItemFul.connectObject('activate', () => {
                Main.overview.hide();
                const mode = this._switchPanelToBattery2 ? 'charging-mode2' : 'charging-mode';
                this._settings.set_string(mode, 'ful');
            }, this);
            if (this._device.deviceHaveBalancedMode) {
                this._menuItemBal.connectObject('activate', () => {
                    Main.overview.hide();
                    const mode = this._switchPanelToBattery2 ? 'charging-mode2' : 'charging-mode';
                    this._settings.set_string(mode, 'bal');
                }, this);
            }
            this._menuItemMax.connectObject('activate', () => {
                Main.overview.hide();
                const mode = this._switchPanelToBattery2 ? 'charging-mode2' : 'charging-mode';
                this._settings.set_string(mode, 'max');
            }, this);
            if (this._device.deviceHaveAdaptiveMode) {
                this._menuItemAdv.connectObject('activate', () => {
                    Main.overview.hide();
                    this._settings.set_string('charging-mode', 'adv');
                }, this);
            }
            if (this._device.deviceHaveExpressMode) {
                this._menuItemExp.connectObject('activate', () => {
                    Main.overview.hide();
                    this._settings.set_string('charging-mode', 'exp');
                }, this);
            }
            this._preferencesButton.connectObject('clicked', () => {
                Main.overview.hide();
                this._notifier.openPreferences();
            }, this);
            this._device.connectObject('threshold-applied', (o, updateSuccessful) => {
                if (updateSuccessful === 'success') {
                    this._updateIndicator();
                    this._updatePanelMenu();
                    if (this._showNotifications) {
                        if (this._updateNotification)
                            this._updateNofitication();
                        if (this._updateNotificationBat2)
                            this._updateNofiticationBat2();
                    }
                } else if (updateSuccessful === 'password-required') {
                    this._notifier.notifyThresholdPasswordRequired();
                } else {
                    this._notifier.notifyThresholdNotUpdated(this._device.name);
                }
            }, this);
            if (this._deviceRestrictThresholdChange) {
                this._device.connectObject('battery-level-changed', () => {
                    this._batteryLevel = this._device.batteryLevel;
                    this._updatePanelMenu();
                }, this);
            }

            if (this._deviceRestrictThresholdChange)
                this._batteryLevel = this._device.batteryLevel;

            if (this._settings.get_boolean('force-discharge-feature'))
                this._addForceDischargeToggle();

            this._updatePanelMenu();
        }

        _updatePanelMenu() {
            this._currentMode = this._switchPanelToBattery2 ? this._chargingMode2 : this._chargingMode;
            this._item.icon.gicon = this._indicator.gicon;

            this._batteryNotAvailable = (this._switchPanelToBattery2 && this._battery1Removed) ||
                 (!this._switchPanelToBattery2 && this._battery0Removed);

            if (this._deviceRestrictThresholdChange) {
                this._batteryLevelAboveLimit = (this._batteryLevel >= this._dischargeBeforeSetLimitValue) &&
                        (this._currentMode === 'ful');
            }

            if (this._deviceRestrictThresholdChange || this._device.deviceHaveDualBattery) {
                this._menuItemFul.visible = !this._batteryNotAvailable && !this._batteryLevelAboveLimit;
                if (this._device.deviceHaveBalancedMode)
                    this._menuItemBal.visible = !this._batteryNotAvailable && !this._batteryLevelAboveLimit;
                this._menuItemMax.visible = !this._batteryNotAvailable && !this._batteryLevelAboveLimit;
                this._currentStateMenuItem.reactive = !this._batteryNotAvailable && !this._batteryLevelAboveLimit;
            }

            let currentStateMenuString = '';
            if (this._batteryNotAvailable) {
                // TRANSLATORS: Keep translation short if possible. Maximum  34 characters can be displayed here
                currentStateMenuString = _('No Battery detected!');
            } else if (this._batteryLevelAboveLimit) {
                // TRANSLATORS: Keep translation short if possible. Maximum  34 characters can be displayed here
                currentStateMenuString = _('Discharge Battery below %d%%').format(this._dischargeBeforeSetLimitValue);
            } else if ((this._chargingMode !== 'adv') && (this._chargingMode !== 'exp') && !this._device.deviceUsesModeNotValue) {
                this._currentEndLimitValue = this._switchPanelToBattery2 ? this._device.endLimit2Value : this._device.endLimitValue;
                if (this._device.deviceHaveStartThreshold) {
                    this._currentStartLimitValue = this._switchPanelToBattery2 ? this._device.startLimit2Value : this._device.startLimitValue;
                    // TRANSLATORS: Keep translation short if possible. Maximum  34 characters can be displayed here
                    currentStateMenuString = _('Charge thresholds: %d / %d %%')
                    .format(this._currentEndLimitValue, this._currentStartLimitValue);
                } else {
                    // TRANSLATORS: Keep translation short if possible. Maximum  34 characters can be displayed here
                    currentStateMenuString = _('Charging Limit: %d%%').format(this._currentEndLimitValue);
                }
            } else if (this._device.deviceUsesModeNotValue && (this._device.mode === 'ful')) {
                currentStateMenuString = _('Charging Mode: Full Capacity');
            } else if (this._device.deviceUsesModeNotValue && (this._device.mode === 'bal')) {
                currentStateMenuString = _('Charging Mode: Balanced');
            } else if (this._device.deviceUsesModeNotValue && (this._device.mode === 'max')) {
                // TRANSLATORS: Keep translation short if possible. Maximum  34 characters can be displayed here
                currentStateMenuString = _('Charging Mode: Max. Lifespan');
            } else if (this._device.deviceHaveAdaptiveMode && (this._device.mode === 'adv')) {
                currentStateMenuString = _('Charging Mode: Adaptive');
            } else if (this._device.deviceHaveExpressMode && (this._device.mode === 'exp')) {
                currentStateMenuString = _('Charging Mode: Express');
            }
            this._currentStateMenuItem.label.text = currentStateMenuString;

            this._menuItemFul.setOrnament(this._currentMode === 'ful' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            if (this._device.deviceHaveBalancedMode)
                this._menuItemBal.setOrnament(this._currentMode === 'bal' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            this._menuItemMax.setOrnament(this._currentMode === 'max' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            if (this._device.deviceHaveAdaptiveMode)
                this._menuItemAdv.setOrnament(this._currentMode === 'adv' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            if (this._device.deviceHaveExpressMode)
                this._menuItemExp.setOrnament(this._currentMode === 'exp' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
        }

        _updatePrefButtonVisibilty() {
            const prefButtonVisible = this._settings.get_boolean('show-preferences');
            this._preferencesButtonIcon.visible = prefButtonVisible;
            this._preferencesButton.visible = prefButtonVisible;
        }

        _updateNofitication() {
            if ((this._chargingMode !== 'adv') && (this._chargingMode !== 'exp') && !this._device.deviceUsesModeNotValue) {
                if (this._device.deviceHaveStartThreshold) {
                    if (this._device.deviceHaveDualBattery)
                        this._notifier.notifyUpdateThresholdBat1(this._device.endLimitValue, this._device.startLimitValue);
                    else
                        this._notifier.notifyUpdateThreshold(this._device.endLimitValue, this._device.startLimitValue);
                } else if (this._device.deviceHaveDualBattery) {
                    this._notifier.notifyUpdateLimitBat1(this._device.endLimitValue);
                } else {
                    this._notifier.notifyUpdateLimit(this._device.endLimitValue);
                }
            } else if (this._device.deviceUsesModeNotValue && (this._device.mode === 'ful')) {
                this._notifier.notifyUpdateModeFul();
            } else if (this._device.deviceUsesModeNotValue && (this._device.mode === 'bal')) {
                this._notifier.notifyUpdateModeBal();
            } else if (this._device.deviceUsesModeNotValue && (this._device.mode === 'max')) {
                this._notifier.notifyUpdateModeMax();
            } else if (this._device.deviceHaveAdaptiveMode && (this._device.mode === 'adv')) {
                this._notifier.notifyUpdateModeAdv();
            } else if (this._device.deviceHaveExpressMode && (this._device.mode === 'exp')) {
                this._notifier.notifyUpdateModeExp();
            }
            this._updateNotification = false;
        }

        _addForceDischargeToggle() {
            this._menuItemForceDischargeSeperator = new PopupMenu.PopupSeparatorMenuItem();
            const menuItemForceDischargeState = this._settings.get_boolean('force-discharge-enabled');
            this._menuItemForceDischarge = new PopupMenu.PopupSwitchMenuItem(_('Force Discharge'), menuItemForceDischargeState);
            this._item.menu.addMenuItem(this._menuItemForceDischargeSeperator);
            this._item.menu.addMenuItem(this._menuItemForceDischarge);
            this._menuItemForceDischarge.activate = __ => {
                if (this._menuItemForceDischarge._switch.mapped)
                    this._menuItemForceDischarge.toggle();
            };
            this._menuItemForceDischarge.connectObject('toggled', (o, state) => {
                this._settings.set_boolean('force-discharge-enabled', state);
            });
        }

        _removeForceDischargeToggle() {
            this._menuItemForceDischarge.destroy();
            this._menuItemForceDischargeSeperator.destroy();
            this._menuItemForceDischargeIcon = null;
        }

        _updateNofiticationBat2() {
            if (this._device.deviceHaveStartThreshold)
                this._notifier.notifyUpdateThresholdBat2(this._device.endLimit2Value, this._device.startLimit2Value);
            else
                this._notifier.notifyUpdateLimitBat2(this._device.endLimit2Value);
            this._updateNotificationBat2 = false;
        }

        destroy() {
            this._settings.disconnectObject(this);
            this._item.destroy();
            this.menu.destroy();
            this._device = null;
            this._settings = null;
            this._indicator = null;
            this.run_dispose();
        }
    }

);
