'use strict';
const {Adw, Gio, GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Config = imports.misc.config;

const Driver = Me.imports.lib.driver;

const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;

const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);

function runInstaller() {
    Driver.runInstaller();
}

function runUpdater() {
    Driver.runUpdater();
}

function runUninstaller() {
    Driver.runUninstaller();
}

var General = GObject.registerClass({
    GTypeName: 'BHC_General',
    Template: `file://${GLib.build_filenamev([Me.path, 'ui', 'general.ui'])}`,
    InternalChildren: [
        'icon_style_mode_row',
        'icon_style_mode',
        'show_system_indicator',
        'show_notifications',
        'show_preferences',
        'show_quickmenu_subtitle_row',
        'show_quickmenu_subtitle',
        'service_installer',
        'install_service',
        'install_service_button',
    ],
}, class General extends Adw.PreferencesPage {
    constructor(settings) {
        super({});

        this._deviceHaveVariableThreshold = false;
        this._deviceNeedRootPermission = false;
        this._deviceHaveDualBattery = false;

        if (Driver.currentDevice !== null) {
            this._deviceHaveVariableThreshold = Driver.currentDevice.deviceHaveVariableThreshold;
            this._deviceNeedRootPermission = Driver.currentDevice.deviceNeedRootPermission;
            this._deviceHaveDualBattery = Driver.currentDevice.deviceHaveDualBattery;
        }

        this._iconModeSensitiveCheck(settings);

        if (this._deviceHaveVariableThreshold)
            this._icon_style_mode_row.set_subtitle(_('Select the type of icon for indicator and menu.\nIn threshold settings, if <b>Customise</b> mode is selected, icon type will switch to <b>Symbols Only</b> and this option will be disabled'));
        else
            this._icon_style_mode_row.set_subtitle(_('Select the type of icon for indicator and menu'));

        this._show_quickmenu_subtitle_row.visible = shellVersion >= 44;

        if (this._deviceNeedRootPermission) {
            this._service_installer.visible = true;
            this._updateInstallationLabelIcon(settings);
        } else {
            this._service_installer.visible = false;
        }

        settings.bind(
            'icon-style-type',
            this._icon_style_mode,
            'selected',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.bind(
            'show-system-indicator',
            this._show_system_indicator,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.bind(
            'show-notifications',
            this._show_notifications,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.bind(
            'show-preferences',
            this._show_preferences,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        if (shellVersion >= 44) {
            settings.bind(
                'show-quickmenu-subtitle',
                this._show_quickmenu_subtitle,
                'active',
                Gio.SettingsBindFlags.DEFAULT
            );
        }

        if (this._deviceNeedRootPermission) {
            this._install_service.connect('clicked', () => {
                const installType = settings.get_int('install-service');
                switch (installType) {
                    case 0:
                        runUninstaller();
                        break;
                    case 1:
                        runInstaller();
                        break;
                    case 2:
                        runUpdater();
                        break;
                }
            });

            settings.connect('changed::install-service', () => {
                this._updateInstallationLabelIcon(settings);
            });
        }

        settings.connect('changed::default-threshold', () => {
            this._iconModeSensitiveCheck(settings);
        });
        if (this._deviceHaveDualBattery) {
            settings.connect('changed::default-threshold2', () => {
                this._iconModeSensitiveCheck(settings);
            });
        }
    }

    _iconModeSensitiveCheck(settings) {
        if (!settings.get_boolean('default-threshold')) {
            this._icon_style_mode_row.sensitive = false;
            settings.set_int('icon-style-type', 0);
        } else if (!settings.get_boolean('default-threshold2') && this._deviceHaveDualBattery) {
            this._icon_style_mode_row.sensitive = false;
            settings.set_int('icon-style-type', 0);
        } else {
            this._icon_style_mode_row.sensitive = true;
        }
    }

    _updateInstallationLabelIcon(settings) {
        const installType = settings.get_int('install-service');
        switch (installType) {
            case 0:
                this._install_service_button.set_label(_('Remove'));
                this._install_service_button.set_icon_name('user-trash-symbolic');
                break;
            case 1:
                this._install_service_button.set_label(_('Install'));
                this._install_service_button.set_icon_name('emblem-system-symbolic');
                break;
            case 2:
                this._install_service_button.set_label(_('Update'));
                this._install_service_button.set_icon_name('software-update-available-symbolic');
                break;
        }
    }
});
