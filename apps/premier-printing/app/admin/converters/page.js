import {Converters} from "@pythias/mongo"
import {Converters as ConvertersComponent, serialize} from "@pythias/backend"
export const dynamic = 'force-dynamic';
export default async function ConverterPage(){
    let designConverter = await Converters.findOne({type: "design"});
    if(!designConverter){
        designConverter = new Converters({
            type: "design",
            converter: {}
        });
        await designConverter.save();
    }
    let blankConverter = await Converters.findOne({type: "blank"});
    if(!blankConverter){
        blankConverter = new Converters({
            type: "blank",
            converter: {}
        });
        await blankConverter.save();
    }
    let colorConverter = await Converters.findOne({type: "color"});
    if(!colorConverter){
        colorConverter = new Converters({
            type: "color",
            converter: {}
        });
        await colorConverter.save();
    }
    let sizeConverter = await Converters.findOne({type: "size"});
    if(!sizeConverter){
        sizeConverter = new Converters({
            type: "size",
            converter: {}
        });
        await sizeConverter.save();
    }
    let skuConverter = await Converters.findOne({ type: "sku" });
    if (!skuConverter) {
        skuConverter = new Converters({
            type: "sku",
            converter: {}
        });
        await skuConverter.save();
    }
    designConverter = serialize(designConverter);
    blankConverter = serialize(blankConverter);
    colorConverter = serialize(colorConverter);
    sizeConverter = serialize(sizeConverter);
    skuConverter = serialize(skuConverter);
    return(
        <ConvertersComponent 
            designConverter={designConverter} 
            blankConverter={blankConverter} 
            colorConverter={colorConverter} 
            sizeConverter={sizeConverter}
            skuConverter={skuConverter}
        />
    )
}