const http = require('https');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

const token = 'token';
const filename = 'R5DRU5_sdz';
const lastPage = 132;

const prepareTempFolder = filename => {
  if (!fs.existsSync(filename)) {
    fs.mkdirSync(filename);
  }
};

const timeout = delay => new Promise(resolve => setTimeout(resolve, delay));

const merge = async () => {
  const folderName = `${filename}merged`;
  prepareTempFolder(folderName);
  for (let i = 1; i <= lastPage; i++) {
    const pageBytes = fs.readFileSync(`./${filename}pdf/${i}.pdf`);
    const answersBytes = fs.readFileSync(`./${filename}answers/${i}.pdf`);
    const pdfDoc = await PDFDocument.load(pageBytes);
    const answersPdf = await PDFDocument.load(answersBytes);
    const answersPage = await pdfDoc.embedPage(answersPdf.getPages()[0]);
    const page = pdfDoc.getPages()[0];
    page.drawPage(answersPage);
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(`./${folderName}/${i}.pdf`, pdfBytes);
  }
};

const scrape = async type => {
  const folderName = `${filename}${type}`;
  prepareTempFolder(folderName);
  for (let i = 1; i <= lastPage; i++) {
    const file = fs.createWriteStream(`${folderName}/${i}.pdf`);
    http.get(`https://api-folio.rokus-klett.si/v1/${type}/${filename}/${i}?token=${token}`, response => response.pipe(file));

    if (i % 25 === 0) {
      await timeout(25000);
    }
  }
};

(async () => {
  const option = process.argv[2];

  switch (option) {
    case 'scrape':
      const type = process.argv[3];
      await scrape(type);
      console.log('scraping finished');
      break;
    case 'merge':
      await merge();
      console.log('merging finished');
      break;
    default:
      console.log('Unsupported command');
  }
})();
