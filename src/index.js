const args = process.argv
const chalk = require('chalk');
const path = require('path');
const fse = require('fs-extra');
const fs = require('file-system');
const async = require('async');

const L = console.log;
const error = chalk.red;
const warning = chalk.yellow;
const info = chalk.blue;
const success = chalk.green;
let projectName = args[2];
let htmlFileName = args[3] || 'index.html';
let scriptFileName = args[4] || 'index.js';
let stylesFileName = args[5] || 'styles.css';

let styleTag = `<link href="${stylesFileName}" rel="stylesheet" type="text/css">`;
let scriptTag = `<script src="${scriptFileName}"></script>`
let htmlContent = `<!DOCTYPE html><html><head><title>${projectName}</title><meta charset="utf-8">${styleTag}${scriptTag}</head><body></body></html>`;



function validate() {
    if (projectName) {
        const absPath = path.resolve(projectName);

        const params = {
            AbsolutePath: absPath,
            IsValidPath: false,
            ProjectName: projectName
        }
        async.waterfall([
            async.constant(params),
            checkPath,
            createDirectory,
            createFiles
        ], (error, res) => {
            if (error)
                process.exit(0);
            else {
                L(success('Project created successfully'));
            }
        });

    } else {
        L(error("Please specify a project name"));
        process.exit(0);
    }
}


function checkPath(params, callback) {
    fse.pathExists(params.AbsolutePath).then((exists) => {
        params.IsValidPath = true;
        callback(null, params);
    }, (err) => {
        callback(null, err);
    });
}


function createDirectory(params, callback) {
    if (params.IsValidPath) {
        fse.mkdir(params.ProjectName).then((success) => {
            callback(null, params);
        }, (fail) => {
            if (fail && fail.code == "EEXIST") {
                L(error("File already exists, please specify another name"));
            } else {
                L(error("Some problem occurred ! Please try again"));
            }
            callback(fail, params);
        });
    }

}


function createFiles(params, callback) {
    const { htmlObj, scriptsObj, stylesObj } = populateObjects(params.AbsolutePath);

    async.eachSeries([
        htmlObj, stylesObj, scriptsObj
    ], writeFileAsync, (err) => {
        if (err) {
            L(error('Problem in creating file, please try again !'))
            callback(null, err);
        } else {
            callback(null, params);
        }
    });
}

function populateObjects(absPath) {
    let htmlObj = {
        fileName: `${absPath}/${htmlFileName}`,
        content: htmlContent
    }
    let stylesObj = {
        fileName: `${absPath}/${stylesFileName}`,
        content: ''
    }
    let scriptsObj = {
        fileName: `${absPath}/${scriptFileName}`,
        content: ''
    }
    return {
        htmlObj, stylesObj, scriptsObj
    }
}

function writeFileAsync(obj, callback) {
    const { fileName, content } = obj;
    fs.writeFile(fileName, content, {}, (err) => {
        if (err) {
            callback(err)
        } else {
            callback(null);
        }
    });
}

module.exports = validate;