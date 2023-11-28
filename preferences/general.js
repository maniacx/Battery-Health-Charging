'use strict';
const {Adw, Gio, GLib, GObject} = imports.gi;
const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {execCheck} = Helper;

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
        'service_installer',
        'install_service',
        'install_service_button',
    ],
}, class General extends Adw.PreferencesPage {
    constructor(settings, currentDevice, dir) {
        super({});
        this._settings = settings;
        this._dir = dir;
        this._currentDevice = currentDevice;

        this._deviceHaveVariableThreshold = false;
        this._deviceNeedRootPermission = false;
        this._deviceHaveDualBattery = false;
        this._deviceUsesModeNotValue = false;

        if (currentDevice) {
            this._deviceHaveVariableThreshold = currentDevice.deviceHaveVariableThreshold;
            this._deviceNeedRootPermission = currentDevice.deviceNeedRootPermission;
            this._deviceHaveDualBattery = currentDevice.deviceHaveDualBattery;
            this._deviceUsesModeNotValue = currentDevice.deviceUsesModeNotValue;
        }

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

        if (this._deviceNeedRootPermission) {
            this._install_service.connect('clicked', () => {
                const installType = this._settings.get_string('polkit-status');
                if (installType === 'not-installed')
                    this._runInstallerScript('install');
                else if (installType === 'installed')
                    this._runInstallerScript('uninstall');
                else if (installType === 'need-update')
                    this._runInstallerScript('update');
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

    async _runInstallerScript(action) {
        const user = GLib.get_user_name();
        const argv = [
            'pkexec',
            this._dir.get_child('tool').get_child('installer.sh').get_path(),
            '--tool-user',
            user,
            action,
        ];
        const [status, output] = await execCheck(argv);
        log(`Battery Health Charging: stdout = ${output}`);
        log(`Battery Health Charging: status = ${status}`);
        const toast = new Adw.Toast();
        toast.set_timeout(3);
        if (status === 0) {
            if (action === 'install' || action === 'update') {
                this._settings.set_string('polkit-status', 'installed');
                toast.set_title(_('Installation Successful.'));
            } else if (action === 'uninstall') {
                this._settings.set_string('polkit-status', 'not-installed');
                toast.set_title(_('Uninstallation Successful.'));
            }
        } else {
            toast.set_title(_('Encountered an unexpected error.'));
        }
        if (status !== 126)
            this.root.add_toast(toast);
    }
});
