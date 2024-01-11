---
layout: default
title: Poedit Guide
nav_order: 2
parent: Translation
permalink: /poedit-guide
---
<style>
    .button1-fixed-width {
        width:120px;
    }
    .button2-fixed-width {
        width:180px;
    }
</style>

# Poedit Guide

## Prerequisites
* Install Poedit using your package manager or via [Flatpak](https://flathub.org/apps/net.poedit.Poedit).
* Ensure you are logged into your GitHub account.

## Download Source File
* The source file can be found in the `po` directory: `Battery-Health-Charging.pot`.
* The extension has two branches:
 1. <span class="fs-2">[GNOME42-44](https://github.com/maniacx/Battery-Health-Charging/blob/GNOME42-44/po/Battery-Health-Charging.pot){: .btn .btn-purple .v-align-bottom .button1-fixed-width}</span>  for `Gnome 42 43 44`. 
 2. <span class="fs-2">[GNOME45](https://github.com/maniacx/Battery-Health-Charging/blob/GNOME45/po/Battery-Health-Charging.pot){: .btn .btn-purple .v-align-bottom .button1-fixed-width}</span> for `Gnome 45` and later.

## Methods
Begin by choosing one of the following methods:
1. [**Create translation PO files for a new language**](#create-translation-po-files-for-a-new-language): Use this method when no contributions have been made in your language, and a `po` file for the language does not exist.
2. [**Update translation PO file for an existing language**](#update-translation-po-file-for-an-existing-language): Choose this if you want to correct or add translations in an existing `po` file for a language.

## Create Translation PO Files for a New Language

### Example: Creating a Brazilian Portuguese Translation

---
### 1. Click `Create new...`
<img src="./assets/images/translation/poedit-guide/create-new.png" width="40%">

---
### 2. Select `Battery Health Charging.pot` and Click `Open`
<img src="./assets/images/translation/poedit-guide/create-open-dialog.png" width="80%">

---
### 3. Select language and Click `Ok`
<img src="./assets/images/translation/poedit-guide/create-select-language.png" width="40%">

---
### 4. Select the string to translate.
### 5. Enter the translation for the selected string.
### 6. Repeat for other strings.
### 7. Once complete, click `Save`.
<img src="./assets/images/translation/poedit-guide/create-translation.png" width="100%">

---
### 8. Save the file with a `.po` extension.
<img src="./assets/images/translation/poedit-guide/create-save.png" width="80%">

---
### 9. Once the file is saved (e.g., `pt_BR.po` for Brazilian Portuguese), create a Pull Request on GitHub.
[Pull Request Guide](./pull-request-guide){: .btn .btn-purple .button2-fixed-width}<br>

---
## Update Translation PO File for an Existing Language

### Example: Updating a Brazilian Portuguese Translation

---
### 1. Click `Browse files...`
<img src="./assets/images/translation/poedit-guide/update-new.png" width="40%">

---
### 2. Select `pt_BR.po` and Click `Open`
<img src="./assets/images/translation/poedit-guide/update-open-dialog.png" width="80%">

---
### 3. Click `Translation` and `Update from POT File`
<img src="./assets/images/translation/poedit-guide/update-pot-file.png" width="100%">

---
### 4. Select the pot file and Click `Open`
<img src="./assets/images/translation/poedit-guide/update-pot.png" width="100%">

---
### 5. Select the string to translate.
### 6. Enter the translation for the selected string.
### 7. Repeat for other strings.
### 8. Once complete, click `Save`.
<img src="./assets/images/translation/poedit-guide/update-translation.png" width="100%">

---
### 7. Once the file is saved (e.g., `pt_BR.po` for Brazilian Portuguese), create a Pull Request on GitHub.
[Pull Request Guide](./pull-request-guide){: .btn .btn-purple .button2-fixed-width}

