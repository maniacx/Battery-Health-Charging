'use strict';
const {Adw, Gio, GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

var Apple = GObject.registerClass({
    GTypeName: 'BHC_Apple',
    Template: `file://${GLib.build_filenamev([Me.path, 'ui', 'apple.ui'])}`,
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
