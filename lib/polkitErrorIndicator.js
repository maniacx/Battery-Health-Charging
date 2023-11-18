'use strict';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';

export const PolkitErrorIndicator = GObject.registerClass(
    class PolkitErrorIndicator extends QuickSettings.SystemIndicator {
        constructor(dir) {
            super();
            this._indicator = this._addIndicator();
            Main.panel.statusArea.quickSettings.addExternalIndicator(this);
            this._indicator.gicon = Gio.icon_new_for_string(`${dir.get_child('icons/hicolor/scalable/actions')
           .get_path()}/bhc-polkit-error-symbolic.svg`);
        }
    }
);

