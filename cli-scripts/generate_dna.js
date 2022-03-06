const globalConf = require('nconf');
const { access } = require('fs');

globalConf.argv()
    .file({file: './config/config.json'});

const layers = require(globalConf.get("layersConfig"));

const bypassId = globalConf.get('bypassId');
const bypassName = globalConf.get('bypassName');

function _create_probSpec(variants){
    totalWeight = Object.keys(variants).reduce((p, c) => p + variants[c].weight, 0);
    return Object.keys(variants).map( v => {
        return { id: v, prob: variants[v].weight/totalWeight }
    });
}

function _generate_variant_dna(layers, count){
    specs = layers.map( layer => {
        return _create_probSpec(layer.variants);
    });
    dnas = [];
    var retries = 0;
    while (dnas.length<count && retries < count){
        dna = "";
        for (var i=0; i<layers.length; i++){
            dna += String.fromCharCode(weightedRandom(specs[i]));
        }
        if (!dnas.includes(dna)){
            retries = 0;
            dnas.push(dna);
        }else{
            retries ++;
        }
    }
    return dnas;
}

function weightedRandom(spec) {
    let i, sum=0, r=Math.random();
    for (i in spec) {
      sum += spec[i].prob;
      if (r <= sum) return spec[i].id;
    }
}

function main(){
    const fs = require('fs');
    layers.sort( (a, b) => a.order - b.order );
    let dnas = _generate_variant_dna(layers, globalConf.get("count"));
    let data = JSON.stringify(dnas, null, '\t');
    fs.writeFileSync(globalConf.get("dnasConfig"), data);
    console.log("DNA file generated, total generated: " + dnas.length);
}

main();

