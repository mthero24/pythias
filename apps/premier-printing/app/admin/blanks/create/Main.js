"use client";
import {
  Box,
  Button,
  Checkbox,
  Container,
  Grid2,
  IconButton,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import Dropzone from "@/components/Dropzone";
import { Cropper } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { FaWindowClose } from "react-icons/fa";
import ImageUpload from "@/components/ImageUpload";
import slugify from "@/utils/slugify";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { Stage, Layer, Transformer, Rect } from "react-konva";
import axios from "axios";
import ImageUploadBox from "@/components/ImageUploadBox";
import LoaderButton from "@/components/LoaderButton";
import EyeDropper from "@/components/EyeDropper";
import "jimp";
export function Main({ colors, blanks, blank, printPricing }) {
  const [activeColors, setActiveColors] = useState(
    blank && blank.colors ? blank.colors : []
  );
  //console.log(printPricing);

  const [activePrintAreas, setActivePrintAreas] = useState(
    blank && blank.images
      ? [...new Set(blank.images.map((i) => i.frontBackSwatch))]
      : []
  );
  const [boxModalOpen, setBoxModalOpen] = useState(false);
  const [allColors, setAllColors] = useState(colors);

  const box = useRef(blank && blank.box ? blank.box : {});
  const boxModalSide = useRef();
  const boxModalOnClick = useRef();
  const boxKey = useRef("default");

  const cropBoxData = useRef({});
  const [images, setImages] = useState(blank?.images ? blank.images : []);

  useEffect(() => {
    setImages((prev) => {
      let newImgs = prev.filter((i) => activeColors.includes(i.color));
      return newImgs;
    });
  }, [activeColors]);

  //keep images the same as array BECAUSE it will be easier to filter no?
  const handleUploadImage = ({ color_id, images }) => {
    setImages((prev) => {
      let newArr = [...prev].filter((i) => i.color != color_id);

      for (let key in images) {
        newArr.push({
          image: images[key],
          color: color_id,
          frontBackSwatch: key,
        });
      }
      return newArr;
    });
  };

  const toggleActiveColor = (color) => {
    //console.log(color);
    let active = [...activeColors];
    if (activeColors.includes(color)) {
      active = activeColors.filter((c) => c != color);
    } else {
      active.push(color);
    }

    setActiveColors(active);
  };

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      handlingTime: {
        min: 1,
        max: 2,
      },
      ...blank,
    },
  });
  const onSubmit = async (data) => {
    //console.log("onSubmit()");
    let blank = { ...data, images, box: box.current, colors: activeColors };
    let result = await axios.post("/api/admin/blanks", { blank });
    //console.log(result);
    alert(result.data);
    location.reload();
  };

  const {
    fields: bulletPoints,
    append: addBulletPoint,
    remove: removeBulletPoint,
  } = useFieldArray({
    control,
    name: "bulletPoints",
  });

  const {
    fields: sizes,
    append: addSizes,
    remove: removeSizes,
  } = useFieldArray({
    control,
    name: "sizes",
  });

  const {
    fields: quantityDiscounts,
    append: addQuantityDiscount,
    remove: removeQuantityDiscount,
  } = useFieldArray({
    control,
    name: "quantityDiscounts",
  });

  let colorCategories = {};
  for (let color of colors) {
    if (!color.category) continue;
    if (!colorCategories[color.category.toLowerCase()]) {
      colorCategories[color.category.toLowerCase()] = [];
    }
    colorCategories[color.category.toLowerCase()].push(color);
  }

  const nameWatch = watch("name");

  useEffect(() => {
    if (nameWatch && nameWatch.length) {
      let slug = slugify(nameWatch);
      setValue("slug", slug);
    }
  }, [nameWatch]);

  const departments = [...new Set(blanks.map((s) => s.department))].map(
    (d) => ({
      value: d,
      label: d,
    })
  );

  const createNewColor = async (c) => {
    let color = {
      name: c.label,
      color_type: "light",
      category: "Standard",
    };
    let result = await axios.post("/api/admin/colors", { color });
    let newColor = result.data.color;
    //console.log(result, newColor);
    return newColor;
  };

  const handleModifyColors = async (selectedColors) => {
    let newActiveColors = [];
    for (let selectedColor of selectedColors) {
      let found = allColors.filter(
        (c) => c._id.toString() == selectedColor.value
      )[0];
      if (!found) {
        //console.log("create new", selectedColor);
        let newColor = await createNewColor(selectedColor);
        setAllColors((prev) => [...prev, newColor]);
        await new Promise((resolve) => setTimeout(resolve, 100));
        newActiveColors.push({
          label: selectedColor.label,
          value: newColor._id.toString(),
        });
      } else {
        //console.log("found", selectedColor);
        newActiveColors.push(selectedColor);
      }
    }
    setActiveColors(newActiveColors.map((c) => c.value));
  };

  const categories = [...new Set(blanks.map((s) => s.category))]
    .filter((d) => d && d.length)
    .map((d) => ({
      value: d,
      label: d,
    }))
    .sort((a, b) => a.value[0].trim().localeCompare(b.value[0].trim()));
    console.log(categories, "+++++++++++++++++++");
//
  const sizeOptions = [
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "2XL",
    "3XL",
    "4XL",
    "5XL",
    "6XL",
  ].map((b) => ({
    label: b,
    value: b,
  }));

  const vendors = [
    {
      value: "Premier Printing",
      label: "Premier Printing",
    },
  ];

  const bulletPointDefaults = ["Fit", "Fabric", "Care Instructions"].map(
    (b) => ({
      label: b,
      value: b,
    })
  );

  const quantityDiscountOptions = [5, 10, 25, 50, 100, 150, 250, 500, 1000].map(
    (b) => ({
      label: b,
      value: b,
    })
  );

  const addNewSize = () => {
    let sizes = getValues("sizes");
    if (sizes.length == 0) {
      return addSizes({
        name: "",
        wholesaleCost: 0,
        retailPrice: 0,
        basePrice: 0,
      });
    } else {
      let lastSize = sizes[sizes.length - 1];
      return addSizes({
        name: "",
        wholesaleCost: lastSize.wholesaleCost,
        retailPrice: lastSize.retailPrice,
        basePrice: lastSize.basePrice,
      });
    }
  };

  const printAreas = [
    "front",
    "back",
    "sleeve",
    "pocket",
    "hood",
    "leg",
    "side",
    "model front",
    "model back",
  ];

  const printBoxes = [...new Set(images.map((i) => i.frontBackSwatch))];

  const overridePrintBox = ({ color_id, box }) => {
    //console.log(color_id, box, "override");
    boxKey.current = color_id;
    boxModalSide.current = box;
    setBoxModalOpen(!boxModalOpen);
  };

  const generateDescription = async () => {
   // console.log("generateDescription()");
    let name = getValues("name");
    let description = getValues("description");
   // console.log(name, description);
    let result = await axios.post("/api/ai/", {
      prompt: `generate me a description for a ${name} using this data: ${description}. limit to under 300 characters.`,
    });
   // console.log(result);
    setValue("description", result.data);
  };

  const brands = [...new Set(blanks.map((s) => s.brand))]
    .filter((b) => b && b.length > 0)
    .map((b) => ({
      label: b,
      value: b,
    }));
  const suppliers = ["S&S Activewear", "Sanmar", "Onestop"].map((b) => ({
    label: b,
    value: b,
  }));

  let selectedPrintMethod = watch("printTypes") && watch("printTypes")[0];
  if (selectedPrintMethod) {
    selectedPrintMethod = selectedPrintMethod.toUpperCase();
  }
  let DEFAULT_PRINT_PRICE = printPricing[selectedPrintMethod]
    ? printPricing[selectedPrintMethod]
    : printPricing["DTF"];
  let watchedSizes = watch("sizes");
  const getDefaultStoreCost = (quantity = 0) => {
    if (watchedSizes[0]) {
      let printDiscount = 0;
      for (let discount of DEFAULT_PRINT_PRICE.quantityDiscounts.sort(
        (a, b) => a.quantity - b.quantity
      )) {
        if (quantity >= discount.quantity) {
          printDiscount = discount.discount;
        }
      }

      return (
        Number(watchedSizes[0].basePrice) +
        Number(DEFAULT_PRINT_PRICE.price) -
        Number(printDiscount)
      );
    }

    //console.log(DEFAULT_PRINT_PRICE);

    return 0;
  };
  const colorCropBoxData = useRef();

  return (
    <Container>
      <Box>
        <Typography variant="h5" mb={2}>
          Create New Blank
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container spacing={3}>
            <Grid2 size={4} sx={{ mb: 4 }}>
              
              <TextField
                label="Blank Name"
                sx={{ width: "100%" }}
                {...register("name", { required: "Name is required" })}
              />
              {errors?.name?.message && (
                <ErrorText>{errors?.name?.message}</ErrorText>
              )}
            </Grid2>
            <Grid2 size={4} sx={{ mb: 4 }}>
              <TextField
                sx={{ width: "100%" }}
                label="Blank Code"
                {...register("code", { required: "Code is required" })}
              />
              {errors?.code?.message && (
                <ErrorText>{errors?.code?.message}</ErrorText>
              )}
            </Grid2>
            <Grid2 size={4} sx={{ mb: 4 }}>
              <TextField
                label="slug"
                sx={{ width: "100%" }}
                placeholder="Slug"
                {...register("slug")}
              />
            </Grid2>
            <Grid2 size={4} sx={{ mb: 4 }}>
              <label htmlFor="vendor">Vendor</label>
              <Box sx={{ zIndex: 2 }}>
                <Controller
                  name="vendor"
                  rules={{ required: "Vendor is required" }}
                  control={control}
                  render={({ field: { onChange, value, ref } }) => (
                    <Select
                      inputRef={ref}
                      options={vendors}
                      value={{ value, label: value }}
                      onChange={({ value }) => onChange(value)}
                    />
                  )}
                />
              </Box>
              {errors?.vendor?.message && (
                <ErrorText>{errors?.vendor?.message}</ErrorText>
              )}
            </Grid2>
            <Grid2 size={4} sx={{ mb: 4 }}>
              <label htmlFor="department">Department</label>
              <Controller
                name="department"
                rules={{ required: "Department is required" }}
                control={control}
                render={({ field: { onChange, value, ref } }) => (
                  <CreatableSelect
                    inputRef={ref}
                    options={departments}
                    value={{ value, label: value }}
                    onChange={({ value }) => onChange(value)}
                  />
                )}
              />
              {errors?.department?.message && (
                <ErrorText>{errors?.department?.message}</ErrorText>
              )}
            </Grid2>
            <Grid2 size={4} sx={{ mb: 4 }}>
              <label htmlFor="category">Category</label>
              <Box sx={{ zIndex: 2 }}>
                <Controller
                  name="category"
                  rules={{ required: "Category is required" }}
                  control={control}
                  render={({ field: { onChange, value, ref } }) => (
                    <CreatableSelect
                      inputRef={ref}
                      options={categories}
                      value={{ value, label: value }}
                      onChange={({ value }) => onChange(value)}
                    />
                  )}
                />
              </Box>
              {errors?.category?.message && (
                <ErrorText>{errors?.category?.message}</ErrorText>
              )}
            </Grid2>
            <Grid2 size={4} sx={{ mb: 4 }}>
              <label htmlFor="category">Brand</label>
              <Controller
                name="brand"
                rules={{ required: "Brand is required" }}
                control={control}
                render={({ field: { onChange, value, ref } }) => (
                  <CreatableSelect
                    inputRef={ref}
                    options={brands.sort((a, b) =>
                      a.label.localeCompare(b.label)
                    )}
                    value={{ value, label: value }}
                    onChange={({ value }) => onChange(value)}
                  />
                )}
              />
              {errors?.brand?.message && (
                <ErrorText>{errors?.brand?.message}</ErrorText>
              )}
            </Grid2>
            <Grid2 size={4} sx={{ mb: 4 }}>
              <label htmlFor="category">Supplier</label>
              <Box sx={{ zIndex: 2 }}>
                <Controller
                  name="suppliers"
                  control={control}
                  render={({ field: { onChange, value, ref } }) => {
                    return (
                      <CreatableSelect
                        isMulti
                        inputRef={ref}
                        options={suppliers}
                        value={
                          value &&
                          value.length &&
                          value.map((v) => ({ value: v, label: v }))
                        }
                        onChange={(val) => {
                          onChange(val.map((v) => v.value));
                        }}
                      />
                    );
                  }}
                />
              </Box>
              {errors?.suppliers?.message && (
                <ErrorText>{errors?.suppliers?.message}</ErrorText>
              )}
            </Grid2>
            <Grid2 size={4} sx={{ mb: 4 }}>
              <label htmlFor="printTypes">Print Types</label>
              <Box sx={{ zIndex: 2 }}>
                <Controller
                  name="printTypes"
                  control={control}
                  render={({ field: { onChange, value, ref } }) => {
                    return (
                      <CreatableSelect
                        isMulti
                        inputRef={ref}
                        options={[
                          "DTF",
                          "DTG",
                          "Sublimation",
                          "Embroidery",
                          "Paper Printing",
                        ].map((c) => ({ value: c, label: c }))}
                        value={
                          value &&
                          value.length &&
                          value.map((v) => ({ value: v, label: v }))
                        }
                        onChange={(val) => {
                          onChange(val.map((v) => v.value));
                        }}
                      />
                    );
                  }}
                />
              </Box>
            </Grid2>
            <Grid2 size={4} sx={{ mb: 4 }}>
              <label htmlFor="handlingTime">Handling Time (Days)</label>
              <Box sx={{ display: "flex" }}>
                <Controller
                  name="handlingTime.min"
                  control={control}
                  rules={{ required: "Field is required" }}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      sx={{ width: "100%" }}
                      type="number"
                      {...field}
                      inputProps={{
                        ...field.inputProps,
                        min: 0, // Optional: specify minimum value
                      }}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
                <Controller
                  name="handlingTime.max"
                  control={control}
                  rules={{ required: "Field is required" }}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      sx={{ width: "100%" }}
                      type="number"
                      {...field}
                      inputProps={{
                        ...field.inputProps,
                        min: 0, // Optional: specify minimum value
                      }}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
                {errors?.handlingTime?.message && (
                  <ErrorText>{errors?.handlingTime?.message}</ErrorText>
                )}
              </Box>
            </Grid2>
            <Grid2 size={12} sx={{ mb: 4 }}>
              <TextField
                multiline
                sx={{ zIndex: 0 }}
                rows={6} // Number of rows to display when the component is rendered
                label="Description"
                placeholder="Enter text here"
                variant="outlined"
                fullWidth
                {...register("description", {
                  required: "Description is required",
                })}
              />
              {errors?.description?.message && (
                <ErrorText>{errors?.description?.message}</ErrorText>
              )}
              <LoaderButton onClick={generateDescription}>
                Generate Description
              </LoaderButton>
            </Grid2>
            <Grid2 size={12} sx={{ mb: 4 }}>
              <Typography>Bullet points</Typography>
              {bulletPoints.map((field, index) => (
                <Box
                  key={field.id}
                  sx={{
                    display: "flex",
                    width: "100%",
                    marginY: 4,
                  }}
                >
                  <Box
                    sx={{ display: "flex", flexDirection: "column", flex: 1 }}
                  >
                    <Controller
                      name={`bulletPoints[${index}].title`}
                      control={control}
                      defaultValue={field.title}
                      render={({ field: { onChange, value, ref } }) => (
                        <CreatableSelect
                          inputRef={ref}
                          options={bulletPointDefaults}
                          value={{ value, label: value }}
                          onChange={({ value }) => onChange(value)}
                        />
                      )}
                    />
                    <Controller
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          sx={{ marginTop: 1 }}
                          label="Description"
                          multiline
                        />
                      )}
                      name={`bulletPoints[${index}].description`}
                      control={control}
                      defaultValue={field.description}
                    />
                  </Box>

                  <Button
                    color="error"
                    type="button"
                    onClick={() => removeBulletPoint(index)}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
              <Button
                type="button"
                onClick={() => addBulletPoint({ content: "" })}
              >
                Add Bullet Point
              </Button>
            </Grid2>

            <Grid2 size={12} sx={{ mb: 4 }}>
              <Typography>Sizes</Typography>
              <Grid2 container>
                {sizes.map((field, index) => (
                  <SizeStack
                    control={control}
                    watch={watch}
                    sizeOptions={sizeOptions}
                    key={index}
                    index={index}
                    field={field}
                    printPrice={DEFAULT_PRINT_PRICE}
                  />
                ))}
              </Grid2>

              <Button type="button" onClick={addNewSize}>
                Add Size
              </Button>
            </Grid2>

            <Grid2 size={12} sx={{ mb: 4 }}>
              <Typography>Bulk Discounts</Typography>
              <Grid2 container>
                {quantityDiscounts.map((field, index) => {
                  const watchedDiscount =
                    watch(`quantityDiscounts[${index}].discount`) || 0;
                  const watchedQuantity =
                    watch(`quantityDiscounts[${index}].quantity`) || 0;

                  let defaultPrintPrice =
                    getDefaultStoreCost(watchedQuantity) -
                    Number(watchedDiscount);

                  return (
                    <Grid2 size={2} key={index}>
                      <Box
                        key={field.id}
                        sx={{ display: "flex", m: 1, flexDirection: "column" }}
                      >
                        <Box sx={{ zIndex: 2 }}>
                          <Controller
                            name={`quantityDiscounts[${index}].quantity`}
                            control={control}
                            defaultValue={field.name}
                            render={({ field: { onChange, value, ref } }) => (
                              <CreatableSelect
                                inputRef={ref}
                                options={quantityDiscountOptions}
                                value={{ value, label: value }}
                                onChange={({ value }) => onChange(value)}
                              />
                            )}
                          />
                        </Box>
                        <Controller
                          render={({ field }) => (
                            <TextField
                              sx={{ mt: 1 }}
                              {...field}
                              label="Discount"
                              type="number"
                            />
                          )}
                          name={`quantityDiscounts[${index}].discount`}
                          control={control}
                          defaultValue={field.discount}
                        />
                        <Box sx={{ p: 1, my: 1, backgroundColor: "#f1f1f1" }}>
                          <Typography fontWeight={700} fontSize={13}>
                            Cost + Discount: ${defaultPrintPrice.toFixed(2)}
                          </Typography>
                        </Box>
                        <Button
                          color="error"
                          type="button"
                          onClick={() => removeQuantityDiscount(index)}
                        >
                          Remove
                        </Button>
                      </Box>
                    </Grid2>
                  );
                })}
              </Grid2>

              <Button
                type="button"
                onClick={() =>
                  addQuantityDiscount({ quantity: 0, discount: 0 })
                }
              >
                Add Bulk Discount
              </Button>
            </Grid2>

            <Grid2 size={12} sx={{ mb: 4 }}>
              <Typography>Colors ({activeColors.length})</Typography>
              <CreatableSelect
                isMulti
                value={activeColors.map((id) => ({
                  label: allColors.filter((c) => c._id.toString() == id)[0]
                    .name,
                  value: id,
                }))}
                onChange={handleModifyColors}
                options={allColors
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((c) => ({
                    label: `${c.name} (${c.category})`,
                    value: c._id,
                  }))}
              />
            </Grid2>

            <Grid2 size={12} sx={{ mb: 4 }}>
              <Typography>Print Areas</Typography>
              <Box sx={{ display: "flex" }}>
                {printAreas.map((p) => (
                  <Box
                    sx={{ mr: 2, display: "flex", alignItems: "center" }}
                    key={p}
                  >
                    <Typography>{p}</Typography>
                    <Checkbox
                      checked={activePrintAreas.includes(p)}
                      onChange={(e) => {
                        if (activePrintAreas.includes(p)) {
                          setActivePrintAreas((prev) =>
                            prev.filter((area) => area != p)
                          );
                        } else {
                          setActivePrintAreas((prev) => {
                            let areas = [...prev];
                            areas.push(p);
                            return areas;
                          });
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Grid2>

            <Grid2 size={12} sx={{ mb: 4 }}>
              <Typography>Print Boxes</Typography>
              {printBoxes.map((box) => (
                <Button
                  key={box}
                  onClick={() => {
                    boxKey.current = "default";
                    boxModalSide.current = box;
                    //console.log(boxModalSide);
                    setBoxModalOpen(!boxModalOpen);
                  }}
                >
                  Set {box} Box
                </Button>
              ))}
            </Grid2>
          </Grid2>

          {activeColors
            .map((id) => allColors.filter((c) => c._id == id)[0])
            .map((c) => {
              let initialImages = {};
              let images = blank?.images?.filter(
                (i) => i.color.toString() == c._id.toString()
              );
              if (images) {
                for (let image of images) {
                  initialImages[image.frontBackSwatch] = image.image;
                }
              }
              return (
                <ColorImage
                  style={blank}
                  key={c._id}
                  activePrintAreas={activePrintAreas.sort(
                    (a, b) => printAreas.indexOf(a) - printAreas.indexOf(b)
                  )}
                  overridePrintBox={(box) =>
                    overridePrintBox({ color_id: c._id, box })
                  }
                  color={c}
                  cropBoxData={cropBoxData}
                  initialImages={initialImages}
                  onUploadImage={(images) =>
                    handleUploadImage({ images, color_id: c._id })
                  }
                  box={box.current}
                  colorCropBoxData={colorCropBoxData}
                />
              );
            })}

          <Grid2 container>
            <Grid2 size={12} sx={{ my: 4 }}>
              <Typography>Size Chart</Typography>
              <Box sx={{ display: "flex", height: "100%" }}>
                <Controller
                  render={({ field: { onChange, value, ref } }) => (
                    <ImageUploadBox
                      onUploadComplete={(e) => onChange(e)}
                      onRemove={(e) => {
                        onChange(e);
                      }}
                    />
                  )}
                  name={`sizeGuide.image`}
                  control={control}
                />

                <Box sx={{ ml: 4, flex: 1 }}>
                  {/* <SizeGuideTable
                  key={sizeWatch.length}
                  initialSizes={sizeWatch.map(s=> ({name: s.name}))}
                  /> */}
                </Box>
              </Box>
            </Grid2>
          </Grid2>

          <hr />
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography>Tearaway Label?</Typography>
            <Controller
              name="tearawayLabel" // Replace with your desired field name
              control={control}
              render={({ field }) => (
                <Checkbox {...field} checked={field.value} />
              )}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography>Only Available For Custom Ordering?</Typography>
            <Controller
              name="onlyAvailableForBulk" // Replace with your desired field name
              control={control}
              render={({ field }) => (
                <Checkbox {...field} checked={field.value} />
              )}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography>Heavy Shipping?</Typography>
            <Controller
              name="heavyShipping" // Replace with your desired field name
              control={control}
              render={({ field }) => (
                <Checkbox {...field} checked={field.value} />
              )}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography>Default Blank?</Typography>
            <Controller
              name="defaultStyle" // Replace with your desired field name
              control={control}
              render={({ field }) => (
                <Checkbox {...field} checked={field.value} />
              )}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography>Active? (hide if unchecked)</Typography>
            <Controller
              name="active" // Replace with your desired field name
              control={control}
              render={({ field }) => (
                <Checkbox {...field} checked={field.value} />
              )}
            />
          </Box>

          <Button type="submit" variant="contained" sx={{ mt: 3 }}>
            Create
          </Button>
        </form>
      </Box>
      <SetBoxModal
        open={boxModalOpen}
        box={box.current}
        onClose={({ data }) => {
          if (data && data != null) {
            if (!box.current[boxKey.current]) {
              box.current[boxKey.current] = {};
            }
            box.current[boxKey.current][boxModalSide.current] = data;
          }
          setBoxModalOpen(false);
        }}
        images={images}
        boxModalSide={boxModalSide}
        boxKey={boxKey.current}
      />
    </Container>
  );
}

const ErrorText = ({ children }) => {
  return (
    <Typography fontSize={12} color={"red"}>
      *{children}
    </Typography>
  );
};

const Rectangle = ({ isSelected, onSelect, onChange, ...props }) => {
  const shapeRef = React.useRef();
  const trRef = React.useRef();

  React.useEffect(() => {
    if (isSelected) {
      // we need to attach transformer manually
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <Rect
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        draggable
        {...props}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

const SetBoxModal = ({ open, onClose, images, boxModalSide, box, boxKey }) => {
  let side = boxModalSide.current;
  if (!box[boxKey]) {
    box[boxKey] = {};
  }

  let initialBox = box && box["default"] && box["default"][side];
  if (boxKey != "default") {
    let foundBox = box && box[boxKey] && box[boxKey][side];
    if (foundBox) {
      initialBox = foundBox;
    }
  }

  let INITIAL_BOX_SETTINGS = {
    x: initialBox ? initialBox.x : 20,
    y: initialBox ? initialBox.y : 50,
    width: initialBox ? initialBox.boxWidth : 140,
    height: initialBox ? initialBox.boxHeight : 175,
  };

  let imageSrc = images.filter((i) => i.frontBackSwatch == side)[0]?.image;
  if (boxKey && boxKey != "default") {
    imageSrc = images.filter(
      (i) => i.frontBackSwatch == side && i.color == boxKey
    )[0]?.image;
  }

  //console.log(imageSrc, "imageSrc:)");

  const boxRef = useRef({
    containerWidth: 400,
    containerHeight: 400,
  });

  const handleSetBox = () => {
    if (onClose) {
      onClose({
        data: boxRef.current && boxRef.current.x ? boxRef.current : null,
      });
    }
  };

  const updateBox = (e) => {
    let node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    // we will reset it back
    boxRef.current = {
      ...boxRef.current,
      x: e.target.x(),
      y: e.target.y(),
      boxWidth: node.width() * scaleX,
      boxHeight: node.height() * scaleY,
    };
    //console.log(boxRef.current);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <Box>
        <Box sx={{ background: "#ffffff22", position: "relative" }}>
          <Stage width={400} height={400}>
            <Layer>
              <Rectangle
                {...INITIAL_BOX_SETTINGS}
                isSelected={true}
                fill="red"
                draggable={true}
                onDragEnd={updateBox}
                onTransformEnd={updateBox}
              />
            </Layer>
          </Stage>

          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: -1,
            }}
          >
            <img width={400} src={imageSrc} />
          </Box>
        </Box>

        <Button onClick={handleSetBox} sx={{ mt: 2 }} variant="contained">
          Set Box
        </Button>
      </Box>
    </Modal>
  );
};
const CropColorSwatchModal = ({
  open,
  onClose,
  color_id,
  cropBoxData,
  imageToCrop,
}) => {
  const [images, setImages] = useState([]);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const cropperRef = useRef();
  const onCrop = async (img) => {
    //console.log("onCrop");
    const cropper = cropperRef.current?.cropper;
    if (!cropBoxData.current) {
      cropBoxData.current = cropper.getCropBoxData();
      //console.log(cropBoxData);
    }
    let base64 = cropper.getCroppedCanvas().toDataURL();
    let jimp = await Jimp.read(base64);
    jimp = await jimp.resize(64, 64);
    base64 = await jimp.getBase64Async(Jimp.MIME_JPEG);
    setFilesToUpload([{ base64, key: `colors/${color_id}.jpg` }]);
  };

  useEffect(() => {
    if (images.length) {
      onClose({ url: images[0] });
      setImages([]);
    }
  }, [images]);

  console.log(cropBoxData);

  useEffect(() => {
    setTimeout(() => {
      const cropper = cropperRef.current?.cropper;
      if (cropper && cropBoxData.current) {
        //console.log("settting crop box");
        cropper.setCropBoxData(cropBoxData.current);
      }
    }, 1000);
  }, []);

  const onUploadComplete = (urls) => {
    setImages((prev) => {
      return [urls[0]];
    });
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <Box>
        <Box sx={{ background: "#ffffff22", position: "relative" }}>
          <Cropper
            src={imageToCrop}
            style={{ height: 400, width: 400 }}
            // Cropper.js options
            initialAspectRatio={1 / 1}
            aspectRatio={1 / 1}
            dragMode={"none"}
            guides={true}
            ref={cropperRef}
          />
        </Box>
        <Button onClick={onCrop} sx={{ mt: 2 }} variant="contained">
          Save Swatch
        </Button>
        <ImageUpload
          filesToUpload={filesToUpload}
          onUploadComplete={onUploadComplete}
        />
      </Box>
    </Modal>
  );
};

const ColorImage = ({
  color,
  cropBoxData,
  onUploadImage,
  initialImages = {},
  activePrintAreas,
  overridePrintBox,
  box,
  blank,
  colorCropBoxData,
}) => {
  const [imageToCrop, setImageToCrop] = useState();
  const cropperRef = useRef();
  const imageType = useRef();
  const [images, setImages] = useState(initialImages);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [col, setCol] = useState(color);
  const [activeColorId, setActiveColorId] = useState();

  function getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  useEffect(() => {
    if (onUploadImage) {
      onUploadImage(images);
    }
  }, [images]);

  const handleImageUpload = async ({ type, file }) => {
    let result = await getBase64(file);
    imageType.current = type;
    setImageToCrop(result);
  };

  const onCrop = (img) => {
    //console.log("onCrop");
    const cropper = cropperRef.current?.cropper;
    cropBoxData.current[imageType.current] = cropper.getCropBoxData();
    let base64 = cropper.getCroppedCanvas().toDataURL();
    setFilesToUpload([{ base64, key: `styles/${Date.now()}.png` }]);
    setImageToCrop(false);
  };

  const onUploadComplete = (urls) => {
    setImages((prev) => {
      return { ...prev, [imageType.current]: urls[0] };
    });
  };

  const updateColor = async (newColor) => {
    //console.log("updateColor()");
    setCol({ ...col, ...newColor });
    let result = await axios.put("/api/admin/colors", {
      color_id: color._id,
      ...newColor,
    });
  };

  useEffect(() => {
    setTimeout(() => {
      let cropper = cropperRef.current?.cropper;
      if (cropper && cropBoxData.current) {
        //console.log("settting crop box");
        cropper.setCropBoxData(cropBoxData.current[imageType.current]);
      }
    }, 50);
  }, [imageToCrop]);

  const BoxPreview = ({ side }) => {
    let boxToUse = box["default"] && box["default"][side];
    if (box[color._id] && box[color._id][side]) {
      boxToUse = box[color._id][side];
    }
    if (boxToUse) {
      let scale = 200 / boxToUse.containerHeight;
      return (
        <Box
          sx={{
            position: "absolute",
            opacity: 0.7,
            background: "red",
            width: boxToUse.boxWidth * scale,
            height: boxToUse.boxHeight * scale,
            top: boxToUse.y * scale,
            left: boxToUse.x * scale,
          }}
        ></Box>
      );
    }
    return null;
  };

  return (
    <>
      <Box>
        <Box sx={{ borderBottom: "1px solid #00000033", py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              key={Date.now()}
              sx={{
                width: 24,
                height: 24,
                background: col.image
                  ? `url('${col.image}?d=${Date.now()}')`
                  : col.hexcode,
                backgroundSize: "contain",
                mr: 2,
              }}
            ></Box>
            <Typography sx={{}}>{color.name}</Typography>
            <EyeDropper
              onColorChange={(hex) =>
                updateColor({ hexcode: hex, image: null })
              }
            />
            <Select
              options={["light", "dark"].map((l) => ({ label: l, value: l }))}
              value={{ value: col.color_type, label: col.color_type }}
              onChange={({ value }) => updateColor({ color_type: value })}
            />
            <Button onClick={() => setActiveColorId(color._id)}>
              Set Color Swatch
            </Button>
          </Box>
          <Grid2 container spacing={4}>
            {activePrintAreas.map((type) => (
              <Grid2 size={12} key={type}>
                <div>{type}</div>
                <Box
                  sx={{
                    border: "1px dashed black",
                    width: 200,
                    height: 200,
                    justifyContent: "center",
                    alignItems: "center",
                    display: "flex",
                  }}
                >
                  {images[type] && (
                    <Box sx={{ width: 200, height: 200, position: "relative" }}>
                      <BoxPreview side={type} />
                      <img src={images[type]} width={200} height={200} />
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          zIndex: 2,
                        }}
                      >
                        <IconButton
                          aria-label="close"
                          onClick={() =>
                            setImages((prev) => ({ ...prev, [type]: null }))
                          }
                        >
                          <FaWindowClose color="red" />
                        </IconButton>
                      </Box>
                    </Box>
                  )}

                  {!images[type] && (
                    <Dropzone
                      onUpload={(file) => handleImageUpload({ file, type })}
                    ></Dropzone>
                  )}
                </Box>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Button onClick={() => overridePrintBox(type)}>
                    Set Override Box
                  </Button>
                </Box>
              </Grid2>
            ))}
          </Grid2>
        </Box>
      </Box>

      <Modal
        open={imageToCrop}
        onClose={() => setImageToCrop(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Cropper
            src={imageToCrop}
            style={{ height: 400, width: 400 }}
            // Cropper.js options
            initialAspectRatio={1 / 1}
            aspectRatio={1 / 1}
            dragMode={"none"}
            guides={true}
            ref={cropperRef}
          />
          <Button onClick={onCrop} sx={{ mt: 2 }} variant="contained">
            Save Crop
          </Button>
        </Box>
      </Modal>

      <ImageUpload
        filesToUpload={filesToUpload}
        onUploadComplete={onUploadComplete}
      />

      {activeColorId && (
        <CropColorSwatchModal
          open={activeColorId}
          onClose={({ url }) => {
            //console.log(url, "URL");
            updateColor({ image: url, hexcode: null });
            setActiveColorId(null);
          }}
          cropBoxData={colorCropBoxData}
          color_id={activeColorId}
          imageToCrop={
            activeColorId &&
            blank?.images?.filter((i) => i.color == activeColorId)[0]?.image
          }
        />
      )}
    </>
  );
};

const SizeGuideTable = ({
  initialSizes = [{ name: "XS" }, { name: "SM" }],
}) => {
 // console.log(initialSizes, "initSizes");
  const [sizes, setSizes] = useState(initialSizes);
  const [columns, setColumns] = useState([]);

  const addColumn = (columnName) => {
    if (columns.includes(columnName)) {
      alert("Column already exists");
      return;
    }
    setColumns([...columns, columnName]);
    setSizes(sizes.map((size) => ({ ...size, [columnName]: "" })));
  };

  const deleteColumn = (columnName) => {
    setColumns(columns.filter((column) => column !== columnName));
    setSizes(
      sizes.map((size) => {
        const newSize = { ...size };
        delete newSize[columnName];
        return newSize;
      })
    );
  };

  const updateSize = (name, field, value) => {
    const newSizes = sizes.map((size) =>
      size.name === name ? { ...size, [field]: value } : size
    );
    setSizes(newSizes);
  };

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Size</th>
            {columns.map((column) => (
              <th key={column}>
                {column}
                <button onClick={() => deleteColumn(column)}>Delete</button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sizes.map((size) => (
            <tr key={size.name}>
              <td>{size.name}</td>
              {columns.map((column) => (
                <td key={column}>
                  <input
                    type="text"
                    value={size[column] || ""}
                    onChange={(e) =>
                      updateSize(size.name, column, e.target.value)
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <hr />
      <div>
        <input type="text" placeholder="New Column Name" id="newColumnName" />
        <button
          type="button"
          onClick={() =>
            addColumn(document.getElementById("newColumnName").value)
          }
        >
          Add Column
        </button>
      </div>
    </div>
  );
};

const SizeStack = ({
  field,
  index,
  control,
  watch,
  sizeOptions,
  printPrice,
}) => {
  const watchedSize = watch(`sizes[${index}].basePrice`) || 0;
  let defaultPrintPrice = Number(watchedSize) + printPrice.price;
  return (
    <Grid2 size={2} key={index}>
      <Box
        key={field.id}
        sx={{ display: "flex", m: 1, flexDirection: "column" }}
      >
        <Box sx={{ zIndex: 2 }}>
          <Controller
            name={`sizes[${index}].name`}
            control={control}
            defaultValue={field.name}
            render={({ field: { onChange, value, ref } }) => {
              return (
                <CreatableSelect
                  inputRef={ref}
                  options={sizeOptions}
                  value={{ value, label: value }}
                  onChange={({ value }) => onChange(value)}
                />
              );
            }}
          />
        </Box>

        <Controller
          render={({ field }) => (
            <TextField
              sx={{ mt: 1 }}
              {...field}
              label="Cost Per Item"
              type="number"
            />
          )}
          name={`sizes[${index}].wholesaleCost`}
          control={control}
          defaultValue={field.wholesaleCost}
        />
        <Controller
          render={({ field }) => (
            <TextField
              sx={{ mt: 1 }}
              {...field}
              label="Blank Price"
              type="number"
            />
          )}
          name={`sizes[${index}].basePrice`}
          control={control}
          defaultValue={field.basePrice}
        />
        <Box sx={{ p: 1, my: 1, backgroundColor: "#f1f1f1" }}>
          <Typography fontWeight={700} fontSize={13}>
            Cost + Print: ${defaultPrintPrice.toFixed(2)}
          </Typography>
        </Box>
        <Controller
          render={({ field }) => (
            <TextField
              sx={{ mt: 1 }}
              {...field}
              label="Retail Price"
              type="number"
            />
          )}
          name={`sizes[${index}].retailPrice`}
          control={control}
          defaultValue={field.retailPrice}
        />

        <Button color="error" type="button" onClick={() => removeSizes(index)}>
          Remove
        </Button>
      </Box>
    </Grid2>
  );
};
