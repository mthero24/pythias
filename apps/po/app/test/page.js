
import Styles from "@/models/StyleV2"
import {Design} from "@/models/designs"
import Colors from "@/models/Color"
let images = [
  "light_image",
  "dark_image",
  "sublimation_image",
  "sublimation_dark_image",
  "sublimation_light_image",
];
export default async function Test(){
    // let colors = await Colors.find({});
    // for(let c of colors){
    //     if(c.image) {
    //         c.image = c.image.replace(
    //         "images2.tshirtpalace.com",
    //         "teeshirtpalace-node-dev"
    //         );
    //         await c.save()
    //     }
    // }
    let styles = await Styles.find({});
    for(let s of styles){
        for(let i of s.images){
            if(i.image){
                i.image = i.image.replace(
                    "images2.tshirtpalace.com",
                    "teeshirtpalace-node-dev"
                );
                console.log(i.image)
            }
        }
        s.markModified("images");
        await s.save()
    }
    // }
    // let designs = await Design.find({updatedLinks: {$in: [false, null]}}).limit(500);
    // let skip = 500
    // while(designs.length > 0){
    //     for(let d of designs){
    //         for(let i of images){
    //             if(d[i]){
    //                 d[i] = d[i].replace("teeshirtpalace-node-dev", "images2.tshirtpalace.com");
    //                 console.log(d[i])
    //             }
    //         }
    //         for(let gl of Object.keys(d.wasabiGoogleLinks)){
    //             d.wasabiGoogleLinks[gl] = d.wasabiGoogleLinks[gl].replace(
    //             "teeshirtpalace-node-dev",
    //             "images2.tshirtpalace.com"
    //             );
    //             console.log(d.wasabiGoogleLinks[gl]);
    //         }
    //         for (let b of Object.keys(d.backups)) {
    //             if (d.backups[b]){
    //                 d.backups[b] = d.backups[b].replace(
    //                     "teeshirtpalace-node-dev",
    //                     "images2.tshirtpalace.com"
    //                 );
    //                 console.log(d.backups[b]);
    //             }
    //         }
    //         d.updatedLinks = true
    //         d.markModified(`backups wasabiGoogleLinks`)
    //         await d.save()
    //     }
    //     designs = await Design.find({ updatedLinks: { $in: [false, null] } }).limit(500);
    //     console.log(skip)
    //     skip += 500
    // }
    return <h1>Test</h1>
}