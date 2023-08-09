const http = require("https");
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");
const axios = require("axios");

const token = "token";
const filename = "SLOINJAZ_SLO1_Celota_SS_SDZ";

const prepareTempFolder = (filename) => {
  if (!fs.existsSync(filename)) {
    fs.mkdirSync(filename);
  }
};

const timeout = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

const merge = async () => {
  const folderName = `${filename}merged`;
  prepareTempFolder(folderName);
  const pageCount = await getPageCount();
  for (let i = 1; i <= pageCount; i++) {
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

const mergePages = async (type) => {
  const folderName = `${filename}${type}`;
  const fileNames = fs
    .readdirSync(folderName, { withFileTypes: true })
    .filter((file) => file.name.endsWith(".pdf"))
    .sort((a, b) => parseInt(a.name.replace(".pdf", "")) - parseInt(b.name.replace(".pdf", "")));
  const merged = await PDFDocument.create();

  for (const fileName of fileNames) {
    const fileBytes = fs.readFileSync(`./${folderName}/${fileName.name}`);
    const file = await PDFDocument.load(fileBytes);
    const pages = await merged.copyPages(file, file.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const mergedPdfFile = await merged.save();
  fs.writeFileSync(`./${folderName}/merged${type}.pdf`, mergedPdfFile);
};

const scrape = async (type) => {
  const folderName = `${filename}${type}`;
  prepareTempFolder(folderName);
  const pageCount = await getPageCount();
  for (let i = 1; i <= pageCount; i++) {
    const file = fs.createWriteStream(`${folderName}/${i}.pdf`);
    http.get(`https://api-folio.rokus-klett.si/v1/${type}/${filename}/${i}?token=${token}`, (response) =>
      response.pipe(file)
    );

    if (i % 25 === 0) {
      console.log(`Scraping ${i} from ${pageCount}`);
      await timeout(25000);
    }
  }
};

const getPageCount = async () => {
  const res = await axios.get(`https://api-folio.rokus-klett.si/v1/metadata/${filename}`);
  return res.data.pageCount;
};

(async () => {
  const option = process.argv[2];
  const type = process.argv[3];

  switch (option) {
    case "scrape":
      await scrape(type);
      console.log("scraping finished");
      break;
    case "merge":
      await merge();
      console.log("merging finished");
      break;
    case "merge-pages":
      await mergePages(type);
      console.log("merging finished");
      break;
    default:
      console.log("Unsupported command");
  }
})();
