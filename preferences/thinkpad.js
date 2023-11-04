'use strict';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

export const  Thinkpad = GObject.registerClass({
    GTypeName: 'BHC_Thinkpad',
    Template: GLib.Uri.resolve_relative(import.meta.url, '../ui/thinkpad.ui', GLib.UriFlags.NONE),
    InternalChildren: [
        'force_discharge_feature',
    ],
}, class Thinkpad extends Adw.PreferencesPage {
    constructor(settings) {
        super({});
        this._settings = settings;

        this._settings.bind(
            'force-discharge-feature',
            this._force_discharge_feature,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );
        this._settings.connect('changed::force-discharge-feature', () => {
            if (!this._settings.get_boolean('force-discharge-feature'))
                this._settings.set_boolean('force-discharge-enabled', false);
        });
    }
});
