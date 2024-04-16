const fs = require('fs');
const path = require('path');

function printDirectoriesAndFiles(dirPath) {
  fs.readdirSync(dirPath).forEach((file) => {
    let fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      console.log('Directory:', fullPath);
      printDirectoriesAndFiles(fullPath);
    } else {
      console.log('File:', fullPath);
    }
  });
}

printDirectoriesAndFiles('./'); // Comienza desde el directorio actual
