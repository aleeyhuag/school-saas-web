#!/bin/sh
# Run ONCE from the school-saas-web folder, after copying this patch in.
# Removes build leftovers from Git (they stay on your disk). In particular
# android/local.properties holds your Windows SDK path and would break the
# GitHub build.
git rm -r --cached --ignore-unmatch \
  android/.gradle \
  android/build \
  android/local.properties \
  android/app/src/main/assets/public \
  android/app/src/main/assets/capacitor.config.json \
  android/app/src/main/assets/capacitor.plugins.json \
  android/app/src/main/res/xml/config.xml
echo "Done. Now: git add -A && git commit -m 'Android build on GitHub' && git push"
