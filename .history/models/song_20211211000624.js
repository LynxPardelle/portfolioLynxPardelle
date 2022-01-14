"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var SongSchema = Schema({
  title: String,
  song: { type: Schema.ObjectId, ref: "File" },
  duration: Number,
  coverArt: { type: Schema.ObjectId, ref: "File" },
  order: Number,
});

module.exports = mongoose.model("Song", SongSchema);