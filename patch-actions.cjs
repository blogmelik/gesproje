const fs = require('fs');

const apkStep = `
      - name: Push APK to builds branch
        run: |
          git config --global user.name 'github-actions[bot]'
          git config --global user.email 'github-actions[bot]@users.noreply.github.com'
          git fetch origin builds || echo "Branch not found"
          git checkout builds || git checkout -b builds
          mkdir -p release
          cp android/app/build/outputs/apk/debug/app-debug.apk release/SahaTakip-Guncel.apk
          git add release/SahaTakip-Guncel.apk
          git commit -m "Auto-update APK" || echo "No changes"
          git push origin builds --force
`;

let apkYml = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');
if (!apkYml.includes('Push APK to builds branch')) {
    apkYml += apkStep;
    fs.writeFileSync('.github/workflows/build-apk.yml', apkYml);
}

const exeStep = `
    - name: Push EXE to builds branch
      run: |
        git config --global user.name 'github-actions[bot]'
        git config --global user.email 'github-actions[bot]@users.noreply.github.com'
        git fetch origin builds || echo "Branch not found"
        git checkout builds || git checkout -b builds
        mkdir -p release
        cp dist-electron/*.exe release/SahaTakip-Masaustu-Guncel.exe || echo "Copy failed"
        git add release/SahaTakip-Masaustu-Guncel.exe
        git commit -m "Auto-update EXE" || echo "No changes"
        git push origin builds --force
`;

let exeYml = fs.readFileSync('.github/workflows/build-exe.yml', 'utf8');
if (!exeYml.includes('Push EXE to builds branch')) {
    exeYml += exeStep;
    fs.writeFileSync('.github/workflows/build-exe.yml', exeYml);
}
