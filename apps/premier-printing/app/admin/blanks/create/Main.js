"use client";
import {
  Box, Button, Container, Grid2, Modal, TextField, Typography, IconButton,
  Card, CardContent, CardActionArea, Divider, Stack, Chip, Switch, FormControlLabel, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
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
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import ImageIcon from '@mui/icons-material/Image';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StraightenIcon from '@mui/icons-material/Straighten';
import PrintIcon from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import PaletteIcon from '@mui/icons-material/Palette';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

const selectMenuPortalProps = {
  menuPortalTarget: typeof document !== "undefined" ? document.body : null,
  menuPosition: "fixed",
  styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) },
};

const FieldLabel = ({ children }) => (
  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, display: "block", mb: 0.5 }}>
    {children}
  </Typography>
);

const SectionCard = ({ icon, title, subtitle, children, id }) => (
  <Card variant="outlined" sx={{ borderRadius: 2 }} id={id}>
    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
        <Box sx={{ color: "primary.main", mt: 0.25 }}>{icon}</Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </Stack>
      <Divider sx={{ mb: 2 }} />
      {children}
    </CardContent>
  </Card>
);

export function Main({ colors, blanks, bla, printPricing, locations }) {
  const [imageGroups, setImageGroups] = useState([])
  const [blank, setBlank] = useState(bla)
  const [printLocations, setPrintLocations] = useState(locations)
  const [activeColors, setActiveColors] = useState(blank?.colors ?? []);
  const [color, setColor] = useState(null);
  const [openImage, setOpenImage] = useState(false)

  const handlePrintLocationChange = async (vals) => {
    let b = { ...blank }
    let newLocations = []
    for (let v of vals) {
      let location = printLocations?.find(p => p._id.toString() === v.value.toString())
      if (location) newLocations.push(location)
      else {
        let res = await axios.post("/api/admin/print-locations", { name: v.label })
        if (res?.data) {
          newLocations.push(res.data.location)
          setPrintLocations(res.data.printLocations)
        } else alert("Something went wrong")
      }
    }
    b.printLocations = newLocations
    setBlank({ ...b })
  }

  const [boxSet, setBoxSet] = useState(false)
  useEffect(() => {
    if (blanks) {
      let imGr = []
      blanks.map(b => {
        if (b.multiImages) {
          Object.keys(b.multiImages).map(i => {
            b.multiImages[i].map(im => {
              im.imageGroup?.map(g => { if (!imGr.includes(g)) imGr.push(g) })
            })
          })
        }
      })
      setImageGroups(imGr)
    }
  }, [])

  const [boxModalOpen, setBoxModalOpen] = useState(false);
  const [allColors, setAllColors] = useState(colors);
  const box = useRef(blank?.box ?? {});
  const boxModalSide = useRef();
  const boxModalOnClick = useRef();
  const boxImage = useRef();
  const boxBox = useRef();
  const boxKey = useRef("default");
  const cropBoxData = useRef({});

  const [images, setImages] = useState(blank?.multiImages ?? {
    front: [], back: [], upperSleeve: [], lowerSleeve: [], centerSleeve: [],
    fullSleeve: [], center: [], centerMini: [], pocket: [], hood: [], leg: [],
    side: [], modelFront: [], modelBack: [],
  });

  const [sizeChartImages, setSizeChartImages] = useState(blank?.sizeGuide?.images ?? []);
  const [videos, setVideos] = useState(blank?.videos ?? []);

  const { control, register, handleSubmit, setValue, getValues, watch, formState: { errors } } = useForm({
    defaultValues: { handlingTime: { min: 1, max: 2 }, ...blank },
  });

  const onSubmit = async (data) => {
    data.sizeGuide.images = sizeChartImages
    data.videos = videos
    data.printLocations = blank?.printLocations
    let bla = { ...data, multiImages: images, box: box.current, colors: activeColors };
    let result = await axios.post("/api/admin/blanks", { blank: bla });
    if (result.data.error) alert(result.data.msg)
  };

  const { fields: bulletPoints, append: addBulletPoint, remove: removeBulletPoint } = useFieldArray({ control, name: "bulletPoints" });
  const { fields: sizes, append: addSizes, remove: removeSizes } = useFieldArray({ control, name: "sizes" });
  const { fields: quantityDiscounts, append: addQuantityDiscount, remove: removeQuantityDiscount } = useFieldArray({ control, name: "quantityDiscounts" });

  const departments = [...new Set(blanks.map(s => s.department))].map(d => ({ value: d, label: d }));
  const categories = [...new Set(blanks.map(s => s.category))].filter(d => d?.length).map(d => ({ value: d, label: d })).sort((a, b) => a.value[0].trim().localeCompare(b.value[0].trim()));
  const brands = [...new Set(blanks.map(s => s.brand))].filter(b => b?.length > 0).map(b => ({ label: b, value: b }));

  const nameWatch = watch("name");
  useEffect(() => {
    if (nameWatch?.length) setValue("slug", slugify(nameWatch));
  }, [nameWatch]);

  const createNewColor = async (c) => {
    let result = await axios.post("/api/admin/colors", { color: { name: c.label, color_type: "light", category: "Standard" } });
    return result.data.color;
  };

  const handleModifyColors = async (selectedColors) => {
    let newActiveColors = [];
    for (let selectedColor of selectedColors) {
      let found = allColors.find(c => c._id.toString() === selectedColor.value);
      if (!found) {
        let newColor = await createNewColor(selectedColor);
        setAllColors(prev => [...prev, newColor]);
        await new Promise(resolve => setTimeout(resolve, 100));
        newActiveColors.push({ label: selectedColor.label, value: newColor._id.toString() });
      } else {
        newActiveColors.push(selectedColor);
      }
    }
    setActiveColors(newActiveColors.map(c => c.value));
  };

  const sizeOptions = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"].map(b => ({ label: b, value: b }));
  const vendors = [{ value: "Simply Sage", label: "Simply Sage" }, { value: "Premier Printing", label: "Premier Printing" }];
  const suppliers = ["S&S Activewear", "Sanmar", "Onestop"].map(b => ({ label: b, value: b }));
  const bulletPointDefaults = ["Fit", "Fabric", "Care Instructions"].map(b => ({ label: b, value: b }));
  const quantityDiscountOptions = [5, 10, 25, 50, 100, 150, 250, 500, 1000].map(b => ({ label: b, value: b }));
  const printAreas = ["front", "back", "upperSleeve", "lowerSleeve", "fullSleeve", "center", "centerMini", "pocket", "hood", "leg", "side", "modelFront", "modelBack"];

  const addNewSize = () => {
    let currentSizes = getValues("sizes");
    if (!currentSizes.length) return addSizes({ name: "", wholesaleCost: 0, retailPrice: 0, basePrice: 0, weight: 0 });
    let last = currentSizes[currentSizes.length - 1];
    return addSizes({ name: "", wholesaleCost: last.wholesaleCost, retailPrice: last.retailPrice, basePrice: last.basePrice, weight: last.weight });
  };

  const overridePrintBox = ({ color_id, box, image, side }) => {
    boxKey.current = color_id;
    boxModalSide.current = side;
    boxImage.current = image;
    boxBox.current = box;
    setBoxModalOpen(!boxModalOpen);
  };

  const generateDescription = async () => {
    let name = getValues("name");
    let description = getValues("description");
    let result = await axios.post("/api/ai/", { prompt: `generate me a description for a ${name} using this data: ${description}. limit to under 300 characters.` });
    setValue("description", result.data);
  };

  let selectedPrintMethod = watch("printTypes")?.[0]?.toUpperCase();
  let DEFAULT_PRINT_PRICE = printPricing[selectedPrintMethod] ?? printPricing["DTF"];
  let watchedSizes = watch("sizes");

  const getDefaultStoreCost = (quantity = 0) => {
    if (!watchedSizes[0]) return 0;
    let printDiscount = 0;
    for (let discount of DEFAULT_PRINT_PRICE.quantityDiscounts.sort((a, b) => a.quantity - b.quantity)) {
      if (quantity >= discount.quantity) printDiscount = discount.discount;
    }
    return Number(watchedSizes[0].basePrice) + Number(DEFAULT_PRINT_PRICE.price) - Number(printDiscount);
  };

  const colorCropBoxData = useRef();
  const sortedActiveColors = activeColors
    .map(id => allColors.find(c => c._id === id))
    .filter(Boolean)
    .sort((a, b) => a.name?.toLowerCase().localeCompare(b.name?.toLowerCase()));

  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      {/* Sticky header */}
      <Box sx={{ position: "sticky", top: 0, zIndex: 100, backgroundColor: "background.paper", borderBottom: "1px solid", borderColor: "divider", py: 1.5, px: 0, mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{blank ? "Edit Blank" : "Create New Blank"}</Typography>
          {blank?.name && <Typography variant="caption" color="text.secondary">{blank.name}{blank.code ? ` · ${blank.code}` : ""}</Typography>}
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} href="/admin/blanks" size="small">Back</Button>
          <Button type="submit" form="blank-form" variant="contained" startIcon={<SaveIcon />} size="small">{blank ? "Save" : "Create"}</Button>
        </Stack>
      </Box>

      <form id="blank-form" onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3}>

          {/* Basic Info */}
          <SectionCard icon={<LocalOfferIcon />} title="Basic Information" subtitle="Name, code, and URL slug for this blank">
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth size="small" label="Blank Name" {...register("name", { required: "Name is required" })} />
                {errors?.name?.message && <ErrorText>{errors.name.message}</ErrorText>}
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth size="small" label="Blank Code" {...register("code", { required: "Code is required" })} />
                {errors?.code?.message && <ErrorText>{errors.code.message}</ErrorText>}
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth size="small" label="Fixer Code" {...register("fixerCode")} />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth size="small" label="Slug" {...register("slug")} />
              </Grid2>
            </Grid2>
          </SectionCard>

          {/* Classification */}
          <SectionCard icon={<DescriptionIcon />} title="Classification" subtitle="Vendor, department, category, brand, and suppliers">
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <FieldLabel>Vendor</FieldLabel>
                <Controller name="vendor" rules={{ required: "Vendor is required" }} control={control} render={({ field: { onChange, value, ref } }) => (
                  <Select {...selectMenuPortalProps} inputRef={ref} options={vendors} value={{ value, label: value }} onChange={({ value }) => onChange(value)} />
                )} />
                {errors?.vendor?.message && <ErrorText>{errors.vendor.message}</ErrorText>}
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <FieldLabel>Department</FieldLabel>
                <Controller name="department" rules={{ required: "Department is required" }} control={control} render={({ field: { onChange, value, ref } }) => (
                  <CreatableSelect {...selectMenuPortalProps} inputRef={ref} options={departments} value={{ value, label: value }} onChange={({ value }) => onChange(value)} />
                )} />
                {errors?.department?.message && <ErrorText>{errors.department.message}</ErrorText>}
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <FieldLabel>Category</FieldLabel>
                <Controller name="category" rules={{ required: "Category is required" }} control={control} render={({ field: { onChange, value, ref } }) => (
                  <CreatableSelect {...selectMenuPortalProps} inputRef={ref} options={categories} value={{ value, label: value }} onChange={({ value }) => onChange(value)} />
                )} />
                {errors?.category?.message && <ErrorText>{errors.category.message}</ErrorText>}
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <FieldLabel>Brand</FieldLabel>
                <Controller name="brand" rules={{ required: "Brand is required" }} control={control} render={({ field: { onChange, value, ref } }) => (
                  <CreatableSelect {...selectMenuPortalProps} inputRef={ref} options={brands.sort((a, b) => a.label.localeCompare(b.label))} value={{ value, label: value }} onChange={({ value }) => onChange(value)} />
                )} />
                {errors?.brand?.message && <ErrorText>{errors.brand.message}</ErrorText>}
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <FieldLabel>Suppliers</FieldLabel>
                <Controller name="suppliers" control={control} render={({ field: { onChange, value, ref } }) => (
                  <CreatableSelect {...selectMenuPortalProps} isMulti inputRef={ref} options={suppliers} value={value?.length ? value.map(v => ({ value: v, label: v })) : []} onChange={val => onChange(val.map(v => v.value))} />
                )} />
              </Grid2>
            </Grid2>
          </SectionCard>

          {/* Print Settings */}
          <SectionCard icon={<PrintIcon />} title="Print Configuration" subtitle="Print types, locations, and handling time">
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <FieldLabel>Print Types</FieldLabel>
                <Controller name="printTypes" control={control} render={({ field: { onChange, value, ref } }) => (
                  <CreatableSelect {...selectMenuPortalProps} isMulti inputRef={ref}
                    options={["DTF", "DTG", "DTF/Vinyl Hybrid", "Vinyl", "Sublimation", "Embroidery", "Paper Printing"].map(c => ({ value: c, label: c }))}
                    value={value?.length ? value.map(v => ({ value: v, label: v })) : []}
                    onChange={val => onChange(val.map(v => v.value))}
                  />
                )} />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <FieldLabel>Print Locations</FieldLabel>
                <CreatableSelect {...selectMenuPortalProps} isMulti
                  value={blank?.printLocations?.map(id => ({ label: id?.name, value: id._id }))}
                  onChange={handlePrintLocationChange}
                  options={printLocations?.map(id => ({ label: id?.name, value: id._id }))}
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <FieldLabel>Handling Time (Days)</FieldLabel>
                <Stack direction="row" spacing={1}>
                  <Controller name="handlingTime.min" control={control} rules={{ required: true }} defaultValue="" render={({ field }) => (
                    <TextField {...field} fullWidth size="small" label="Min" type="number" inputProps={{ min: 0 }} onChange={e => field.onChange(Number(e.target.value))} />
                  )} />
                  <Controller name="handlingTime.max" control={control} rules={{ required: true }} defaultValue="" render={({ field }) => (
                    <TextField {...field} fullWidth size="small" label="Max" type="number" inputProps={{ min: 0 }} onChange={e => field.onChange(Number(e.target.value))} />
                  )} />
                </Stack>
              </Grid2>
            </Grid2>
          </SectionCard>

          {/* Description & Features */}
          <SectionCard icon={<DescriptionIcon />} title="Description & Features" subtitle="Product description and bullet point features">
            <Stack spacing={3}>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <FieldLabel>Description</FieldLabel>
                  <LoaderButton onClick={generateDescription} size="small" startIcon={<AutoFixHighIcon fontSize="small" />}>
                    Generate with AI
                  </LoaderButton>
                </Box>
                <TextField multiline rows={5} fullWidth variant="outlined" placeholder="Enter a product description..." {...register("description", { required: "Description is required" })} />
                {errors?.description?.message && <ErrorText>{errors.description.message}</ErrorText>}
              </Box>

              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                  <FieldLabel>Bullet Points</FieldLabel>
                  <Button size="small" startIcon={<AddIcon />} onClick={() => addBulletPoint({ content: "" })}>Add</Button>
                </Box>
                <Stack spacing={1.5}>
                  {bulletPoints.map((field, index) => (
                    <Card key={field.id} variant="outlined" sx={{ borderRadius: 1.5 }}>
                      <CardContent sx={{ p: "12px !important" }}>
                        <Grid2 container spacing={1.5} alignItems="flex-start">
                          <Grid2 size={{ xs: 12, sm: 4 }}>
                            <Controller name={`bulletPoints[${index}].title`} control={control} defaultValue={field.title} render={({ field: { onChange, value, ref } }) => (
                              <CreatableSelect {...selectMenuPortalProps} inputRef={ref} options={bulletPointDefaults} value={{ value, label: value }} onChange={({ value }) => onChange(value)} placeholder="Category..." />
                            )} />
                          </Grid2>
                          <Grid2 size={{ xs: 12, sm: 7 }}>
                            <Controller render={({ field }) => (
                              <TextField {...field} fullWidth size="small" label="Description" multiline maxRows={3} />
                            )} name={`bulletPoints[${index}].description`} control={control} defaultValue={field.description} />
                          </Grid2>
                          <Grid2 size={{ xs: 12, sm: 1 }} sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                            <IconButton size="small" color="error" onClick={() => removeBulletPoint(index)}><DeleteIcon fontSize="small" /></IconButton>
                          </Grid2>
                        </Grid2>
                      </CardContent>
                    </Card>
                  ))}
                  {bulletPoints.length === 0 && <Typography variant="body2" color="text.secondary">No bullet points yet. Click Add to create one.</Typography>}
                </Stack>
              </Box>
            </Stack>
          </SectionCard>

          {/* Sizes */}
          <SectionCard icon={<StraightenIcon />} title="Sizes & Pricing" subtitle="Configure available sizes with costs, retail price, and weight">
            <Grid2 container spacing={2}>
              {sizes.map((field, index) => (
                <SizeStack key={field.id} control={control} watch={watch} sizeOptions={sizeOptions} index={index} field={field} removeSize={removeSizes} printPrice={DEFAULT_PRINT_PRICE} />
              ))}
            </Grid2>
            <Button sx={{ mt: 2 }} size="small" startIcon={<AddIcon />} onClick={addNewSize}>Add Size</Button>
          </SectionCard>

          {/* Bulk Discounts */}
          <SectionCard icon={<LocalOfferIcon />} title="Bulk Discounts" subtitle="Quantity-based pricing discounts">
            <Grid2 container spacing={2}>
              {quantityDiscounts.map((field, index) => {
                const watchedDiscount = watch(`quantityDiscounts[${index}].discount`) || 0;
                const watchedQuantity = watch(`quantityDiscounts[${index}].quantity`) || 0;
                const totalCost = getDefaultStoreCost(watchedQuantity) - Number(watchedDiscount);
                return (
                  <Grid2 key={field.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                    <Card variant="outlined" sx={{ borderRadius: 1.5, position: "relative" }}>
                      <CardContent sx={{ p: "12px !important" }}>
                        <IconButton size="small" color="error" onClick={() => removeQuantityDiscount(index)} sx={{ position: "absolute", top: 4, right: 4 }}><DeleteIcon fontSize="small" /></IconButton>
                        <FieldLabel>Quantity</FieldLabel>
                        <Box sx={{ mb: 1 }}>
                          <Controller name={`quantityDiscounts[${index}].quantity`} control={control} defaultValue={field.quantity} render={({ field: { onChange, value, ref } }) => (
                            <CreatableSelect {...selectMenuPortalProps} inputRef={ref} options={quantityDiscountOptions} value={{ value, label: value }} onChange={({ value }) => onChange(value)} />
                          )} />
                        </Box>
                        <Controller render={({ field }) => (
                          <TextField {...field} fullWidth size="small" label="Discount ($)" type="number" sx={{ mb: 1 }} />
                        )} name={`quantityDiscounts[${index}].discount`} control={control} defaultValue={field.discount} />
                        <Chip size="small" label={`Cost + discount: $${totalCost.toFixed(2)}`} color="primary" variant="outlined" sx={{ fontSize: "0.7rem", width: "100%" }} />
                      </CardContent>
                    </Card>
                  </Grid2>
                );
              })}
            </Grid2>
            <Button sx={{ mt: 2 }} size="small" startIcon={<AddIcon />} onClick={() => addQuantityDiscount({ quantity: 0, discount: 0 })}>Add Bulk Discount</Button>
          </SectionCard>

          {/* Colors */}
          <SectionCard icon={<PaletteIcon />} title="Colors & Images" subtitle="Select colors and manage print images per color">
            <FieldLabel>Selected Colors ({activeColors.length})</FieldLabel>
            <Box sx={{ mb: 2.5 }}>
              <CreatableSelect {...selectMenuPortalProps} isMulti
                value={activeColors.map(id => ({ label: allColors.find(c => c._id.toString() === id)?.name, value: id }))}
                onChange={handleModifyColors}
                options={allColors.map(c => ({ label: `${c?.name} (${c?.category})`, value: c?._id }))}
              />
            </Box>

            {sortedActiveColors.length > 0 && (
              <>
                <FieldLabel>Manage Images by Color</FieldLabel>
                <Grid2 container spacing={1.5}>
                  {sortedActiveColors.map(c => (
                    <Grid2 key={c._id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                      <Card variant="outlined" sx={{ borderRadius: 1.5, transition: "box-shadow 150ms", "&:hover": { boxShadow: 3 } }}>
                        <CardActionArea onClick={() => { setColor(c); setOpenImage(true); }} sx={{ p: 1.5 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: c.hexcode, border: "1px solid rgba(0,0,0,0.18)", flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.4, mt: 0.5 }}>
                            <ImageIcon sx={{ fontSize: 12 }} /> Manage images
                          </Typography>
                        </CardActionArea>
                      </Card>
                    </Grid2>
                  ))}
                </Grid2>
              </>
            )}
          </SectionCard>

          {/* Media */}
          <SectionCard icon={<VideoLibraryIcon />} title="Media" subtitle="Size chart images and product videos">
            <Grid2 container spacing={3}>
              <Grid2 size={12}>
                <FieldLabel>Size Chart Images</FieldLabel>
                <Box sx={{ mb: 1.5 }}>
                  <Controller render={({ field: { onChange, value, ref } }) => (
                    <ImageUploadBox onUploadComplete={e => setSizeChartImages(prev => [...prev, e])} />
                  )} name="sizeGuide.image" control={control} />
                </Box>
                {sizeChartImages.length > 0 && (
                  <Grid2 container spacing={1.5}>
                    {sizeChartImages.map((i, j) => (
                      <Grid2 size={{ xs: 6, sm: 4, md: 3 }} key={j}>
                        <Card variant="outlined" sx={{ borderRadius: 1.5, position: "relative", overflow: "hidden" }}>
                          <img src={i} style={{ width: "100%", display: "block" }} />
                          <IconButton size="small" onClick={() => setSizeChartImages(prev => prev.filter(im => im !== i))} sx={{ position: "absolute", top: 4, right: 4, backgroundColor: "rgba(255,255,255,0.85)", "&:hover": { backgroundColor: "rgba(255,255,255,1)" }, color: "#780606" }}>
                            <FaWindowClose size={14} />
                          </IconButton>
                        </Card>
                      </Grid2>
                    ))}
                  </Grid2>
                )}
              </Grid2>

              <Grid2 size={12}>
                <Divider sx={{ mb: 2 }} />
                <FieldLabel>Videos</FieldLabel>
                <Box sx={{ mb: 1.5 }}>
                  <Controller render={({ field: { onChange, value, ref } }) => (
                    <ImageUploadBox onUploadComplete={e => setVideos(prev => [...prev, e])} />
                  )} name="sizeGuide.video" control={control} />
                </Box>
                {videos.length > 0 && (
                  <Stack spacing={1.5}>
                    {videos.map((v, i) => (
                      <Card key={i} variant="outlined" sx={{ borderRadius: 1.5, position: "relative", p: 1.5 }}>
                        <ReactPlayer url={v} controls={true} width="100%" height="auto" />
                        <IconButton size="small" onClick={() => setVideos(prev => prev.filter(im => im !== v))} sx={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(255,255,255,0.85)", "&:hover": { backgroundColor: "rgba(255,255,255,1)" }, color: "#780606" }}>
                          <FaWindowClose size={14} />
                        </IconButton>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Grid2>
            </Grid2>
          </SectionCard>

          {/* Settings */}
          <SectionCard icon={<SettingsIcon />} title="Settings" subtitle="Additional options for this blank">
            <Stack spacing={0} divider={<Divider flexItem />}>
              {[
                { name: "tearawayLabel", label: "Tearaway Label", description: "This blank uses a tearaway label" },
                { name: "onlyAvailableForBulk", label: "Bulk Orders Only", description: "Only available for custom bulk ordering" },
                { name: "heavyShipping", label: "Heavy Shipping", description: "Requires heavy shipping rates" },
                { name: "defaultStyle", label: "Default Blank", description: "Use as the default blank style" },
                { name: "active", label: "Active", description: "Hidden from listings when unchecked" },
              ].map(({ name, label, description }) => (
                <Box key={name} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.25 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{label}</Typography>
                    <Typography variant="caption" color="text.secondary">{description}</Typography>
                  </Box>
                  <Controller name={name} control={control} render={({ field }) => (
                    <Switch {...field} checked={!!field.value} size="small" />
                  )} />
                </Box>
              ))}
            </Stack>
          </SectionCard>

        </Stack>
      </form>

      <ImageModal openImage={openImage} setOpenImage={setOpenImage} color={color} blank={blank} activePrintAreas={blank?.printLocations?.map(p => p.name)} overridePrintBox={overridePrintBox} images={images} boxSet={boxSet} cropBoxData={cropBoxData} setImages={setImages} colorCropBoxData={colorCropBoxData} imageGroups={imageGroups} setImageGroups={setImageGroups} box={box} printAreas={printAreas} />

      <SetBoxModal
        open={boxModalOpen}
        onClose={() => setBoxModalOpen(false)}
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

const ErrorText = ({ children }) => (
  <Typography fontSize={12} color="error" sx={{ mt: 0.5 }}>*{children}</Typography>
);

const SizeStack = ({ field, index, control, watch, sizeOptions, printPrice, removeSize }) => {
  const watchedBase = watch(`sizes[${index}].basePrice`) || 0;
  const defaultPrintPrice = Number(watchedBase) + printPrice.price;
  return (
    <Grid2 size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
      <Card variant="outlined" sx={{ borderRadius: 1.5, position: "relative" }}>
        <CardContent sx={{ p: "12px !important" }}>
          <IconButton size="small" color="error" onClick={() => removeSize(index)} sx={{ position: "absolute", top: 4, right: 4 }}><DeleteIcon fontSize="small" /></IconButton>
          <FieldLabel>Size</FieldLabel>
          <Box sx={{ mb: 1 }}>
            <Controller name={`sizes[${index}].name`} control={control} defaultValue={field.name} render={({ field: { onChange, value, ref } }) => (
              <CreatableSelect {...selectMenuPortalProps} inputRef={ref} options={sizeOptions} value={{ value, label: value }} onChange={({ value }) => onChange(value)} />
            )} />
          </Box>
          <Stack spacing={1}>
            <Controller render={({ field }) => <TextField {...field} fullWidth size="small" label="Cost Per Item" type="number" />} name={`sizes[${index}].wholesaleCost`} control={control} defaultValue={field.wholesaleCost} />
            <Controller render={({ field }) => <TextField {...field} fullWidth size="small" label="Blank Price" type="number" />} name={`sizes[${index}].basePrice`} control={control} defaultValue={field.basePrice} />
            <Chip size="small" label={`Cost + Print: $${defaultPrintPrice.toFixed(2)}`} color="primary" variant="outlined" sx={{ fontSize: "0.7rem" }} />
            <Controller render={({ field }) => <TextField {...field} fullWidth size="small" label="Retail Price" type="number" />} name={`sizes[${index}].retailPrice`} control={control} defaultValue={field.retailPrice} />
            <Controller render={({ field }) => <TextField {...field} fullWidth size="small" label="Weight (oz)" type="number" />} name={`sizes[${index}].weight`} control={control} defaultValue={field.weight} />
          </Stack>
        </CardContent>
      </Card>
    </Grid2>
  );
};

const FieldLabel = ({ children }) => (
  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, display: "block", mb: 0.5 }}>
    {children}
  </Typography>
);

const Rectangle = ({ isSelected, onSelect, onChange, ...props }) => {
  const shapeRef = React.useRef();
  const trRef = React.useRef();
  React.useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);
  return (
    <React.Fragment>
      <Rect onClick={onSelect} onTap={onSelect} ref={shapeRef} draggable {...props} />
      {isSelected && (
        <Transformer ref={trRef} flipEnabled={false} boundBoxFunc={(oldBox, newBox) => {
          if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) return oldBox;
          return newBox;
        }} />
      )}
    </React.Fragment>
  );
};

const CANVAS_SIZE = 480;

const SetBoxModal = ({ open, onClose, images, setImages, box, image, side, boxSet, setBoxSet }) => {
  const getInitialSettings = () => ({
    x: box?.x ?? 20,
    y: box?.y ?? 50,
    rotation: box?.rotation ?? 0,
    width: box?.boxWidth ?? 140,
    height: box?.boxHeight ?? 175,
  });

  const [imageSrc, setImageSrc] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [liveBox, setLiveBox] = useState(getInitialSettings());
  const currentBoxData = useRef({});

  useEffect(() => {
    if (open) {
      setImageSrc(null);
      setImageLoading(true);
      setLiveBox(getInitialSettings());
      currentBoxData.current = {};
      axios.post("/api/renderImages", { box, designImage: null, styleImage: image, imageDimensions: null })
        .then(res => { if (res.data.base64) setImageSrc(res.data.base64); })
        .finally(() => setImageLoading(false));
    }
  }, [open]);

  const handleConfirm = () => {
    if (onClose) onClose({ data: currentBoxData.current?.x != null ? currentBoxData.current : null });
  };

  const updateBox = (e) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const newBox = {
      ...currentBoxData.current,
      x: e.target.x(),
      y: e.target.y(),
      rotation: e.target.rotation(),
      boxWidth: node.width() * scaleX,
      boxHeight: node.height() * scaleY,
    };
    currentBoxData.current = newBox;
    setLiveBox({
      x: Math.round(newBox.x),
      y: Math.round(newBox.y),
      width: Math.round(newBox.boxWidth),
      height: Math.round(newBox.boxHeight),
      rotation: Math.round(newBox.rotation),
    });
    let im = { ...images };
    const imgEntry = im[side]?.find(i => i.image === image);
    if (imgEntry) {
      if (!imgEntry.box) imgEntry.box = [];
      imgEntry.box[0] = newBox;
    }
    setImages({ ...im });
  };

  const sideLabel = side
    ? side.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()
    : 'Print Box';

  const initialSettings = getInitialSettings();

  const statItems = [
    { label: "X", value: liveBox.x },
    { label: "Y", value: liveBox.y },
    { label: "W", value: liveBox.width },
    { label: "H", value: liveBox.height },
    ...(liveBox.rotation ? [{ label: "Rot", value: `${liveBox.rotation}°` }] : []),
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}>
      {/* Gradient header */}
      <Box sx={{
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        px: 2.5, pt: 2.5, pb: 2,
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      }}>
        <Stack direction="row" spacing={1.75} alignItems="flex-start">
          <Box sx={{
            width: 44, height: 44, borderRadius: 1.5, flexShrink: 0,
            backgroundColor: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <PrintIcon sx={{ color: "#fff", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, lineHeight: 1.2 }}>
              Set Print Box
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.72)", display: "block", mt: 0.25 }}>
              Drag to move · handles to resize · marks the print area
            </Typography>
            {side && (
              <Chip
                label={sideLabel}
                size="small"
                sx={{
                  mt: 0.75, height: 22, fontSize: "0.7rem", fontWeight: 600,
                  backgroundColor: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.3)",
                  "& .MuiChip-label": { px: 1 },
                }}
              />
            )}
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose} sx={{ color: "rgba(255,255,255,0.85)", mt: -0.5, mr: -0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ pb: 1 }}>

        {/* Canvas */}
        <Box sx={{
          position: "relative", width: CANVAS_SIZE, height: CANVAS_SIZE, mx: "auto", mb: 1.5,
          border: "1px solid", borderColor: "divider", borderRadius: 1.5, overflow: "hidden",
          backgroundColor: "#f4f5f7",
          backgroundImage: "repeating-linear-gradient(45deg, #e8e9eb 0, #e8e9eb 1px, transparent 0, transparent 50%)",
          backgroundSize: "12px 12px",
        }}>
          {imageLoading && (
            <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 3, backgroundColor: "rgba(255,255,255,0.8)" }}>
              <CircularProgress size={32} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Loading image…</Typography>
            </Box>
          )}
          {imageSrc && (
            <Box component="img" src={imageSrc}
              sx={{ position: "absolute", top: 0, left: 0, width: CANVAS_SIZE, height: CANVAS_SIZE, objectFit: "contain", zIndex: 0 }}
            />
          )}
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Stage width={CANVAS_SIZE} height={CANVAS_SIZE}>
              <Layer>
                <Rectangle
                  {...initialSettings}
                  isSelected={true}
                  fill="rgba(99, 102, 241, 0.15)"
                  stroke="#6366f1"
                  strokeWidth={2}
                  draggable={true}
                  onDragEnd={updateBox}
                  onTransformEnd={updateBox}
                />
              </Layer>
            </Stage>
          </Box>
        </Box>

        {/* Live readout */}
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {statItems.map(({ label, value }) => (
            <Box key={label} sx={{ display: "flex", alignItems: "baseline", gap: 0.4, backgroundColor: "background.default", border: "1px solid", borderColor: "divider", borderRadius: 1, px: 1, py: 0.4 }}>
              <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>{label}</Typography>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>{value}</Typography>
            </Box>
          ))}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" size="small" sx={{ flex: 1 }}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" size="small" startIcon={<CheckIcon />} sx={{ flex: 1 }}>Confirm Box</Button>
      </DialogActions>
    </Dialog>
  );
};
