// NEW IMPORTS: Using modern gi:// and resource:/// paths
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js'; 
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js'; 
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js'; 

import St from 'gi://St';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';

export default class AddUsernameAtHostExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._settings = null;
        this._panelButton = null;
        this._localIP = '...';    
        this._wanIP = '...';      
        this._updateInterval = 10; 
        this._updateLoop = null;   
    }

    enable() {
        // Removed: log('Enabling AddUsernameAtHostExtension');

        try {
            this._settings = this.getSettings();

            this._settings.connect('changed::show-local-ip', () => this._updateLabelText());
            this._settings.connect('changed::show-wan-ip', () => this._updateLabelText());

            let username = GLib.get_user_name();
            let hostname = GLib.get_host_name();

            // Removed: log(`Username: ${username}, Hostname: ${hostname}`);
            
            // 1. Initialize the Panel Button
            this._panelButton = new PanelMenu.Button(0.0, "Add-Username-At-Host", false);
            this._label = new St.Label({
                text: `${username}@${hostname}`, 
                y_expand: true,
                y_align: Clutter.ActorAlign.CENTER,
            });
            this._panelButton.add_child(this._label);
            
            // 2. Add the button to the panel immediately
            Main.panel.addToStatusArea("add-username-at-host", this._panelButton);
            
            // 3. Setup menu with placeholder IPs
            this._addMenuItems(this._localIP, this._wanIP); 

            // 4. Start fetching the real IPs asynchronously
            this._fetchAndSetupIPs();

            // 5. Start the periodic update loop
            this._startUpdateLoop();

        } catch (e) {
            // Kept: logError is important for catching major initialization failures
            logError(e, 'Error enabling Add-Username-At-Host extension', e); 
        }
    }

    _fetchAndSetupIPs() {
        this._getLocalIP((localIP) => {
            this._localIP = localIP;
            // Removed: log(`Local IP: ${this._localIP}`);

            this._getWanIP((wanIP) => {
                this._wanIP = wanIP;
                // Removed: log(`WAN IP: ${this._wanIP}`);
                
                this._updateLabelText();
                this._addMenuItems(this._localIP, this._wanIP);
            });
        });
    }

    _getLocalIP(callback) {
        try {
            let [ok, stdout, stderr, exit_status] = GLib.spawn_command_line_sync("hostname -I");
            
            if (!ok) {
                 // Kept: Log failure details for external commands
                 log(`hostname -I failed. Exit status: ${exit_status}. Error: ${new TextDecoder().decode(stderr).trim()}`);
            }
            
            let localIP = ok 
                ? new TextDecoder().decode(stdout).trim()
                : "N/A";
                
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
                try {
                    let [ok, stdout, stderr] = proc.communicate_utf8_finish(res);
                    
                    if (!ok) {
                        // Kept: Log failure details for external commands
                        log(`curl ifconfig.me failed. Error: ${stderr.trim()}`);
                    }

                    let wanIP = ok ? stdout.trim() : "N/A";
                    callback(wanIP);
                } catch (e) {
                    logError(e, 'Error finishing WAN IP subprocess');
                    callback("N/A");
                }
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
            if (this._localIP && this._localIP !== '...') {
                labelText += `    LAN: ${this._localIP}`;
            }
        }
        if (showWanIP) {
            if (this._wanIP && this._wanIP !== '...') {
                labelText += `    WAN: ${this._wanIP}`;
            }
        }
        this._label.set_text(labelText);
    }

    _addMenuItems(localIP, wanIP) {
        let menu = this._panelButton.menu;
        menu.removeAll();

        menu.addMenuItem(new PopupMenu.PopupMenuItem(`Local IP: ${localIP}`));
        menu.addMenuItem(new PopupMenu.PopupMenuItem(`WAN IP: ${wanIP}`));
        
        menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        
        let prefsItem = new PopupMenu.PopupMenuItem("Settings");
        prefsItem.connect('activate', () => {
            this.openPreferences(); 
        });
        menu.addMenuItem(prefsItem);
    }

    _startUpdateLoop() {
        // Removed: log('Starting update loop');
        
        this._updateLoop = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, this._updateInterval, () => {
            this._checkForIPChanges();
            return GLib.SOURCE_CONTINUE; 
        });
    }

    _checkForIPChanges() {
        this._getLocalIP((localIP) => {
            let updateNeeded = false;
            
            if (localIP !== this._localIP) {
                // Kept: This log is useful for confirming a change happened
                // log(`Local IP changed: ${localIP}`);
                this._localIP = localIP;
                updateNeeded = true;
            }

            this._getWanIP((wanIP) => {
                if (wanIP !== this._wanIP) {
                    // Kept: This log is useful for confirming a change happened
                    // log(`WAN IP changed: ${wanIP}`);
                    this._wanIP = wanIP;
                    updateNeeded = true;
                }
                
                if (updateNeeded) {
                    this._updateLabelText();
                    this._addMenuItems(this._localIP, this._wanIP);
                }
            });
        });
    }

    disable() {
        // Removed: log('Disabling AddUsernameAtHostExtension');
        
        if (this._updateLoop) {
            GLib.source_remove(this._updateLoop);
            this._updateLoop = null;
        }

        if (this._panelButton) {
            this._panelButton.destroy();
            this._panelButton = null;
        }
        
        if (this._settings) {
             this._settings.run_dispose();
             this._settings = null;
        }
    }
}
