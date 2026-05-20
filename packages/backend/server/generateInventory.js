// Pass { Color, Inventory } from @pythias/mongo
export async function generateInventory({ Color, Inventory }, style) {
    let lastBC = await Inventory.find().select("barcode_id").lean().sort({ barcode_id: -1 });
    let barcode_id = 0;

    for (const size of style.sizes) {
        for (const cid of style.colors) {
            const color = await Color.findById(cid).select("name").lean();

            let inventory = await Inventory.findOne({
                size_name: size.name,
                color: color._id,
                style_code: style.code,
            });

            if (!inventory) {
                inventory = await Inventory.findOne({
                    inventory_id: encodeURIComponent(`${color.name}-${size.name}-${style.code}`),
                });
                if (inventory) {
                    inventory.size_name = size.name;
                    inventory.color = color._id;
                    inventory.style_code = style.code;
                    await inventory.save();
                }
            }

            if (!inventory) {
                while (lastBC.map(i => Number(i.barcode_id)).includes(barcode_id)) barcode_id++;
                try {
                    console.log(style.code, size.name, color.name);
                    const newInventory = new Inventory({
                        inventory_id: encodeURIComponent(`${color.name}-${size.name}-${style.code}`),
                        style_code: style.code,
                        quantity: 0,
                        order_at_quantity: 0,
                        desired_order_quantity: 1,
                        color,
                        color_name: color.name,
                        size_name: size.name,
                        last_counted: new Date(),
                        barcode_id,
                    });
                    lastBC.push(newInventory);
                    await newInventory.save();
                } catch (err) {
                    console.log(err);
                }
            } else if (inventory.inventory_id !== encodeURIComponent(`${color.name}-${size.name}-${style.code}`)) {
                inventory.inventory_id = encodeURIComponent(`${color.name}-${size.name}-${style.code}`);
                await inventory.save();
            }
        }
    }
}
