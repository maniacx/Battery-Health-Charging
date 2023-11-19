---
layout: default
title: Poedit Guide
nav_order: 1
parent: Translation
permalink: /poedit-guide
---
<style>
    .button1-fixed-width {
        width:100px;
    }
    .button2-fixed-width {
        width:180px;
    }
</style>

# Poedit Guide

## Download Source File
* The source file is found under `po` directory `Battery-Health-Charging.pot`
* Extension is has two branches. 
 1. <span class="fs-2">[GNOME42-44](https://github.com/maniacx/Battery-Health-Charging/blob/GNOME42-44/po/Battery-Health-Charging.pot){: .btn .btn-purple .v-align-bottom .button1-fixed-width}</span>  for `Gnome 42 43 44`. 
 2. <span class="fs-2">[GNOME45](https://github.com/maniacx/Battery-Health-Charging/blob/GNOME45/po/Battery-Health-Charging.pot){: .btn .btn-purple .v-align-bottom .button1-fixed-width}</span> for `Gnome 45` and later.

## Methods
We can begin by:
1. [**Create translation po files for a new language**](#create-translation-po-files-for-a-new-language): We create a new language file, when zero contibutions have been made to that language and the `po` file does not exist for that language.
2. [**Update translation po file for an existing language**](#update-translation-po-file-for-an-existing-language): When translator have already contributed to the language and the `po` file exist, but you want to correct a translation or input translation to a untranslated string.

<br>
<br>
## Create translation po files for a new language

### We will use Brazilian Portuguese as an example in the pictures below.

---
### 1. Click `Create new...`

<img src="./assets/images/translation/poedit-guide/create-new.png" width="40%">

---
### 2. Select file `Battery Health Charging.pot` and Click `Open` 

<img src="./assets/images/translation/poedit-guide/create-open-dialog.png" width="80%">

---
### 3. Select language and Click `Ok`

<img src="./assets/images/translation/poedit-guide/create-select-language.png" width="40%">

---
### 4. Select the string to translate
### 5. Enter the translation for the selected string
### 6. Repeat the same for other strings
### 7.  Once complete click `Save`

<img src="./assets/images/translation/poedit-guide/create-translation.png" width="100%">

---
### 8. Save the file with `.po` extension

<img src="./assets/images/translation/poedit-guide/create-save.png" width="80%">

---

### 9. Once the file is saved (For example pt_BR.po for Brazillian Portuguese), create a Pull Request to upload on Github.

<br>
[Pull Request Guide](./pull-request-guide){: .btn .btn-purple .button2-fixed-width}<br>
[Crowdin Guide](./crowdin-guide){: .btn .btn-green .button2-fixed-width}

---



## Update translation po file for an existing language

### We will use Brazilian Portuguese as an example in the pictures below.

---
### 1. Click `Browse files...`

<img src="./assets/images/translation/poedit-guide/update-new.png" width="40%">

---
### 2. Select file `pt_BR.po` and Click `Open` 

<img src="./assets/images/translation/poedit-guide/update-open-dialog.png" width="80%">

---
### 3. Click `Translation`  and `Update from POT file`
<br>
<img src="./assets/images/translation/poedit-guide/update-pot-file.png" width="100%">

---
### 4. Select file `Battery Health Charging.pot` and Click `Open` 

<img src="./assets/images/translation/poedit-guide/update-open-template.png" width="80%">

---
### 5. Select the string to translate
### 6. Enter the translation for the selected string
### 7. Repeat the same for other strings
### 8.  Once complete click `Save`

<img src="./assets/images/translation/poedit-guide/update-translation.png" width="100%">

---

### 9. Once the file is saved (For example pt_BR.po for Brazillian Portuguese), create a Pull Request to upload on Github.

<br>
[Pull Request Guide](./pull-request-guide){: .btn .btn-purple .button2-fixed-width}<br>
[Crowdin Guide](./crowdin-guide){: .btn .btn-green .button2-fixed-width}

