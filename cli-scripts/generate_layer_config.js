const nconf = require('nconf');
const { access } = require('fs');
const fs = require('fs');
const path = require('path');
const { config } = require('process');

nconf.argv()
    .file({file: './config/config.json'});

const imgDirectoryPath = nconf.get('imageDirectory');
const bypassName = nconf.get('bypassName');
const bypassId = nconf.get('bypassId');

function _gen_variants(entry){
    const variants = {};
    variants[bypassId] = {
        name: bypassName, 
        weight: 0,
    };
    const dir = fs.readdirSync(entry)
        .filter(fn => fn.endsWith('.png'))
        .forEach( (fn, idx) => {
            const variant = {};
            variants[idx] = {
                filename: fn,
                name: path.basename(fn, path.extname(fn)),
                weight: 1
            };
        });

    return variants;
}

function _gen_layers(){    
    const layers = [];
    const dir = fs.readdirSync(imgDirectoryPath, {withFileTypes: true})
        .filter(ent => ent.isDirectory())
        .forEach((dirent, idx)=> {
            const layer = {};
            layers.push(layer);
            layer.dirname = dirent.name;
            layer.name = dirent.name;
            layer.order = idx;
            layer.variants = _gen_variants(imgDirectoryPath + dirent.name);
        });
    return layers;
}

function main(){
    let data = JSON.stringify(_gen_layers(), null, '\t');
    fs.writeFileSync(nconf.get("layersConfig"), data);
}

module.exports = main;

main();