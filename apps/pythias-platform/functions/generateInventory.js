import { PlatformInventory as Inventory } from "@pythias/mongo";

export async function generateInventory(style, orgId) {
    for (const size of style.sizes) {
        for (const color of style.colors) {
            let inventory = await Inventory.findOne({
                orgId,
                size_name: size.name,
                color_name: color.name,
                style_code: style.code,
            });

            if (!inventory) {
                try {
                    inventory = new Inventory({
                        orgId,
                        inventory_id: encodeURIComponent(`${color.name}-${size.name}-${style.code}`),
                        style_code: style.code,
                        quantity: 0,
                        order_at_quantity: 0,
                        desired_order_quantity: 1,
                        color_name: color.name,
                        size_name: size.name,
                        last_counted: new Date(),
                    });
                    await inventory.save();
                } catch (err) {
                    console.log(err);
                }
            }
        }
    }
}
