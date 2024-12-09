const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const ExtensionUtils = imports.misc.extensionUtils;

function init() {
}

function buildPrefsWidget() {
    let settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.add-username-at-host');

    let prefsWidget = new Gtk.Grid({
        column_spacing: 12,
        row_spacing: 12,
        visible: true
    });

    let showLocalIPLabel = new Gtk.Label({
        label: "Show LAN IP",
        halign: Gtk.Align.START
    });
    showLocalIPLabel.set_margin_top(10);
    showLocalIPLabel.set_margin_bottom(10);

    let showLocalIPSwitch = new Gtk.Switch({
        active: settings.get_boolean('show-local-ip'),
        halign: Gtk.Align.END
    });
    showLocalIPSwitch.set_margin_top(10);
    showLocalIPSwitch.set_margin_bottom(10);

    settings.bind(
        'show-local-ip',
        showLocalIPSwitch,
        'active',
        Gio.SettingsBindFlags.DEFAULT
    );

    prefsWidget.attach(showLocalIPLabel, 0, 0, 1, 1);
    prefsWidget.attach(showLocalIPSwitch, 1, 0, 1, 1);

    let showWanIPLabel = new Gtk.Label({
        label: "Show WAN IP",
        halign: Gtk.Align.START
    });
    showWanIPLabel.set_margin_top(10);
    showWanIPLabel.set_margin_bottom(10);

    let showWanIPSwitch = new Gtk.Switch({
        active: settings.get_boolean('show-wan-ip'),
        halign: Gtk.Align.END
    });
    showWanIPSwitch.set_margin_top(10);
    showWanIPSwitch.set_margin_bottom(10);

    settings.bind(
        'show-wan-ip',
        showWanIPSwitch,
        'active',
        Gio.SettingsBindFlags.DEFAULT
    );

    prefsWidget.attach(showWanIPLabel, 0, 1, 1, 1);
    prefsWidget.attach(showWanIPSwitch, 1, 1, 1, 1);

    return prefsWidget;
}
