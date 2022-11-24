require("dotenv").config();
const nodemailer = require("nodemailer");
const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require("fs");
const Email = require("email-templates");
var dayjs = require("dayjs");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//enable CORS for all requests
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

var emailAddress;
var accountManager;
var clientName;
var dateOfProposalSubmission;
var estimate;
var locationOfProject;
var typeOfProject;
var eventDate;
var eventDuration;
var hardwarePurchase;
var technicalSupport;
var presentation;
var presentationType;
var presentationTypeOthers;
var sow;
var referenceLinks;
var path;
var ccAddress = [
  process.env.BOSCO_EMAIL,
  process.env.SOPHIYA_EMAIL,
  process.env.RAHUL_EMAIL,
  process.env.AM_EMAIL,
  process.env.SYED_EMAIL,
];
var currentDate;

var Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./attachments");
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

var upload = multer({
  storage: Storage,
});

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile("/index.html");
});

app.post("/sendemail", upload.array("files", 10), (req, res) => {
  accountManager = req.body.accountManager;
  emailAddress = req.body.emailAddress;
  clientName = req.body.clientName;
  dateOfProposalSubmission = dayjs(req.body.dateOfProposalSubmission).format(
    "DD/MM/YYYY"
  );
  estimate = req.body.estimate;
  locationOfProject = req.body.locationOfProject;
  typeOfProject = req.body.typeOfProject;
  eventDate = dayjs(req.body.eventDate).format("DD/MM/YYYY");
  eventDuration = req.body.eventDuration;
  hardwarePurchase = req.body.hardwarePurchase;
  technicalSupport = req.body.technicalSupport;
  presentation = req.body.presentation;
  presentationType = req.body.presentationType;
  presentationTypeOthers = req.body.presentationTypeOthers;
  sow = req.body.sow;
  let links = req.body.referenceLinks.split(",");
  referenceLinks = links;
  req.body.presentation == "Yes"
    ? ccAddress.push(process.env.ADRIAN_EMAIL, process.env.BRANDING_EMAIL)
    : null;
  currentDate = dayjs().format("YYYY-MM-DD");

  let filesArray = [];
  req.files.forEach((file) => {
    const fileList = {
      filename: file.originalname,
      path: file.path,
    };
    filesArray.push(fileList);
  });
  path = filesArray;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const attachments = filesArray.map((file) => {
    return { filename: file.filename, path: file.path };
  });

  const email = new Email({
    views: {
      root: __dirname + "/templates",
      options: { extension: "ejs" },
    },
    message: {
      from: "syed.s@takeleap.com",
      attachments: path !== null ? attachments : null,
    },
    send: true,
    preview: false,
    transport: transporter,
  });

  email
    .send({
      template: "test",
      message: {
        to: emailAddress,
        cc: ccAddress,
      },
      locals: {
        emailAddress,
        accountManager,
        clientName,
        dateOfProposalSubmission,
        estimate,
        locationOfProject,
        typeOfProject,
        eventDate: typeOfProject === "Rental/Event" ? eventDate : "",
        eventDuration: typeOfProject === "Rental/Event" ? eventDuration : "",
        hardwarePurchase,
        technicalSupport,
        presentation,
        presentationType: presentation === "Yes" ? presentationType : "",
        presentationTypeOthers:
          presentationType === "Others" ? presentationTypeOthers : "",
        sow,
        referenceLinks,
        currentDate,
      },
    })
    .then((info) => {
      console.log("Email sent: " + info.response);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      if (path !== null) {
        path.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) throw err;
            console.log("file deleted");
          });
        });
        res.status(200).send("Email sent successfully");
      } else {
        res.status(200).send("Email sent successfully");
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 App started on 🔌 ${port}`);
});

// Export the Express API
module.exports = app;
