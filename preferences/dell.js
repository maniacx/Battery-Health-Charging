'use strict';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Secret from 'gi://Secret';
import {gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export const Dell = GObject.registerClass({
    GTypeName: 'BHC_Dell',
    Template: GLib.Uri.resolve_relative(import.meta.url, '../ui/dell.ui', GLib.UriFlags.NONE),
    InternalChildren: [
        'device_settings_group',
        'choose_configuration',
        'bios_settings_group',
        'need_bios_password',
        'password_entry_box',
        'save_password_button',
        'success_keyring_icon',
        'failed_keyring_icon',
    ],
}, class Dell extends Adw.PreferencesPage {
    constructor(settings) {
        super({});
        this._settings = settings;
        const configurationMapping = {
            'sysfs': _('Sysfs node'),
            'libsmbios': _('Libsmbios'),
            'cctk': _('Dell Command Center'),
        };

        const showPackageOption = this._settings.get_strv('multiple-configuration-supported').length > 1;
        this._device_settings_group.visible = showPackageOption;

        if (showPackageOption) {
            const supportedConfigs = this._settings.get_strv('multiple-configuration-supported');
            const displayNames = supportedConfigs.map(config => configurationMapping[config]);
            const stringList = new Gtk.StringList();
            displayNames.forEach(name => stringList.append(name));
            this._choose_configuration.set_model(stringList);
            const currentConfigMode = this._settings.get_string('configuration-mode');
            const initialSelectedIndex = supportedConfigs.indexOf(currentConfigMode);
            if (initialSelectedIndex !== -1)
                this._choose_configuration.set_selected(initialSelectedIndex);

            this._choose_configuration.connect('notify::selected-item', () => {
                const selectedIndex = this._choose_configuration.get_selected();
                const selectedConfig = supportedConfigs[selectedIndex];
                this._settings.set_string('configuration-mode', selectedConfig);
            });
        }

        if (this._showBiosSettings()) {
            this._addBiosPasswordOption();
            this._bios_settings_group.visible = true;
        }

        this._settings.connect('changed::configuration-mode', () => {
            if (this._showBiosSettings()) {
                if (!this._secretSchema)
                    this._addBiosPasswordOption();

                this._bios_settings_group.visible = true;
            } else {
                this._bios_settings_group.visible = false;
            }
        });
    }

    _showBiosSettings() {
        const mode = this._settings.get_string('configuration-mode');
        return mode === 'cctk' || mode === 'sysfs' && this._settings.get_boolean('support-sysfs-password');
    }

    _addBiosPasswordOption() {
        this._bios_settings_group.visible = true;
        this._success_keyring_icon.visible = false;
        this._failed_keyring_icon.visible = false;
        this._save_password_button.sensitive = this._password_entry_box.text.length > 0;

        this._secretSchema = new Secret.Schema('org.gnome.shell.extensions.Battery-Health-Charging',
            Secret.SchemaFlags.NONE, {'string': Secret.SchemaAttributeType.STRING});

        this._settings.bind(
            'need-bios-password',
            this._need_bios_password,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        this._password_entry_box.connect('activate', () => {
            this._setPassword(this._password_entry_box.text);
        });

        this._save_password_button.connect('clicked', () => {
            this._setPassword(this._password_entry_box.text);
        });

        this._password_entry_box.connect('notify::text', () => {
            this._save_password_button.sensitive = this._password_entry_box.text.length > 0;
        });

        this._settings.connect('changed::need-bios-password', () => {
            if (!this._settings.get_boolean('need-bios-password'))
                this._clearPassword();
        });
    }

    _setPassword(pass) {
        Secret.password_store(this._secretSchema, {'string': 'Battery-Health-Charging-Gnome-Extension'}, Secret.COLLECTION_DEFAULT,
            'Battery Health Charging Bios Password', pass, null, (o, result) => {
                try {
                    this._status = Secret.password_store_finish(result);
                } catch {
                    log('Battery Health Charging: Failed to store password on Gnome Keyring');
                    this._status = false;
                }

                if (this._status) {
                    const val = this._settings.get_boolean('password-applied');
                    this._settings.set_boolean('password-applied', !val);
                }

                const iconKeyring = this._status ? this._success_keyring_icon : this._failed_keyring_icon;
                iconKeyring.visible = true;
                if (this._enterTimeout)
                    GLib.Source_remove(this._enterTimeout);
                this._enterTimeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
                    iconKeyring.visible = false;
                    this._enterTimeout = null;
                    return GLib.SOURCE_REMOVE;
                });
            });
    }

    _clearPassword() {
        Secret.password_clear(this._secretSchema, {'string': 'Battery-Health-Charging-Gnome-Extension'}, null, (o, result) => {
            try {
                Secret.password_clear_finish(result);
            } catch {
                log('Battery Health Charging: Failed to clear password from Gnome Keyring');
            }
        });
    }
});
