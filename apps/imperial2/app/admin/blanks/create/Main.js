"use client";
import {
  Box,
  Button,
  Checkbox,
  Container,
  Grid2,
  Modal,
  TextField,
  Typography,
  Fab,
  IconButton,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import "cropperjs/dist/cropper.css";
import { FaWindowClose } from "react-icons/fa";
import slugify from "@/utils/slugify";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { Stage, Layer, Transformer, Rect } from "react-konva";
import axios from "axios";
import ImageUploadBox from "@/components/ImageUploadBox";
import LoaderButton from "@/components/LoaderButton";
import ReactPlayer from 'react-player';
import { ImageModal } from "./imageModal";
import "jimp";
export function Main({ colors, blanks, bla, printPricing, locations }) {
  console.log(locations, "locations")
  const [imageGroups, setImageGroups] = useState([])
  const [blank, setBlank] = useState(bla)
  const [printLocations, setPrintLocations] = useState(locations)
  const [activeColors, setActiveColors] = useState(
    blank && blank.colors ? blank.colors : []
  );
  const [color, setColor] = useState(null);
  const [openImage, setOpenImage] = useState(false)
  //console.log(printPricing);
  const handlePrintLocationChange = async (vals)=>{
    console.log(vals)
    let b = {...blank}
    let newLocations = []
    for(let v of vals){
      console.log("for", printLocations)
      let location = printLocations?.filter(p=> p._id.toString() == v.value.toString())[0]
      if(location) newLocations.push(location)
      else{
        console.log("create")
        let res = await axios.post("/api/admin/print-locations", {name: v.label})
        if(res && res.data){
          console.log(res.data)
          newLocations.push(res.data.location)
          setPrintLocations(res.data.printLocations)
        }else{
          alert("something wrong")
        }
      }
    }
    b.printLocations = newLocations
    console.log(b)
    setBlank({...b})
    console.log(blank)
  }
  const [boxSet, setBoxSet] = useState(false)
  useEffect(()=>{
    
    if(blanks){
      let imGr = []
      blanks.map(b=>{
        if(b.multiImages){
          Object.keys(b.multiImages).map(i=>{
              b.multiImages[i].map(im=>{
                //console.log(im, "im")
                im.imageGroup?.map(g=>{
                  if(!imGr.includes(g)) imGr.push(g)
                })
              })
          })
        }
      })
      console.log(imGr, "image groups")
      setImageGroups(imGr)
    }
  },[])
  const [boxModalOpen, setBoxModalOpen] = useState(false);
  const [allColors, setAllColors] = useState(colors);

  const box = useRef(blank && blank.box ? blank.box : {});
  const boxModalSide = useRef();
  const boxModalOnClick = useRef();
  const boxImage= useRef()
  const boxBox = useRef()
  const boxKey = useRef("default");

  const cropBoxData = useRef({});
  const [images, setImages] = useState(blank? blank.multiImages: {front: [],
    back: [],
    "upperSleeve": [],
    "lowerSleeve": [],
    "centerSleeve": [],
    fullSleeve: [],
    center: [],
    centerMini: [],
    "pocket": [],
    "hood": [],
    "leg": [],
    "side": [],
    "modelFront": [],
    "modelBack": [],
  });
  console.log(blank?.sizeGuide, "sizeGuide")
  const [sizeChartImages, setSizeChartImages] = useState(blank && blank?.sizeGuide && blank?.sizeGuide.images? blank?.sizeGuide.images: []);
  const [videos, setVideos] = useState(blank && blank.videos? blank.videos: [])
  useEffect(()=>{
    if(images){
      let active = Object.keys(images).map(s=>{
        if(images[s].length > 0) return s
      })
      active = active.filter(a=> a !== undefined)
      console.log(active, "active")
    }
  },[])
  //keep images the same as array BECAUSE it will be easier to filter no?

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
    console.log(images, images)
    data.sizeGuide.images = sizeChartImages
    data.videos = videos
    console.log(blank.printLocations, "blank locations")
    data.printLocations = blank.printLocations
    let bla= { ...data, multiImages: images, box: box.current, colors: activeColors, };
    console.log(bla)
    let result = await axios.post("/api/admin/blanks", { blank: bla });
    if(result.data.error) alert(result.data.msg)
    else {
      //alert("Saved Data")
      //location.reload()
      console.log(result.data.blank, "returned")
    }
    //console.log(result);
    //alert(result.data);
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
    //console.log(categories, "+++++++++++++++++++");
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
      value: "Imperial",
      label: "Imperial",
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
        weight: 0
      });
    } else {
      let lastSize = sizes[sizes.length - 1];
      return addSizes({
        name: "",
        wholesaleCost: lastSize.wholesaleCost,
        retailPrice: lastSize.retailPrice,
        basePrice: lastSize.basePrice,
        weight: lastSize.weight
      });
    }
  };
  
  const removeSize = (size)=>{
    removeSizes(size)
    //sizes = sizes.filter(s=> s.name !== si.name)
  }

  const printAreas = [
    "front",
    "back",
    "upperSleeve",
    "lowerSleeve",
    "fullSleeve",
    "center",
    "centerMini",
    "pocket",
    "hood",
    "leg",
    "side",
    "modelFront",
    "modelBack",
  ];


  const overridePrintBox = ({ color_id, box, image, side}) => {
    //console.log(color_id, box, "override");
    boxKey.current = color_id;
    boxModalSide.current = side;
    boxImage.current = image;
    boxBox.current = box
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
    <Container maxWidth="xl">
      <Box>
        <Typography variant="h5" mb={2}>
          {blank? "Edit Blank": "Create New Blank"}
        </Typography>
        <form id="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container spacing={3}>
            <Grid2 size={{xs: 6, sm: 4, md: 3}} sx={{ mb: 4 }}>
              
              <TextField
                label="Blank Name"
                sx={{ width: "100%" }}
                {...register("name", { required: "Name is required" })}
              />
              {errors?.name?.message && (
                <ErrorText>{errors?.name?.message}</ErrorText>
              )}
            </Grid2>
            <Grid2 size={{xs: 6, sm: 4, md: 3}} sx={{ mb: 4 }}>
              <TextField
                sx={{ width: "100%" }}
                label="Blank Code"
                {...register("code", { required: "Code is required" })}
              />
              {errors?.code?.message && (
                <ErrorText>{errors?.code?.message}</ErrorText>
              )}
            </Grid2>
              <Grid2 size={{xs: 6, sm: 4, md: 3}} sx={{ mb: 4 }}>
              <TextField
                sx={{ width: "100%" }}
                label="fixer Code"
                {...register("fixerCode")}
              />
            </Grid2>
            <Grid2 size={{xs: 6, sm: 4, md: 3}} sx={{ mb: 4 }}>
              <TextField
                label="slug"
                sx={{ width: "100%" }}
                placeholder="Slug"
                {...register("slug")}
              />
            </Grid2>
            <Grid2 size={{xs: 6, sm: 4, md: 3}} sx={{ mb: 4 }}>
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
            <Grid2 size={{xs: 6, sm: 4, md: 3}} sx={{ mb: 4 }}>
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
            <Grid2 size={{xs: 6, sm: 4, md: 3}} sx={{ mb: 4 }}>
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
            <Grid2 size={{xs: 6, sm: 4, md: 3}} sx={{ mb: 4 }}>
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
            <Grid2 size={{xs: 12, sm: 4, md: 3}} sx={{ mb: 4 }}>
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
            <Grid2 size={{xs: 12, sm: 4, md: 3}} sx={{ mb: 4 }}>
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
            <Grid2 size={{xs: 6, sm: 4, md: 3}} sx={{ mb: 4 }}>
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
              <Grid2 container spacing={2}>
                {sizes.map((field, index) => (
                  <SizeStack
                    control={control}
                    watch={watch}
                    sizeOptions={sizeOptions}
                    key={index}
                    index={index}
                    field={field}
                    removeSize={removeSize}
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
                  label: allColors.filter((c) => c._id.toString() == id)[0]?.name,
                  value: id,
                }))}
                onChange={handleModifyColors}
                options={allColors
                 
                  .map((c) => ({
                    label: `${c?.name} (${c?.category})`,
                    value: c?._id,
                  }))}
              />
            </Grid2>

            <Grid2 size={12} sx={{ mb: 4 }}>
              <Grid2 container spacing={2}>
                  <Grid2 size={{xs: 12, sm: 12, md:12}}
                    
                  >
                    
                      <Typography>Print Locations</Typography>
                      <CreatableSelect
                        isMulti
                        value={blank?.printLocations?.map((id) => ({
                          label: id?.name,
                          value: id._id,
                        }))}
                        onChange={handlePrintLocationChange}
                        options={printLocations?.map((id) => ({
                          label: id?.name,
                          value: id._id,
                        }))}
                      />
                  </Grid2>
              </Grid2>
            </Grid2>

            <Grid2 size={12} sx={{ mb: 4 }}>
              
            </Grid2>
          </Grid2>
          <Grid2 container spacing={2}>
            {activeColors
              .map((id) => allColors.filter((c) => c._id == id)[0])
              .sort((a,b)=>{
                if(a.name?.toLowerCase() > b.name?.toLowerCase()) return 1
                else if(a.name?.toLowerCase() < b.name?.toLowerCase())return -1
                else return 0  
              }).map((c) => (
                  c &&
                  <Grid2 size={{xs: 6, sm: 4, md: 3}} key={c._id}> 
                    <Button onClick={()=>{setColor(c); setOpenImage(true)}} fullWidth  sx={{ margin: ".5%", color: c?.color_type.toLowerCase() == "dark"? "#fff": "#000", background: c.hexcode}} >{c?.name}</Button>
                  </Grid2>
              ))}
            </Grid2>
            <ImageModal openImage={openImage} setOpenImage={setOpenImage} color={color} blank={blank} activePrintAreas={blank?.printLocations?.map(p=>{return p.name})} overridePrintBox={overridePrintBox} images={images} boxSet={boxSet} cropBoxData={cropBoxData} setImages={setImages} colorCropBoxData={colorCropBoxData} imageGroups={imageGroups} setImageGroups={setImageGroups} box={box} printAreas={printAreas} />
          <Grid2 container>
            <Grid2 size={{xs:3, sm: 3, md: 3}} sx={{ my: 4 }}>
              <Typography>Size Chart</Typography>
              <Box sx={{ display: "flex", height: "100%" }}>
                <Controller
                  render={({ field: { onChange, value, ref } }) => (
                    <ImageUploadBox
                      onUploadComplete={(e) => {
                        let sg = [...sizeChartImages]
                        sg.push(e)
                        setSizeChartImages([...sg])
                      }}
                    />
                  )}
                  name={`sizeGuide.image`}
                  control={control}
                />
              </Box>
            </Grid2>
            <Grid2 size={12}></Grid2>
            {sizeChartImages.map((i, j)=>(
              <Grid2 size={{xs: 6, sm: 4, md: 3}} key={j}>
                <Box sx={{ display: "flex", height: "100%" }}>
                  <Box sx={{ position: "relative", p:2 }}>
                    <img src={i} className="img-fluid" style={{width: "100%"}} />
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        zIndex: 2,
                      }}
                    >
                        <IconButton aria-label="close" onClick={()=>{setSizeChartImages(sizeChartImages.filter(im=> im !== i))}}>
                          <FaWindowClose color="red" />
                        </IconButton>
                      
                    </Box>
                  </Box>
                </Box>
              </Grid2>
            ))}
          </Grid2>

          <hr />
          <Grid2 container spacing={2}>
          <Grid2 size={{xs:3, sm: 3, md: 3}} sx={{ my: 4 }}>
              <Typography>Videos</Typography>
              <Box sx={{ display: "flex", height: "100%" }}>
                <Controller
                  render={({ field: { onChange, value, ref } }) => (
                    <ImageUploadBox
                      onUploadComplete={(e) => {
                        console.log(e)
                        let sg = [...videos]
                        sg.push(e)
                        setVideos([...sg])
                      }}
                    />
                  )}
                  name={`sizeGuide.image`}
                  control={control}
                />
              </Box>
            </Grid2>
            <Grid2 size={12}></Grid2>
            {videos.map((v, i)=>(
              <Grid2 size={12} key={i}>
               <Box sx={{ display: "flex", height: "100%" }} >
                   <Box sx={{ position: "relative", p:2 }}>
                     <ReactPlayer url={v} controls={true} />
                     <Box
                       sx={{
                         position: "absolute",
                         top: 0,
                         right: 0,
                         zIndex: 2,
                       }}
                     >
                         <IconButton aria-label="close" onClick={()=>{setVideos(videos.filter(im=> im !== v))}}>
                           <FaWindowClose color="red" />
                         </IconButton>
                       
                     </Box>
                   </Box>
                 </Box>
             </Grid2>
            ))}
          </Grid2>
          <hr/>
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
          <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", position: "sticky", bottom: "20px"}}>
            <Fab type="submit" id="fab" color="secondary" sx={{ mt: 3, zIndex: 9999, position: "sticky", bottom: "20px" }}>
              {blank? "Save": "Create"}
            </Fab>
          </Box>
        </form>
      </Box>
      <SetBoxModal
        open={boxModalOpen}
        onClose={() => {
          setBoxModalOpen(false);
        }}
        setBoxSet={setBoxSet}
        boxSet={boxSet}
        images={images}
        setImages={setImages}
        side={boxModalSide.current}
        image={boxImage.current}
        box={boxBox.current}
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

const SetBoxModal = ({ open, onClose, images, setImages, box, image, side, boxSet, setBoxSet }) => {
  console.log(image)
  let initialBox = box;


  let INITIAL_BOX_SETTINGS = {
    x: initialBox ? initialBox.x : 20,
    y: initialBox ? initialBox.y : 50,
    rotation: initialBox ? initialBox.rotation : 0,
    width: initialBox ? initialBox.boxWidth : 140,
    height: initialBox ? initialBox.boxHeight : 175,
  };
  if(!initialBox) initialBox = INITIAL_BOX_SETTINGS
  const [imageSrc, setImageSrc] = useState()
  useEffect(()=>{
    let getRender = async ()=>{
      let res = await axios.post("/api/renderImages", {box, designImage: null, styleImage: image, imageDimensions: null})
      if(res.data.base64) setImageSrc(res.data.base64)
    }
    if(open){
      console.log("pulling Image")
      getRender()
      setImageSrc(null)
    }
  },[open])
  // console.log(imageSrc, "imageSrc:)", side);

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
    console.log(e.target)
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    // we will reset it back
    box = {
      ...boxRef.current,
      x: e.target.x(),
      y: e.target.y(),
      rotation: e.target.rotation(),
      boxWidth: node.width() * scaleX,
      boxHeight: node.height() * scaleY,
    };
    let im = {...images}
    console.log(im, image, box)
    if(!im[side].filter(i=> i.image == image)[0].box) im[side].filter(i=> i.image == image)[0].box = [];
    im[side].filter(i=> i.image == image)[0].box[0] = box
    console.log(im[side].filter(i=> i.image == image)[0].box[0])
    setImages({...im})
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
  removeSize
}) => {
  const watchedSize = watch(`sizes[${index}].basePrice`) || 0;
  let defaultPrintPrice = Number(watchedSize) + printPrice.price;
  return (
    <Grid2 size={{xs: 6, sm: 4, md: 3}} key={index}>
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
        <Controller
          render={({ field }) => (
            <TextField
              sx={{ mt: 1 }}
              {...field}
              label="Weight"
              type="number"
            />
          )}
          name={`sizes[${index}].weight`}
          control={control}
          defaultValue={field.weight}
        />

        <Button color="error" type="button" onClick={() => removeSize(index)}>
          Remove
        </Button>
      </Box>
    </Grid2>
  );
};
