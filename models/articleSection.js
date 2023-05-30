"use strict";
const mongoose = require("mongoose");
module.exports = mongoose.model(
  "ArticleSection",
  mongoose.Schema({
    title: String,
    titleEng: String,
    text: String,
    textEng: String,
    article: { type: mongoose.Schema.ObjectId, ref: "Article" },
    principalFile: { type: mongoose.Schema.ObjectId, ref: "File" },
    files: [{ type: mongoose.Schema.ObjectId, ref: "File" }],
    order: Number,
    titleColor: String,
    textColor: String,
    linkColor: String,
    bgColor: String,
    show: Boolean,
    insertions: [String],
  })
);
