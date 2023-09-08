'use strict';
const {Adw, Gio, GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Config = imports.misc.config;

const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;

const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);

var General = GObject.registerClass({
    GTypeName: 'BHC_General',
    Template: `file://${GLib.build_filenamev([Me.path, 'ui', 'general.ui'])}`,
    InternalChildren: [
        'icon_style_mode_row',
        'icon_style_mode',
        'show_notifications',
        'show_preferences',
        'show_quickmenu_subtitle_row',
        'show_quickmenu_subtitle',
        'show_system_indicator',
        'indicator_position',
        'amend_power_indicator',
        'dell_package_option_row',
        'dell_package_option',
        'service_installer',
        'install_service',
        'install_service_button',
    ],
}, class General extends Adw.PreferencesPage {
    constructor(settings, currentDevice) {
        super({});
        this._settings = settings;
        this._currentDevice = currentDevice;

        this._deviceHaveVariableThreshold = false;
        this._deviceNeedRootPermission = false;
        this._deviceHaveDualBattery = false;
        this._deviceUsesModeNotValue = false;

        if (currentDevice !== null) {
            this._deviceHaveVariableThreshold = currentDevice.deviceHaveVariableThreshold;
            this._deviceNeedRootPermission = currentDevice.deviceNeedRootPermission;
            this._deviceHaveDualBattery = currentDevice.deviceHaveDualBattery;
            this._deviceUsesModeNotValue = currentDevice.deviceUsesModeNotValue;
        }

        this._showDellOption = this._settings.get_boolean('show-dell-option');
        this._dell_package_option_row.visible = this._showDellOption;

        this._iconModeSensitiveCheck();
        if (this._deviceUsesModeNotValue) {
            this._icon_style_mode_row.visible = false;
        } else {
            this._icon_style_mode_row.visible = true;
            if (this._deviceHaveVariableThreshold)
                this._icon_style_mode_row.set_subtitle(_('Select the type of icon for indicator and menu.\nIn threshold settings, if <b>Customise</b> mode is selected, icon type will switch to <b>Symbols Only</b> and this option will be disabled.'));
            else
                this._icon_style_mode_row.set_subtitle(_('Select the type of icon for indicator and menu.'));
        }

        this._show_quickmenu_subtitle_row.visible = shellVersion >= 44;

        this._setIndicatorPosistionRange();

        if (this._deviceNeedRootPermission) {
            this._service_installer.visible = true;
            this._updateInstallationLabelIcon();
        } else {
            this._service_installer.visible = false;
        }

        this._settings.bind(
            'icon-style-type',
            this._icon_style_mode,
            'selected',
            Gio.SettingsBindFlags.DEFAULT
        );

        this._settings.bind(
            'show-notifications',
            this._show_notifications,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        this._settings.bind(
            'show-preferences',
            this._show_preferences,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        if (shellVersion >= 44) {
            this._settings.bind(
                'show-quickmenu-subtitle',
                this._show_quickmenu_subtitle,
                'active',
                Gio.SettingsBindFlags.DEFAULT
            );
        }

        this._settings.bind(
            'show-system-indicator',
            this._show_system_indicator,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        this._settings.bind(
            'indicator-position',
            this._indicator_position,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        this._settings.bind(
            'amend-power-indicator',
            this._amend_power_indicator,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        if (this._showDellOption) {
            this._settings.bind(
                'dell-package-type',
                this._dell_package_option,
                'selected',
                Gio.SettingsBindFlags.DEFAULT
            );
        }

        if (this._deviceNeedRootPermission) {
            this._install_service.connect('clicked', () => {
                this._settings.set_boolean('polkit-installation-changed', !this._settings.get_boolean('polkit-installation-changed'));
            });

            this._settings.connect('changed::polkit-status', () => {
                this._updateInstallationLabelIcon();
            });
        }

        this._settings.connect('changed::default-threshold', () => {
            this._iconModeSensitiveCheck();
        });

        if (this._deviceHaveDualBattery) {
            this._settings.connect('changed::default-threshold2', () => {
                this._iconModeSensitiveCheck();
            });
        }

        this._settings.connect('changed::indicator-position-max', () => {
            this._setIndicatorPosistionRange();
        });
    }

    _iconModeSensitiveCheck() {
        if (!this._settings.get_boolean('default-threshold')) {
            this._icon_style_mode_row.sensitive = false;
            this._settings.set_int('icon-style-type', 0);
        } else if (!this._settings.get_boolean('default-threshold2') && this._deviceHaveDualBattery) {
            this._icon_style_mode_row.sensitive = false;
            this._settings.set_int('icon-style-type', 0);
        } else {
            this._icon_style_mode_row.sensitive = true;
        }
    }

    _setIndicatorPosistionRange() {
        this._indicator_position.set_range(0, this._settings.get_int('indicator-position-max'));
    }

    _updateInstallationLabelIcon() {
        const installType = this._settings.get_string('polkit-status');
        if (installType === 'installed') {
            this._install_service_button.set_label(_('Remove'));
            this._install_service_button.set_icon_name('user-trash-symbolic');
        } else if (installType === 'not-installed') {
            this._install_service_button.set_label(_('Install'));
            this._install_service_button.set_icon_name('emblem-system-symbolic');
        } else if (installType === 'need-update') {
            this._install_service_button.set_label(_('Update'));
            this._install_service_button.set_icon_name('software-update-available-symbolic');
        }
    }
});
