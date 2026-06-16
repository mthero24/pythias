import {Converters} from "@pythias/mongo"
import {Converters as ConvertersComponent, serialize} from "@pythias/backend"
export const dynamic = 'force-dynamic';

// Load (and lazily create) a converter by type. Tolerates the DB being unreachable during build's
// page-data collection — returns an empty converter so the build doesn't crash; real data loads at request.
async function getConverter(type){
    try{
        let doc = await Converters.findOne({ type });
        if(!doc){ doc = new Converters({ type, converter: {} }); await doc.save(); }
        return serialize(doc);
    }catch{
        return { type, converter: {} };
    }
}

export default async function ConverterPage(){
    const [designConverter, blankConverter, colorConverter, sizeConverter, skuConverter] = await Promise.all([
        getConverter("design"), getConverter("blank"), getConverter("color"), getConverter("size"), getConverter("sku"),
    ]);
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