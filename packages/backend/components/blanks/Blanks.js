"use client";
import {Box, Container, Typography, Grid2, Divider, TextField, MenuItem, Button, Modal, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, InputAdornment, Card, CardContent, Chip, Stack, Badge, Tooltip, IconButton} from "@mui/material";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import EditIcon from '@mui/icons-material/Edit';
import BuildIcon from '@mui/icons-material/Build';
import CloseIcon from '@mui/icons-material/Close';
import CreatableSelect from "react-select/creatable";
import {Footer} from "../reusable/Footer";
import {useState, useMemo} from "react";
import { MarketplaceModal } from "../reusable/MarketPlaceModal";
import axios from "axios"

export function BlanksComponent({blanks, mPs, source}){
    const [blank, setBlank] = useState({})
    const [marketPlaces, setMarketPlaces] = useState(mPs)
    const [marketplaceModal, setMarketplaceModal] = useState(false)
    const [aliasOpen, setAliasOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [filters, setFilters] = useState({})

    const departments = useMemo(() => [...new Set(blanks.map(b => b.department).filter(d => d))], [blanks])
    const categories = useMemo(() => [...new Set(blanks.map(b => b.category).flat().filter(c => c))], [blanks])

    const activeFilterCount = (filters.departments?.length || 0) + (filters.categories?.length || 0)

    const visibleBlanks = useMemo(() => {
        let result = blanks
        if (search) {
            const q = search.toLowerCase()
            result = result.filter(s => s.code?.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q))
        }
        if (filters.departments?.length) result = result.filter(b => filters.departments.includes(b.department))
        if (filters.categories?.length) result = result.filter(b => b.category?.some(c => filters.categories.includes(c)))
        return result
    }, [blanks, search, filters])

    const updateFilter = (key, selected) => {
        const next = { ...filters }
        if (selected && selected.length > 0) next[key] = selected.map(s => s.value)
        else delete next[key]
        setFilters(next)
    }

    return (
        <Box sx={{width: "100%", maxWidth: "100%", overflowX: "hidden"}}>
            <Container maxWidth="lg" sx={{minHeight: "90vh"}}>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <CheckroomIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Stack direction="row" alignItems="baseline" spacing={1}>
                                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Blanks</Typography>
                                <Chip
                                    label={visibleBlanks.length !== blanks.length ? `${visibleBlanks.length} of ${blanks.length}` : blanks.length}
                                    size="small" variant="outlined" sx={{ fontWeight: 600 }}
                                />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">Manage garment styles, colors, and sizes</Typography>
                        </Box>
                    </Stack>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button variant="outlined" onClick={() => setAliasOpen(true)}>Alias / Combined</Button>
                        <Button variant="contained" color="primary" startIcon={<AddIcon />} href="/admin/blanks/create">Create Blank</Button>
                    </Box>
                </Box>

                <Box sx={{ marginBottom: 2, padding: 2, borderRadius: 2, background: "#fff", boxShadow: "0px 0px 10px rgba(0,0,0,.1)" }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search blanks..."
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 1 }}>
                        <Badge badgeContent={activeFilterCount} color="primary">
                            <Button size="small" variant={filtersOpen ? "contained" : "outlined"} startIcon={<FilterListIcon />} onClick={() => setFiltersOpen(!filtersOpen)}>
                                Filters
                            </Button>
                        </Badge>
                        {activeFilterCount > 0 && (
                            <Button size="small" color="error" onClick={() => setFilters({})}>
                                Clear All Filters
                            </Button>
                        )}
                    </Box>
                    {filtersOpen && (
                        <Grid2 container spacing={2} sx={{ marginTop: 1.5 }}>
                            <Grid2 size={{ xs: 12, sm: 6 }}>
                                <CreatableSelect
                                    placeholder="Filter By Department ..."
                                    isClearable
                                    isMulti
                                    options={departments.map(d => ({ value: d, label: d }))}
                                    value={(filters.departments || []).map(d => ({ value: d, label: d }))}
                                    onChange={(selected) => updateFilter("departments", selected)}
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 6 }}>
                                <CreatableSelect
                                    placeholder="Filter By Category ..."
                                    isClearable
                                    isMulti
                                    options={categories.map(c => ({ value: c, label: c }))}
                                    value={(filters.categories || []).map(c => ({ value: c, label: c }))}
                                    onChange={(selected) => updateFilter("categories", selected)}
                                />
                            </Grid2>
                        </Grid2>
                    )}
                </Box>

                <Grid2 container spacing={2}>
                    {visibleBlanks.length === 0 && (
                        <Typography sx={{ textAlign: "center", width: "100%", fontWeight: "bold", fontSize: "1.5rem", padding: "5%" }}>No blanks found</Typography>
                    )}
                    {visibleBlanks.map((b) => {
                        const colorIds = new Set(b.colors?.map(c => c._id?.toString()))
                        const frontImage = b.images?.find(img => img.color && colorIds.has(img.color?.toString()))
                            ?? b.images?.[0]
                            ?? null
                        const thumbSrc = frontImage
                            ? `${frontImage.image.replace("images1.pythiastechnologies.com", "images2.pythiastechnologies.com/origin")}?width=400`
                            : "/missingImage.jpg"
                        const MAX_SWATCHES = 12
                        return (
                            <Grid2 key={b._id || b.id} size={{ xs: 6, sm: 4, md: 3 }}>
                                <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 2, transition: "box-shadow 150ms", "&:hover": { boxShadow: 4 } }}>
                                    <Box sx={{ position: "relative", aspectRatio: "1 / 1", backgroundColor: "background.default", overflow: "hidden" }}>
                                        <img src={thumbSrc} alt={b.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                    </Box>

                                    <Divider />

                                    <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, p: "12px !important" }}>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={b.code}>{b.code}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</Typography>
                                        </Box>

                                        {b.colors?.length > 0 && (
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
                                                {b.colors.slice(0, MAX_SWATCHES).map(c => (
                                                    <Tooltip key={c._id} title={c.name} placement="top" arrow>
                                                        <Box sx={{ width: 13, height: 13, borderRadius: "50%", backgroundColor: c.hexcode, border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0 }} />
                                                    </Tooltip>
                                                ))}
                                                {b.colors.length > MAX_SWATCHES && (
                                                    <Typography variant="caption" color="text.secondary">+{b.colors.length - MAX_SWATCHES}</Typography>
                                                )}
                                            </Box>
                                        )}

                                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                            {b.department && <Chip size="small" label={b.department} sx={{ fontSize: "0.65rem", height: 20 }} />}
                                            {b.category?.[0] && <Chip size="small" label={b.category[0]} variant="outlined" sx={{ fontSize: "0.65rem", height: 20 }} />}
                                            {b.sales > 0 && <Chip size="small" label={`${b.sales} sold`} color="success" variant="outlined" sx={{ fontSize: "0.65rem", height: 20 }} />}
                                        </Stack>

                                        <Stack spacing={0.75} sx={{ marginTop: "auto", pt: 1 }}>
                                            <Stack direction="row" spacing={0.75}>
                                                <Button fullWidth size="small" variant="contained" startIcon={<StorefrontIcon />} onClick={() => { setBlank(b); setMarketplaceModal(true) }}>Markets</Button>
                                                <Button fullWidth size="small" variant="outlined" startIcon={<BuildIcon />} href={`/admin/blanks/production/${b._id}`} target="_blank">Production</Button>
                                            </Stack>
                                            <Button fullWidth size="small" variant="outlined" startIcon={<EditIcon />} href={`/admin/blanks/create?id=${b._id}`} target="_blank">Edit</Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid2>
                        )
                    })}
                </Grid2>

                <MarketplaceModal open={marketplaceModal} setOpen={setMarketplaceModal} marketPlaces={marketPlaces} setMarketPlaces={setMarketPlaces} sizes={blanks?.map(b => b.sizes?.map(s => s.name))} blank={blank} setBlank={setBlank} source={source} />
                <AliasModal open={aliasOpen} setOpen={setAliasOpen} blanks={blanks} />
            </Container>
            <Footer />
        </Box>
    );
}

const AliasModal = ({blanks, open, setOpen}) => {
    const [selectedBlanks, setSelectedBlanks] = useState([])
    const [options, setOptions] = useState({})
    const [blankSizesToUse, setBlankSizesToUse] = useState({})
    const [blankColorsToUse, setBlankColorsToUse] = useState({})
    const [sizesToUse, setSizesToUse] = useState("")
    const [colorsToUse, setColorsToUse] = useState("")

    function combineArrays(arrays) {
        return arrays.reduce(
            (acc, curr) => acc.flatMap(a => curr.map(b => [...a, b])),
            [[]]
        );
    }

    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "90%",
        maxHeight: "90%",
        bgcolor: 'background.paper',
        boxShadow: 24,
        borderRadius: 2,
        overflow: "auto",
    };

    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <Box sx={style}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Create Alias / Combined Blank</Typography>
                    <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon /></IconButton>
                </Box>

                <Box sx={{ padding: 2.5 }}>
                    <Card variant="outlined" sx={{ marginBottom: 2 }}>
                        <CardContent>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, marginBottom: 1.5 }}>Select Blanks</Typography>
                            <Stack spacing={1.5}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <Typography variant="body2" sx={{ minWidth: 64, color: "text.secondary" }}>Blank 1</Typography>
                                    <TextField select fullWidth size="small" label="Select Blank" value={selectedBlanks[0] ? selectedBlanks[0]._id.toString() : ""} onChange={(e) => {
                                        let selected = [...selectedBlanks]
                                        let blank = blanks.find(b => b._id.toString() === e.target.value)
                                        setSizesToUse(blank._id.toString())
                                        setBlankSizesToUse(prev => ({ ...prev, [blank._id.toString()]: blank.sizes }))
                                        setBlankColorsToUse(prev => ({ ...prev, [blank._id.toString()]: blank.colors }))
                                        selected[0] = blank
                                        setSelectedBlanks(selected)
                                    }}>
                                        <MenuItem value="">Select</MenuItem>
                                        {blanks.map(b => <MenuItem key={b._id} value={b._id}>{b.code}</MenuItem>)}
                                    </TextField>
                                    <Tooltip title="Add another blank" placement="top">
                                        <IconButton size="small" color="primary" onClick={() => setSelectedBlanks(prev => [...prev, null])}>
                                            <AddCircleIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>

                                {selectedBlanks.map((b, i) => {
                                    if (i === 0) return null
                                    return (
                                        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <Typography variant="body2" sx={{ minWidth: 64, color: "text.secondary" }}>Blank {i + 1}</Typography>
                                            <TextField select fullWidth size="small" label="Select Blank" value={b ? b._id.toString() : ""} onChange={(e) => {
                                                let selected = [...selectedBlanks]
                                                let blank = blanks.find(b => b._id.toString() === e.target.value)
                                                setBlankSizesToUse(prev => ({ ...prev, [blank._id.toString()]: blank.sizes }))
                                                selected[i] = blank
                                                setSelectedBlanks(selected)
                                            }}>
                                                <MenuItem value="">Select</MenuItem>
                                                {blanks.map(b => <MenuItem key={b._id} value={b._id}>{b.code}</MenuItem>)}
                                            </TextField>
                                            <Tooltip title="Add another blank" placement="top">
                                                <IconButton size="small" color="primary" onClick={() => setSelectedBlanks(prev => [...prev, null])}>
                                                    <AddCircleIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Remove" placement="top">
                                                <IconButton size="small" color="error" onClick={() => {
                                                    const newSelected = selectedBlanks.filter((_, j) => j !== i)
                                                    setSelectedBlanks(newSelected)
                                                    const newSizeSelect = {}
                                                    for (const nb of newSelected) {
                                                        if (nb) newSizeSelect[nb._id.toString()] = nb.sizes
                                                    }
                                                    setBlankSizesToUse(newSizeSelect)
                                                    let ops = { ...options }
                                                    if (newSelected[0]) ops.sizes = newSizeSelect[newSelected[0]._id]
                                                    if (sizesToUse === "combined") {
                                                        const sizes = []
                                                        const si = combineArrays(Object.values(newSizeSelect))
                                                        let idx = 0
                                                        for (const s of si) {
                                                            sizes.push({ name: s.map(si => si.name).join("/"), weight: s.reduce((a, c) => a + c.weight, 0), retailPrice: s.reduce((a, c) => a + c.retailPrice, 0), basePrice: s.reduce((a, c) => a + c.basePrice, 0), cost: s.reduce((a, c) => a + c.cost, 0), sku: idx++, wholeSaleCost: s.reduce((a, c) => a + c.wholeSaleCost, 0), blankSizes: s })
                                                        }
                                                        ops.sizes = sizes
                                                    } else {
                                                        for (const s of (ops.sizes || [])) s.blankSizes = [s]
                                                    }
                                                    setOptions(ops)
                                                }}>
                                                    <RemoveCircleOutlineIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    )
                                })}
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ marginBottom: 2 }}>
                        <CardContent>
                            <Grid2 container spacing={2} alignItems="center">
                                <Grid2 size={{ xs: 12, sm: 6 }}>
                                    <TextField size="small" label="Alias Code" fullWidth value={options.code ?? selectedBlanks.map(b => b?.code).join("-")} onChange={(e) => setOptions(prev => ({ ...prev, code: e.target.value }))} />
                                </Grid2>
                                <Grid2 size={{ xs: 12, sm: 6 }}>
                                    <FormControl>
                                        <FormLabel sx={{ fontSize: "0.8rem" }}>Use Data Details From</FormLabel>
                                        <RadioGroup row onChange={(e) => setOptions(prev => ({ ...prev, details: e.target.value }))}>
                                            {selectedBlanks.map((b, i) => {
                                                if (!b) return null
                                                if (!options.details) options.details = b._id.toString()
                                                return <FormControlLabel key={b._id} value={b._id} control={<Radio size="small" />} label={b.code} checked={options.details === b._id.toString()} />
                                            })}
                                        </RadioGroup>
                                    </FormControl>
                                </Grid2>
                            </Grid2>
                        </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ marginBottom: 2 }}>
                        <CardContent>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, marginBottom: 1.5 }}>Size Info</Typography>
                            <Grid2 container spacing={2}>
                                {selectedBlanks.filter(b => b).map((b, i) => (
                                    <Grid2 key={b._id} size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, display: "block", marginBottom: 0.75 }}>{b.code}</Typography>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                            {b.sizes.map(s => {
                                                const active = !!blankSizesToUse[b._id.toString()]?.find(si => si._id.toString() === s._id.toString())
                                                return (
                                                    <Chip key={s._id} label={s.name} size="small" clickable color={active ? "primary" : "default"} variant={active ? "filled" : "outlined"} onClick={() => {
                                                        const sizes = { ...blankSizesToUse }
                                                        const found = sizes[b._id.toString()]?.find(si => si._id.toString() === s._id.toString())
                                                        if (!found) sizes[b._id.toString()] = [...(sizes[b._id.toString()] || []), s]
                                                        else sizes[b._id.toString()] = sizes[b._id.toString()].filter(si => si._id.toString() !== s._id.toString())
                                                        setBlankSizesToUse(sizes)
                                                    }} />
                                                )
                                            })}
                                        </Box>
                                    </Grid2>
                                ))}
                            </Grid2>

                            {selectedBlanks.filter(b => b).length > 0 && (
                                <Box sx={{ marginTop: 2 }}>
                                    <FormControl>
                                        <FormLabel sx={{ fontSize: "0.8rem" }}>Use Sizes From</FormLabel>
                                        <RadioGroup row onChange={(e) => {
                                            setSizesToUse(e.target.value)
                                            let ops = { ...options }
                                            ops.sizes = blankSizesToUse[e.target.value]
                                            if (e.target.value === "combined") {
                                                const sizes = []
                                                const si = combineArrays(Object.values(blankSizesToUse))
                                                let idx = 0
                                                for (const s of si) {
                                                    sizes.push({ name: s.map(si => si.name).join("/"), weight: s.reduce((a, c) => a + c.weight, 0), retailPrice: s.reduce((a, c) => a + c.retailPrice, 0), basePrice: s.reduce((a, c) => a + c.basePrice, 0), cost: s.reduce((a, c) => a + c.cost, 0), sku: idx++, wholeSaleCost: s.reduce((a, c) => a + c.wholeSaleCost, 0), blankSizes: s })
                                                }
                                                ops.sizes = sizes
                                            } else {
                                                for (const s of (ops.sizes || [])) s.blankSizes = [s]
                                            }
                                            setOptions(ops)
                                        }}>
                                            {selectedBlanks.map(b => {
                                                if (!b) return null
                                                if (b._id.toString() === sizesToUse) options.sizes = blankSizesToUse[b._id.toString()]
                                                return <FormControlLabel key={b._id} value={b._id} control={<Radio size="small" />} label={b.code} checked={sizesToUse === b._id.toString()} />
                                            })}
                                            <FormControlLabel value="combined" control={<Radio size="small" />} label="Combine" checked={sizesToUse === "combined"} />
                                        </RadioGroup>
                                    </FormControl>

                                    {options.sizes?.length > 0 && (
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, marginTop: 1 }}>
                                            {options.sizes.map((s, i) => <Chip key={i} label={s.name} size="small" color="primary" />)}
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ marginBottom: 2.5 }}>
                        <CardContent>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, marginBottom: 1.5 }}>Color Info</Typography>
                            <Grid2 container spacing={2}>
                                {selectedBlanks.filter(b => b).map((b) => {
                                    if (!blankColorsToUse[b._id.toString()]) blankColorsToUse[b._id.toString()] = b.colors
                                    return (
                                        <Grid2 key={b._id} size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, display: "block", marginBottom: 0.75 }}>{b.code}</Typography>
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                                {b.colors.map(c => {
                                                    const active = !!(blankColorsToUse[b._id.toString()]?.find(cl => cl._id.toString() === c._id.toString()))
                                                    return (
                                                        <Tooltip key={c._id} title={c.name} placement="top" arrow>
                                                            <Box onClick={() => {
                                                                const colors = { ...blankColorsToUse }
                                                                if (colors[b._id.toString()]?.find(cl => cl._id.toString() === c._id.toString())) {
                                                                    colors[b._id.toString()] = colors[b._id.toString()].filter(cl => cl._id.toString() !== c._id.toString())
                                                                } else {
                                                                    colors[b._id.toString()] = [...(colors[b._id.toString()] || []), c]
                                                                }
                                                                setBlankColorsToUse({ ...colors })
                                                            }} sx={{ position: "relative", width: 28, height: 28, borderRadius: "50%", backgroundColor: c.hexcode, border: active ? "2px solid" : "1px solid", borderColor: active ? "primary.main" : "rgba(0,0,0,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 100ms", "&:hover": { transform: "scale(1.1)" } }}>
                                                                {active && <CheckCircleIcon sx={{ fontSize: 14, color: c.color_type === "dark" ? "#fff" : "#000" }} />}
                                                            </Box>
                                                        </Tooltip>
                                                    )
                                                })}
                                            </Box>
                                        </Grid2>
                                    )
                                })}
                            </Grid2>

                            {selectedBlanks.filter(b => b).length > 0 && (
                                <Box sx={{ marginTop: 2 }}>
                                    <FormControl>
                                        <FormLabel sx={{ fontSize: "0.8rem" }}>Use Colors From</FormLabel>
                                        <RadioGroup row onChange={(e) => {
                                            setColorsToUse(e.target.value)
                                            let ops = { ...options }
                                            ops.colors = blankColorsToUse[e.target.value]
                                            if (e.target.value === "combined") {
                                                const colors = []
                                                const si = combineArrays(Object.values(blankColorsToUse))
                                                let idx = 0
                                                for (const s of si) {
                                                    colors.push({ name: s.map(si => si.name).join("/"), hexcode: s[0].hexcode, sku: idx++, combinedColors: s.map(si => si._id.toString()) })
                                                }
                                                ops.colors = colors
                                            }
                                            setOptions(ops)
                                        }}>
                                            {selectedBlanks.map(b => {
                                                if (!b) return null
                                                if (b._id.toString() === colorsToUse) options.colors = blankColorsToUse[b._id.toString()]
                                                return <FormControlLabel key={b._id} value={b._id} control={<Radio size="small" />} label={b.code} checked={colorsToUse === b._id.toString()} />
                                            })}
                                            <FormControlLabel value="combined" control={<Radio size="small" />} label="Combine" checked={colorsToUse === "combined"} />
                                        </RadioGroup>
                                    </FormControl>

                                    {options.colors?.length > 0 && (
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, marginTop: 1 }}>
                                            {options.colors.map((c, i) => (
                                                <Tooltip key={i} title={c.name} placement="top" arrow>
                                                    <Box sx={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: c.hexcode, border: "1px solid rgba(0,0,0,0.2)" }} />
                                                </Tooltip>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    <Stack direction="row" spacing={1}>
                        <Button fullWidth variant="contained" onClick={async () => {
                            if (!options.code) options.code = selectedBlanks.map(b => b?.code).join("-")
                            let res = await axios.post("/api/admin/blanks/alias", {options, selectedBlanks, sizesToUse, colorsToUse})
                            if (res?.data && !res.data.error) {
                                location.href = `/admin/blanks/create?id=${res.data.blank._id}`
                            }
                        }}>Create Alias</Button>
                        <Button fullWidth variant="outlined" onClick={() => setOpen(false)}>Cancel</Button>
                    </Stack>
                </Box>
            </Box>
        </Modal>
    )
}
