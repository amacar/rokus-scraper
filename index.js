const http = require('https');
const fs = require('fs');

const token = 'token';
const filename = 'SZVDPLUS9UC';
const lastPage = 154;

const prepareTempFolder = () => {
  if (!fs.existsSync(filename)) {
    fs.mkdirSync(filename);
  }
};

const timeout = delay => new Promise(resolve => setTimeout(resolve, delay));

(async () => {
  prepareTempFolder();
  for (let i = 1; i <= lastPage; i++) {
    const file = fs.createWriteStream(`${filename}/${i}.pdf`);
    http.get(`https://api-folio.rokus-klett.si/v1/pdf/${filename}/${i}?token=${token}`, function(response) {
      response.pipe(file);
    });

    if (i % 30 === 0) {
      await timeout(20000);
    }
  }
})();
