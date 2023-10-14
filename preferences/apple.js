'use strict';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

export const  Apple = GObject.registerClass({
    GTypeName: 'BHC_Apple',
    Template: GLib.Uri.resolve_relative(import.meta.url, '../ui/apple.ui', GLib.UriFlags.NONE),
    InternalChildren: [
        'charging_led',
    ],
}, class Apple extends Adw.PreferencesPage {
    constructor(settings) {
        super({});
        this._settings = settings;

        this._settings.bind(
            'apple-charging-led',
            this._charging_led,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );
    }
});
