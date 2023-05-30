"use strict";
const mongoose = require("mongoose");
module.exports = mongoose.model(
  "ArticleCat",
  mongoose.Schema({
    title: String,
    titleEng: String,
    titleColor: String,
    textColor: String,
    textColor2: String,
    linkColor: String,
    linkColor2: String,
    bgColor: String,
    bgColor2: String,
    buttonColor: String,
    subcats: [{ type: mongoose.Schema.ObjectId, ref: "ArticleSubCat" }],
    show: Boolean,
    create_at: { type: Date, default: Date.now },
  })
);
