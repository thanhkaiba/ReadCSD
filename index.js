#!/usr/bin/env node
const fs = require("fs")
const lineReader = require('line-reader');
const path = require("path");


const PATH_SYNTAX = 'Path=';
const CSD_FOLDER_SYNTAX = 'zccs';
const EXT_NAME = '.csd';
const copiedMap = {};
const folder_map = {};
const args = process.argv.slice(2);

let filePath = args[0];
const csdFolder = args[1] || CSD_FOLDER_SYNTAX;

filePath = convertPath(filePath);

if (!path.isAbsolute(filePath)) {
    console.log('relative path detect')
    filePath =  path.resolve(filePath);
}



const res_folder = (() => {
    const path_array = (filePath.split(path.sep));
    const index = path_array.indexOf(csdFolder);
    return path.join.apply(null, path_array.slice(0, index));
})();


if (!is_dir(filePath)) {
    readCsd(filePath);
} else {
    const filePaths = fs.readdirSync(filePath);
    filePaths.forEach(file => {
        readCsd(convertPath(path.join(filePath, file)));
    });
}


function convertPath(filePath) {
    return filePath.replace(new RegExp('\\' + path.sep, 'g'), path.sep);
}




function copyFile (pathToFile, pathToNewDestination) {
    if (!copiedMap[pathToFile]) {
        copiedMap[pathToFile] = true;

        if (fs.existsSync(pathToFile) && !fs.existsSync(pathToNewDestination)) {
            ensureDirectoryExistence(pathToNewDestination);
            fs.copyFile(pathToFile, pathToNewDestination, (err) => {
                if (err) console.error(err.message);
            });
        } else {
            console.error('File not found: ', pathToFile);
        }
    }
}

function readCsd(filePath) {


    const ext = path.extname(filePath);
    if (ext === EXT_NAME) {
        if (!fs.existsSync(filePath)) {
            console.error('WRONG PATH!!!', filePath);
            return;
        }
        lineReader.eachLine(filePath, function (line) {
            if (line.includes(PATH_SYNTAX)) {
                const resFile = line.match(/.*Path="(.*?)".*/)[1];
                const pathToFile = path.join(res_folder, resFile);
                const pathToNewDestination = path.join(res_folder, "backups", resFile);
                copyFile(pathToFile, pathToNewDestination);
            }
        });

        //copy csd file
        const file_name_arrays = filePath.split(path.sep);
        const index = file_name_arrays.indexOf(CSD_FOLDER_SYNTAX);
        const a = file_name_arrays.slice(0, index).join(path.sep);
        const b = file_name_arrays.slice(index).join(path.sep);


        copyFile(filePath, path.join(file_name_arrays.slice(0, index).join(path.sep), "backups", file_name_arrays.slice(index).join(path.sep)));


    } else {
        console.error('File extension not support', ext);
    }
}





function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (folder_map[dirname] || fs.existsSync(dirname)) {
        folder_map[dirname] = true;
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

function is_dir(path) {
    try {
        const stat = fs.lstatSync(path);
        return stat.isDirectory();
    } catch (e) {
        // lstatSync throws an error if path doesn't exist
        return false;
    }
}
