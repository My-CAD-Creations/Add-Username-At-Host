// NEW IMPORTS: Using modern gi:// and resource:/// paths
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

// Define the Extension Preferences Class
// It MUST extend ExtensionPreferences
export default class AddUsernameAtHostPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        // Access settings using the modern class method
        this._settings = this.getSettings();

        // 1. Create the main preference page
        const page = new Adw.PreferencesPage({
            title: _('General Settings'),
            icon_name: 'preferences-system-symbolic',
        });
        
        // 2. Create a preference group (replaces Gtk.Grid for modern layout)
        const group = new Adw.PreferencesGroup({
            title: _('IP Address Display'),
        });
        
        // --- Setting 1: Show Local IP (Replaces showLocalIPLabel and showLocalIPSwitch) ---
        const localIPSwitch = new Gtk.Switch({
            active: this._settings.get_boolean('show-local-ip'),
            valign: Gtk.Align.CENTER,
        });
        
        const localIPRow = new Adw.ActionRow({
            title: _('Show LAN IP'), // Your original Gtk.Label text
            subtitle: _('Display the internal network address next to the hostname.'),
            activatable: true,
        });

        // Bind the Gtk.Switch to the GSettings key
        this._settings.bind(
            'show-local-ip',
            localIPSwitch,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        localIPRow.add_suffix(localIPSwitch);
        localIPRow.set_activatable_widget(localIPSwitch);
        
        // --- Setting 2: Show WAN IP (Replaces showWanIPLabel and showWanIPSwitch) ---
        const wanIPSwitch = new Gtk.Switch({
            active: this._settings.get_boolean('show-wan-ip'),
            valign: Gtk.Align.CENTER,
        });

        const wanIPRow = new Adw.ActionRow({
            title: _('Show WAN IP'), // Your original Gtk.Label text
            subtitle: _('Display the public internet address next to the hostname.'),
            activatable: true,
        });

        // Bind the Gtk.Switch to the GSettings key
        this._settings.bind(
            'show-wan-ip',
            wanIPSwitch,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        wanIPRow.add_suffix(wanIPSwitch);
        wanIPRow.set_activatable_widget(wanIPSwitch);
        
        // 3. Add rows to the group, and group to the page
        group.add(localIPRow);
        group.add(wanIPRow);
        page.add(group);
        
        // 4. Add the page to the preferences window
        window.add(page);
    }
}
