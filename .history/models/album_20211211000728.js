"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var AlbumSchema = Schema({
  title: String,
  image: { type: Schema.ObjectId, ref: "File" },
  spotify: String,
  tidal: String,
});

module.exports = mongoose.model("Album", AlbumSchema);
