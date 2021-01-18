const fs = require('fs');
const path = require('path');
const { downloadFileByURL, formattedDate } = require('../utils/Helper');

const baseURL = 'http://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv';
const fileName = `cadastro_cia_aberta-${formattedDate()}.csv`;

const baseDir = path.resolve(__dirname, 'tmp', 'DadosCadastraisCVM');

const downloadAndProcessFile = async () => {
    return new Promise((resolve, reject) => {
        const download = downloadFileByURL(baseDir, baseURL, fileName, () => {
            if (fs.existsSync(fileName)) {
                fs.readFile(`${baseDir}/${fileName}`, 'latin1', (err, content) => {
                    const headerArr = content.split('\r\n')[0].toString().split(';');
                    const dataArr = content.split('\r\n').filter((_, i) => i > 0);
                    const mainContent = [];
                    let cvmCompanyDetails = [];

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

                        cvmCompanyDetails.push(mergedContentObj);
                    });
    
                    cvmCompanyDetails = cvmCompanyDetails.filter(obj => obj.SIT !== 'CANCELADA');

                    const jsonFile = JSON.stringify(cvmCompanyDetails, null, 2);
                    fs.writeFile(`${baseDir}/cvm_company_details-${formattedDate()}.json`, jsonFile, 'utf8', (err) => {
                        if (err) throw err;
                    });
                    fs.unlink(`${baseDir}/${fileName}`, (err) => {
                        if (err) throw err;
                    });
                });
            }
        });

        resolve(download);
    });
}

(async() => {
    const finalFile = await downloadAndProcessFile();
})();

