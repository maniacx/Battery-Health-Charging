'use strict';
const {Gio, GObject} = imports.gi;
const Main = imports.ui.main;
const QuickSettings = imports.ui.quickSettings;
const QuickSettingsMenu = Main.panel.statusArea.quickSettings;

var PolkitErrorIndicator = GObject.registerClass(
    class PolkitErrorIndicator extends QuickSettings.SystemIndicator {
        constructor(dir) {
            super();
            this._indicator = this._addIndicator();
            QuickSettingsMenu._indicators.insert_child_at_index(this, 0);

            this._indicator.gicon = Gio.icon_new_for_string(`${dir.get_child('icons/hicolor/scalable/actions')
               .get_path()}/bhc-polkit-error-symbolic.svg`);
        }
    }
);

