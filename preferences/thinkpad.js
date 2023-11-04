'use strict';
const {Adw, Gio, GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

var Thinkpad = GObject.registerClass({
    GTypeName: 'BHC_Thinkpad',
    Template: `file://${GLib.build_filenamev([Me.path, 'ui', 'thinkpad.ui'])}`,
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
