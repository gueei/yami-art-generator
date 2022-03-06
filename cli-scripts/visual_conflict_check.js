const nconf = require('nconf');
const mergeImage = require('merge-images');
const {Canvas, Image} = require('canvas');
const fs = require('fs/promises');
const getPixels = require('get-pixels');
const sqrl = require('squirrelly')

nconf.argv()
    .file({file: './config/config.json'});


const layers = require(nconf.get("layersConfig"));
const dnas = require(nconf.get("dnasConfig"));
const reportTemplate = nconf.get("reportTemplate");

const conflictThreshold = nconf.get("conflictThreshold");

layers.sort( (a, b) => a.order - b.order );

const imageDirectory = nconf.get("imageDirectory");
const outputDirectory = nconf.get("outputDirectory");

async function getPixelsAsync(image){
    return new Promise((resolve, reject) => {
        getPixels(image, (err, pixels) => {
            if (err){
                reject(err);
            }
            resolve(pixels);
        });
    });
}

async function _performCheck(finalComposition, images){
    const compoPixels = await getPixelsAsync(finalComposition);
    nx = compoPixels.shape[0];
    ny = compoPixels.shape[1];
    return await Promise.all(
        images.map(async(imageLayer) => {
            const image = imageLayer.filepath;
            const imgPixels = await getPixelsAsync(image);
            var difference = 0;
            var nonzero = 0;
            for (var y=0; y<ny; y++){
                for (var x=0; x<nx; x++){
                    if (imgPixels.get(x, y, 3)!=0){
                        nonzero ++;
                        if (compoPixels.get(x, y, null) != imgPixels.get(x,y, null)){
                            difference ++;
                        }
                    }
                }
            }
            return {
                image: imageLayer,
                diff: difference / nonzero,
                conflict: difference/nonzero > conflictThreshold
            }
        })
    );
}

async function generate_report(data){
    await fs.writeFile(nconf.get("conflictReport"), JSON.stringify(data, null, '\t'));
    report = await sqrl.renderFile(reportTemplate, {compositions: data});
    return fs.writeFile("report.html", report);
}

function check_conflicts(){
    return Promise.all(dnas.map( async (dna, idx) => {
        imgData = layers.map( (l, idx) => {
                return {
                    dir: imageDirectory + l.dirname +  "/",
                    filename:  l.variants[dna.charCodeAt(idx)].filename,
                    filepath : imageDirectory + l.dirname + "/" + l.variants[dna.charCodeAt(idx)].filename,
                    incl: dna.charCodeAt(idx) != 255
                }
            }).filter(m => m.incl);

        let fname = outputDirectory + "img/" + idx + ".png";
        check = await _performCheck(fname, imgData);
        return {
            composition: fname,
            layers: check,
            keep: !check.reduce((p, c) => p || c.conflict, false)
        }
    }));
}

async function main(){
    const compositions = await check_conflicts();
    return generate_report(compositions);
}

main().then(w=>{
    console.log("Completed");
});