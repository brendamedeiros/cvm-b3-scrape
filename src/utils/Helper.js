const http = require('http');
const fs = require('fs');
const extractZip = require('extract-zip');
const { EEXIST } = require('constants');

exports.downloadFileByURL = (baseDir, url, fileName, cb) => {
    try {
        if (!fs.existsSync(baseDir)){
            fs.mkdirSync(baseDir, { recursive: true });
        }
    } catch (err) {
        if (err.code === EEXIST) {
            console.log('It already exists');
        }
    }

    const file = `${baseDir}/${fileName}`;
    const fileStream = fs.createWriteStream(file);
    const req = http.get(url, (res) => {
        res.pipe(fileStream);
        fileStream.on('finish', async () => {
            if (res.headers['content-type'] === 'application/zip') {
                console.log('yes');
                try {
                    await extractZip(file, { dir: baseDir });
                } catch (err) {
                    console.log(err);
                }
            } else {
                fileStream.close(cb);
            }
        })
    }).on('error', (err) => {
        fs.unlink(file);
        if (cb) {
            cb(err.message);
        }
    })
};

exports.formattedDate = (isDayBefore = false) => {
    const d = new Date();
    if (isDayBefore) {
        d.setDate(d.getDate() - 1);
    }

    const currentDate  = ("0" + d.getDate()).slice(-2)
    const currentMonth = ("0" + (d.getMonth() + 1)).slice(-2);
    const currentYear  = d.getFullYear();

    return `${currentYear}-${currentMonth}-${currentDate}`;
}