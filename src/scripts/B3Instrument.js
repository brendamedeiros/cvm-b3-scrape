const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { formattedDate } = require('../utils/Helper');
const { exit } = require('process');

const dateArg = process.argv.slice(2)[0];
const downloadArg = dateArg === undefined ? formattedDate() : dateArg;

const baseURL = `http://arquivos.b3.com.br/tabelas/InstrumentsConsolidated/${downloadArg}?lang=pt`;
const baseDir = path.resolve(__dirname, 'tmp', 'B3Instrument');

try {
    if (!fs.existsSync(baseDir)){
        fs.mkdirSync(baseDir, { recursive: true });
    }
} catch (err) {
    if (err.code === EEXIST) {
        console.log('It already exists');
    }
}

puppeteer.launch().then(async browser => {
    let page = await browser.newPage();

    return new Promise(async (resolve, reject) => {
        console.info(`Reaching ${baseURL}`);

        await page.goto(baseURL);

        if ((await page.$('#label-nao-encontrado')) !== null) {
            exit();
        }

        let [downloadFileBtn] = await page.$x("//a[contains(., 'Baixar arquivo completo')]");

        if (downloadFileBtn) {
            console.log("it exists");
            await downloadFileBtn.click();
        }

        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: baseDir,
        });


        page.on('request', async(req) => {
            if (req._resourceType === 'fetch' && req._url.includes('download')) {
                setTimeout(() => browser.close(), 5000);
            }
        });

        resolve();
    });
}).then(() => processFile());

const processFile = () => {
    let file;
    fs.readdir(baseDir, (err, files) => {
        filename = files.filter(el => /\.csv$/.test(el));

        fs.readFile(`${baseDir}/${filename[0]}`, 'latin1', (err, content) => {
            const mainContent = [];
            let bovespaInstruments = [];

            const headerArr = content.split('\r\n')[0].toString().split(';');
            const dataArr = content.split('\r\n').filter((_, i) => i > 0);

            dataArr.forEach(el => {
                mainContent.push(el.split(';'));
            });

            mainContent.forEach(el => {
                const mergedContentObj = {};
                for (let i = 0; i < el.length; i++) {
                    if (/^ *$/.test(el[i])) {
                        el[i] = null;
                    }

                    for (let j = 0; j < headerArr.length; j++) {
                        mergedContentObj[headerArr[i]] = el[i];
                    }
                }

                bovespaInstruments.push(mergedContentObj);
            });

            const jsonFile = JSON.stringify(bovespaInstruments, null, 2);
            fs.writeFile(`${baseDir}/bovespa-instruments-${formattedDate()}.json`, jsonFile, 'utf8', (err) => {
                if (err) throw err;
            });
            fs.unlink(`${baseDir}/${filename}`, (err) => {
                if (err) throw err;
            });
        })
    });
}
