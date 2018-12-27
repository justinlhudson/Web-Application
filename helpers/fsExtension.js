const fs = require('fs');
const dir = require('node-dir');

// Todo: do this these functions cleaner, better, nicer. look away!

module.exports = {
  // return: relative path
  getAllSubDirectoriesSync(dirPath, callback) {
    const err = undefined;
    const results = [];

    dirPath = dirPath.replace(/\\/g, String.fromCharCode(47)); // windows paths verse unix fixes
    return dir.subdirs(dirPath, function(err, subDirs) {
      _.each(subDirs, subDir =>
        _.each(fs.readdirSync(subDir), function(file) {
          const stat = fs.statSync(subDir+'/'+file);
          if (stat && stat.isFile() && !file.startsWith('.')) {
            let temp = subDir.replace(/\\/g, String.fromCharCode(47));
            temp = temp.replace(__base,""); // relative path
            //temp = temp + '/' + file
            return results.push(temp);
          }
        })
      );
      return callback(err, results);
    });
  },

  // return: relative path
  getAllFilesFromFolderSync(dirPath, callback) {
    const err = undefined;
    const results = [];

    dirPath = dirPath.replace(/\\/g, String.fromCharCode(47)); // windows paths verse unix fixes
    _.each(fs.readdirSync(dirPath), function(subDir) {
      let temp = subDir.replace(/\\/g, String.fromCharCode(47));
      temp = temp.replace(__base,"");
      temp = `/${temp}`;

      let tempPath = dirPath + temp;
      const stat = fs.statSync(tempPath);
      if (stat && stat.isDirectory()) {
        return module.exports.getAllFilesFromFolderSync(tempPath, callback);
      } else {
        tempPath = tempPath.replace(__base,'');
        return results.push(tempPath);
      }
    });

    return callback(err, results);
  }
};