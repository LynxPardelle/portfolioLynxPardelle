"use strict";
const mongoose = require("mongoose");
module.exports = mongoose.model(
  "ArticleSubCat",
  mongoose.Schema({
    title: String,
    titleEng: String,
    titleColor: String,
    buttonColor: String,
    cat: { type: mongoose.Schema.ObjectId, ref: "ArticleCat" },
    show: Boolean,
    create_at: { type: Date, default: Date.now },
  })
);
