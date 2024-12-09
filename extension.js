const { St, GLib, Gio, Clutter } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ByteArray = imports.byteArray;
const ExtensionUtils = imports.misc.extensionUtils;
const Mainloop = imports.mainloop;

class AddUsernameAtHostExtension {
    constructor() {
        this._settings = null;
        this._panelButton = null;
        this._updateInterval = 10;  // Update interval in seconds
    }

    enable() {
        log('Enabling AddUsernameAtHostExtension');

        try {
            const schemaDir = ExtensionUtils.getCurrentExtension().path + '/schemas';
            const schemaSource = Gio.SettingsSchemaSource.new_from_directory(
                schemaDir,
                Gio.SettingsSchemaSource.get_default(),
                false
            );

            log('Setting up GSettings');
            const schema = schemaSource.lookup('org.gnome.shell.extensions.add-username-at-host', true);
            if (!schema) {
                throw new Error('Schema org.gnome.shell.extensions.add-username-at-host could not be found');
            }

            this._settings = new Gio.Settings({ settings_schema: schema });

            this._settings.connect('changed::show-local-ip', () => this._updateLabelText());
            this._settings.connect('changed::show-wan-ip', () => this._updateLabelText());

            let username = GLib.get_user_name();
            let hostname = GLib.get_host_name();

            log(`Username: ${username}, Hostname: ${hostname}`);
            this._panelButton = new PanelMenu.Button(0.0, "Add-Username-At-Host", false);
            this._label = new St.Label({
                text: `${username}@${hostname}`,
                y_expand: true,
                y_align: Clutter.ActorAlign.CENTER,
            });
            this._panelButton.add_child(this._label);

            this._getLocalIP((localIP) => {
                this._localIP = localIP;
                log(`Local IP: ${this._localIP}`);

                this._getWanIP((wanIP) => {
                    log(`WAN IP: ${wanIP}`);
                    this._wanIP = wanIP;
                    this._addMenuItems(this._localIP, this._wanIP);
                    this._updateLabelText();
                    this._startUpdateLoop();
                });
            });

            Main.panel.addToStatusArea("add-username-at-host", this._panelButton);
        } catch (e) {
            logError(e, 'Error enabling Add-Username-At-Host extension');
        }
    }

    _getLocalIP(callback) {
        try {
            let [status, stdout, stderr] = GLib.spawn_command_line_sync("hostname -I");
            let localIP = status ? ByteArray.toString(stdout).trim() : "N/A";
            callback(localIP);
        } catch (e) {
            logError(e, 'Error fetching Local IP');
            callback("N/A");
        }
    }

    _getWanIP(callback) {
        try {
            let proc = new Gio.Subprocess({
                argv: ['curl', '-s', 'ifconfig.me'],
                flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            });

            proc.init(null);
            proc.communicate_utf8_async(null, null, (proc, res) => {
                let [ok, stdout, stderr] = proc.communicate_utf8_finish(res);
                let wanIP = ok ? stdout.trim() : "N/A";
                callback(wanIP);
            });
        } catch (e) {
            logError(e, 'Error fetching WAN IP');
            callback("N/A");
        }
    }

    _updateLabelText() {
        let showLocalIP = this._settings.get_boolean('show-local-ip');
        let showWanIP = this._settings.get_boolean('show-wan-ip');
        let username = GLib.get_user_name();
        let hostname = GLib.get_host_name();

        let labelText = `${username}@${hostname}`;
        if (showLocalIP) {
            labelText += `   LAN: ${this._localIP}`;
        }
        if (showWanIP) {
            labelText += `   WAN: ${this._wanIP}`;
        }
        this._label.set_text(labelText);
    }

    _addMenuItems(localIP, wanIP) {
        let menu = this._panelButton.menu;
        menu.removeAll();

        menu.addMenuItem(new PopupMenu.PopupMenuItem(`Local IP: ${localIP}`));
        menu.addMenuItem(new PopupMenu.PopupMenuItem(`WAN IP: ${wanIP}`));
    }

    _startUpdateLoop() {
        log('Starting update loop');
        this._updateLoop = Mainloop.timeout_add_seconds(this._updateInterval, () => {
            this._checkForIPChanges();
            return true; // Continue the loop
        });
    }

    _checkForIPChanges() {
        this._getLocalIP((localIP) => {
            if (localIP !== this._localIP) {
                log(`Local IP changed: ${localIP}`);
                this._localIP = localIP;
                this._updateLabelText();
                this._addMenuItems(this._localIP, this._wanIP);
            }

            this._getWanIP((wanIP) => {
                if (wanIP !== this._wanIP) {
                    log(`WAN IP changed: ${wanIP}`);
                    this._wanIP = wanIP;
                    this._updateLabelText();
                    this._addMenuItems(this._localIP, this._wanIP);
                }
            });
        });
    }

    disable() {
        log('Disabling AddUsernameAtHostExtension');
        if (this._panelButton) {
            this._panelButton.destroy();
            this._panelButton = null;
        }
        if (this._updateLoop) {
            Mainloop.source_remove(this._updateLoop);
            this._updateLoop = null;
        }
    }
}

function init() {
    return new AddUsernameAtHostExtension();
}

