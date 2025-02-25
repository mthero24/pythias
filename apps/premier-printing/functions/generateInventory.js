import Color from "@/models/Color";
import Inventory from "@/models/inventory";

export async function generateInventory(style) {
  console.log(
    style.code,
    "***********************************************************"
  );
  let lastBC = await Inventory.find()
    .select("barcode_id")
    .lean()
    .sort({ barcode_id: -1 });
  let barcode_id = 0;
  for (let size of style.sizes) {
    for (let cid of style.colors) {
      let color = await Color.findById(cid).select("name").lean();
      //console.log(color, size)
      //console.log(size.name, color._id, style.code);
      let inventory = await Inventory.findOne({
        size_name: size.name,
        color: color._id,
        style_code: style.code,
      });
      //if(color.name == "Grape")console.log("size: ", size)
      if (!inventory) {
        //console.log("not inventory")
        inventory = await Inventory.findOne({
          inventory_id: encodeURIComponent(
            `${color.name}-${size.name}-${style.code}`
          ),
        });
        if (inventory) {
          //console.log("found inventory")
          //console.log(
          //  inventory.size_name,
           // inventory.color,
           // inventory.style_code
          //);
          inventory.size_name = size.name;
          inventory.color = color._id;
          inventory.style_code = style.code;
          //console.log(
           // inventory.size_name,
           // inventory.color,
           // inventory.style_code,
           // "new"
         // );
          await inventory.save();
        }
      }
      if (!inventory) {
        while (lastBC.map((i) => Number(i.barcode_id)).includes(barcode_id)) {
          barcode_id++;
        }
        try {
         //console.log("create inventory")
          console.log(style.code, size.name, color.name);
          let newInventory = new Inventory({
            inventory_id: encodeURIComponent(
              `${color.name}-${size.name}-${style.code}`
            ),
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
          //console.log(newInventory);
          lastBC.push(newInventory);
          await newInventory.save();
        } catch (err) {
          console.log(err);
        }
      } else {
        if (
          inventory.inventory_id !=
          encodeURIComponent(`${color.name}-${size.name}-${style.code}`)
        ) {
          inventory.inventory_id = encodeURIComponent(
            `${color.name}-${size.name}-${style.code}`
          );
          await inventory.save();
        }
      }
    }
  }
}
