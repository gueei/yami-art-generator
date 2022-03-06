const nconf = require('nconf');
const mergeImage = require('merge-images');
const {Canvas, Image} = require('canvas');
const fs = require('fs');

nconf.argv()
    .file({file: './config/config.json'});

const layers = require(nconf.get("layersConfig"));
const dnas = require(nconf.get("dnasConfig"));