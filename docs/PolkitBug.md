---
layout: default
title: Polkit Delay bug
nav_order: 6
permalink: /polkitbug
---

# UPDATE: Bug Fix Status (Polkit 126)

- The underlying bug has been fully fixed in Polkit 126.
- See the [upstream patch](https://github.com/polkit-org/polkit/pull/580)
- If you are running Polkit 126 or newer, the sudo workaround described below is no longer required.
- Polkit 124 and 125 are still affected and require the sudo patch when running under Wayland.


## Bug with Polkit on Ubuntu/Debian running Wayland

- Users have reported a **2.5-minute delay** when setting the threshold using `pkexec`.
- Troubleshooting indicates this issue occurs on **Ubuntu (Wayland)** and **Debian (Wayland)** systems running **polkit version 124 or greater**.
- When the extension runs the `pkexec` command to set the threshold, the execution takes 2.5 minutes.
- This causes the extension to either start after a 2.5-minute delay or take the same time to apply the threshold. (Newer extension versions will display a timeout message after 5 seconds.)
- I have created a script to use sudo instead of pkexec command as a workaround for this issue.

<br>

## Systems Affected by the Delay in pkexec Execution

- ** Known Affected Systems:**
  - Ubuntu-based systems with `polkit >= 124` running Wayland.
  - Debian-based systems with `polkit >= 124` running Wayland.

- **Known Non-Affected Systems:**
  - Ubuntu-based systems with `polkit >= 124` running Xorg.
  - Debian-based systems with `polkit >= 124` running Xorg.
  - Fedora systems (both Wayland and Xorg).

<br>

## Workaround: Use sudo Instead of pkexec

To resolve this issue, replace `pkexec` with `sudo` for commands setting the threshold. This requires creating an exemption to allow `batteryhealthchargingctl` to run with `sudo` without requiring a password. 
This can be done:
* **Using bash script provided**.
or
* **Do it yourself by editing sudo config files and extension files manually**

<br>

## Workaround Using the Script

[Download script](https://raw.githubusercontent.com/maniacx/Battery-Health-Charging/Documentation/battery-health-charging-resources/downloads/bhc_patch.zip){: .btn .btn-blue .button2-fixed-width}<br>


### Note
Some systems, like Debian, do not add users to the `sudo` group by default. If prompted, use `su` instead of `sudo` to update the configuration.

### Steps
Run the script using:
```
bash bhc_patch.sh
```
If running the script for the first time, use **Option A** to perform all operations.

### Options Available
- **Option 1:** Install Polkit rules and `batteryhealthchargingctl` (if not already installed).
- **Option 2:** Modify the sudo configuration to allow `batteryhealthchargingctl` to run without a password. This creates the sudo configuration file `/etc/sudoers.d/batteryhealthcharging-{username}`.
- **Option 3:** Patch the Battery Health Charging extension by replacing `pkexec` with `sudo` in `driver.js` and `helper.js`.
- **Option A:** Perform all the above operations.
- **Option 4:** Remove the sudo configuration, deleting the `/etc/sudoers.d/batteryhealthcharging-{username}` file.

<br>

##  Workaround: Do it yourself

If you do no want to run the script, you can edit files yourself.

### Important Notes
- Replace `{USERNAME}` with your actual username in all the following steps below. example instead of 
- If unsure of your username, run the command `whoami` in the terminal.

### 1. Edit Sudoer Configuration
Rather than modifying `/etc/sudoers` directly, create a file in the `/etc/sudoers.d/` directory to leave the original file untouched for easier upgrades.

1. Create a sudo configuration file:
```
   sudo visudo -f /etc/sudoers.d/batteryhealthcharging-{USERNAME}
```

2. Add the following line to the file:
```
   %{USERNAME} ALL=NOPASSWD:/usr/local/bin/batteryhealthchargingctl-{USERNAME}
```
 Replace `{USERNAME}` with your username. 

This will allow `batteryhealthchargingctl` to execute with `sudo` without requiring a password.


### 2. Edit the Battery Health Charging Extension

Replace `pkexec` with `sudo` in the following files:
`~/.local/share/gnome-shell/extensions/Battery-Health-Charging@maniacx.github.com/lib/driver.js`

`~ /home/abc123/.local/share/gnome-shell/extensions/Battery-Health-Charging@maniacx.github.com/lib/helper.js`

#### Example: Modifying driver.js

Change this line:
```
const argv = ['pkexec', ctlPath, 'CHECKINSTALLATION', resourceDir, user];
```
To:
```
const argv = ['sudo', ctlPath, 'CHECKINSTALLATION', resourceDir, user];
```

<br>

## Modifying the Extension to Support `sudo`

Instead of creating a script, why not integrate these changes directly into the extension to support `sudo`?

### Reasons for Not Integrating `sudo` with the Extension
- All GNOME systems use Polkit.
- Not all systems use `sudo`; some may prefer a different privilege escalation tool.
- Setting up `sudo` configurations for different systems can become quite complex.
- For now, let's rely on the script and hope the Polkit delay bug in Wayland is resolved in the future.



