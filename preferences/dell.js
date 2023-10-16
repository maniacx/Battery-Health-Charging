'use strict';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Secret from 'gi://Secret';

export const Dell = GObject.registerClass({
    GTypeName: 'BHC_Dell',
    Template: GLib.Uri.resolve_relative(import.meta.url, '../ui/dell.ui', GLib.UriFlags.NONE),
    InternalChildren: [
        'device_settings_group',
        'choose_package',
        'bios_settings_group',
        'need_bios_password',
        'password_entry_box',
        'success_keyring_icon',
        'failed_keyring_icon',
    ],
}, class Dell extends Adw.PreferencesPage {
    constructor(settings) {
        super({});
        this._settings = settings;

        this._showPackageOption = this._settings.get_boolean('detected-libsmbios');
        this._device_settings_group.visible = this._showPackageOption;

        this._bios_settings_group.visible = !this._showPackageOption || (this._settings.get_int('dell-package-type') === 1);
        this._success_keyring_icon.visible = false;
        this._failed_keyring_icon.visible = false;

        this._secretSchema = new Secret.Schema('org.gnome.shell.extensions.Battery-Health-Charging',
            Secret.SchemaFlags.NONE, {'string': Secret.SchemaAttributeType.STRING});

        if (this._showPackageOption) {
            this._settings.bind(
                'dell-package-type',
                this._choose_package,
                'selected',
                Gio.SettingsBindFlags.DEFAULT
            );
        }

        this._settings.bind(
            'need-bios-password',
            this._need_bios_password,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        this._settings.connect('changed::dell-package-type', () => {
            this._bios_settings_group.visible = this._settings.get_int('dell-package-type') === 1;
        });

        this._password_entry_box.connect('activate', () => {
            this._setPassword(this._password_entry_box.text);
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
                } catch (e) {
                    log('Battery Health Charging: Failed to store password on Gnome Keyring');
                    this._status = false;
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
            } catch (e) {
                log('Battery Health Charging: Failed to clear password from Gnome Keyring');
            }
        });
    }
});
