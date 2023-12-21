---
layout: default
title: Pull Request Guide
nav_order: 3
parent: Translation
permalink: /pull-request-guide
---
<style>
    .button2-fixed-width {
        width:180px;
    }
</style>

# GitHub Pull Request Guide

This guide will walk you through the process of uploading your translation file to GitHub and creating a pull request.

## Upload File to GitHub. Step-by-Step Instructions

### 1. Ensure your translation file (e.g., `fr.po` for French) is ready for upload.

---
### 2. Fork the <span class="fs-2">[Battery-Health-Charging](https://github.com/maniacx/Battery-Health-Charging){: .btn .btn-purple .v-align-bottom}</span> on GitHub.
<img src="./assets/images/translation/pull-request-guide/fork.png" width="100%">

---
### 3. Uncheck `Copy the main branch only` and click `Create Fork`.
<img src="./assets/images/translation/pull-request-guide/create-a-fork.png" width="100%">

---
### 4. Choose the appropriate branch for your work. In this example, we're using `GNOME45`.

---
### 5. Under `Find or create a branch`, name your new branch (e.g., `french-translation`).

---
### 6. Click `Create branch: french-translation`.
<img src="./assets/images/translation/pull-request-guide/create-branch.png" width="100%">

---
### 7. Navigate to the `po` folder, click `Add file`, and then `Upload files`.
<img src="./assets/images/translation/pull-request-guide/upload-file.png" width="100%">

---
### 8. Drag and drop your translated file (e.g., `fr.po`) or choose to upload it.

---
### 9. Add a commit message and description (e.g., `updated french translation`).

---
### 10. Click `Commit changes`.
<img src="./assets/images/translation/pull-request-guide/file-commit.png" width="100%">

---
### 11. Click `Compare & Pull Request`.
![Compare & Pull Request](./assets/images/translation/pull-request-guide/compare-pr.png){:width="100%"}

---
### 12. Ensure you have selected the correct branch (e.g., `GNOME45`).

---
### 13. Enter your message details and description, then click `Create pull request`.
<img src="./assets/images/translation/pull-request-guide/open-pr.png" width="100%">

---
## Pull Request Completed

Congratulations! You've successfully created a pull request for your translation.

[Poedit Guide](./poedit-guide){: .btn .btn-blue .button2-fixed-width}<br>
[Crowdin Guide](./crowdin-guide){: .btn .btn-green .button2-fixed-width}

