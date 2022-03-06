const nconf = require('nconf');
const mergeImage = require('merge-images');
const {Canvas, Image} = require('canvas');
const fs = require('fs');

nconf.argv()
    .file({file: './config/config.json'});


const layers = require(nconf.get("layersConfig"));
const dnas = require(nconf.get("dnasConfig"));

layers.sort( (a, b) => a.order - b.order );

const imageDirectory = nconf.get("imageDirectory");
const outputDirectory = nconf.get("outputDirectory");

async function main(){
    for (var i=0; i<dnas.length; i++){
        dna = dnas[i];
        traits = layers.map( (l, idx) => {
                code = dna.charCodeAt(idx);
                return {
                    trait_type: l.name,
                    trait_value: l.variants[code].name,
                    dir: imageDirectory + l.dirname + "/",
                    filename:  l.variants[dna.charCodeAt(idx)].filename,
                    filepath : imageDirectory + l.dirname + "/" + l.variants[code].filename,
                    incl: code != 255
                }
            }).filter(m => m.incl);

        await mergeImage(traits.map(m=>m.filepath), {
            Canvas: Canvas,
            Image: Image
        }).then(b64 => {
            let b64data = b64.replace(/^data:image\/png;base64,/, "");
            let fname = outputDirectory + "img/" + i + ".png";
            fs.writeFileSync(fname, b64data, 'base64', (err)=>{
                console.log(err);
            });
            let meta = {
                attributes: traits.map(t=> {
                    return { 
                        "trait_type": t.trait_type,
                        value: t.trait_value
                    }
                })
            }
            fs.writeFileSync(outputDirectory + "meta/" +i, JSON.stringify(meta, null, '\t'));
        });
    }
}

main()