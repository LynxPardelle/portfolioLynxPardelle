"use strict";
const mongoose = require("mongoose");
module.exports = mongoose.model(
  "Article",
  mongoose.Schema({
    title: String,
    titleEng: String,
    subtitle: String,
    subtitleEng: String,
    insertions: [String],
    cat: { type: mongoose.Schema.ObjectId, ref: "ArticleCat" },
    subCats: [{ type: mongoose.Schema.ObjectId, ref: "ArticleSubCat" }],
    intro: String,
    introEng: String,
    outro: String,
    outroEng: String,
    sections: [{ type: mongoose.Schema.ObjectId, ref: "ArticleSection" }],
    tags: String,
    urltitle: String,
    coverImg: [{ type: mongoose.Schema.ObjectId, ref: "File" }],
    titleColor: String,
    textColor: String,
    linkColor: String,
    bgColor: String,
    langs: [String],
    show: Boolean,
    create_at: { type: Date, default: Date.now },
  })
);
