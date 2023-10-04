'use strict';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import {gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import * as SecretHelper from '../lib/libsecretHelper.js';

export const Dell = GObject.registerClass({
    GTypeName: 'BHC_Dell',
    Template: GLib.Uri.resolve_relative(import.meta.url, '../ui/dell.ui', GLib.UriFlags.NONE),
    InternalChildren: [
        'device_settings_group',
        'choose_package',
        'bios_settings_group',
        'need_bios_password',
        'password_entry_box',
    ],
}, class Dell extends Adw.PreferencesPage {
    constructor(settings) {
        super({});
        this._settings = settings;

        this._showPackageOption = this._settings.get_boolean('detected-libsmbios');
        this._device_settings_group.visible = this._showPackageOption;
        
        this._bios_settings_group.visible = (!this._showPackageOption || (this._settings.get_int('dell-package-type') === 1));
       
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
            SecretHelper.setPassword(this._password_entry_box.text, () => {
                this._applyThreshold();
            });
        });

        this._settings.connect('changed::need-bios-password', () => {
            if (!this._settings.get_boolean('need-bios-password'))
                SecretHelper.clearPassword();
        });
    }

    _applyThreshold() {
        this._settings.set_boolean('dummy-apply-threshold', !this._settings.get_boolean('dummy-apply-threshold'));
    }
});
