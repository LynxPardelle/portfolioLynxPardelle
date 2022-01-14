"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var AlbumSchema = Schema({
  title: String,
  img: { type: Schema.ObjectId, ref: "File" },
  spotify: String,
  tidal: String,
  order: Number
});

module.exports = mongoose.model("Album", AlbumSchema);
