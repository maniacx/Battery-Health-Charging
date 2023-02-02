'use strict';
const {Adw, GLib, GObject, Gio} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Driver = Me.imports.driver;
const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;

/**
 * Call button click call runInstaller from driver
 */
function runInstaller() {
    Driver.runInstaller();
}

/**
 * Call button click call runUninstaller from driver
 */
function runUninstaller() {
    Driver.runUninstaller();
}

var Preferences = GObject.registerClass({
    GTypeName: 'BHC_Preferences',
    Template: `file://${GLib.build_filenamev([Me.path, 'preference.ui'])}`,
    InternalChildren: [
        'icon_style_mode',
        'show_system_indicator',
        'install_service',
        'install_service_button',
    ],
}, class Preferences extends Adw.PreferencesPage {
    constructor(settings) {
        super({});

        if (settings.get_boolean('install-service')) {
            this._install_service_button.set_label(_('Remove'));
            this._install_service_button.set_icon_name('user-trash-symbolic');
        } else {
            this._install_service_button.set_label(_('Install'));
            this._install_service_button.set_icon_name('emblem-system-symbolic');
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
            'state',
            Gio.SettingsBindFlags.DEFAULT
        );

        this._install_service.connect('clicked', () => {
            if (settings.get_boolean('install-service'))
                runUninstaller();
            else
                runInstaller();
        });

        settings.connect('changed::install-service', () => {
            if (settings.get_boolean('install-service')) {
                this._install_service_button.set_label(_('Remove'));
                this._install_service_button.set_icon_name('user-trash-symbolic');
            } else {
                this._install_service_button.set_label(_('Install'));
                this._install_service_button.set_icon_name('emblem-system-symbolic');
            }
        });
    }
});

/**
 * Preference windows
 */
function fillPreferencesWindow(window) {
    const settings = ExtensionUtils.getSettings();
    window.add(new Preferences(settings));
}

/**
 * Init
 */
function init() {
    ExtensionUtils.initTranslations(Me.metadata.uuid);
}
