"use client";
import { Box, Typography, Dialog, DialogTitle, DialogContent, Divider, Chip, IconButton, Stack, Button } from "@mui/material";
import { Items } from "./OrderModalComponents/items";
import { Address } from "./OrderModalComponents/address";
import { BinInfo } from "./OrderModalComponents/BinInfo";
import { Actions } from "./OrderModalComponents/Action";
import CloseIcon from "@mui/icons-material/Close";
import NotesIcon from "@mui/icons-material/Notes";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import axios from "axios";
import { useState, useEffect } from "react";

export function OrderModal({ order, item, bin, setOrder, setShowNotes, setItem, setBin, setAuto, show, setShow, style, setBins, action, setAction, station, hasScale, source, weight, setWeight, dimensions, setDimensions, onAction }) {
    const [shippingPrices, setShippingPrices] = useState();
    const [getWeight, setGetWeight]           = useState(false);
    const [timer, setTimer]                   = useState(0);
    const [label, setLabel]                   = useState();
    const [closeTimer, setCloseTimer]         = useState(false);
    const [stopClose, setStopClose]           = useState(false);
    const [loadingWeight, setLoadingWeight]   = useState(false);
    const [multiBox, setMultiBox]             = useState(false);
    const [boxes, setBoxes]                   = useState([]);
    const [getManualRates, setGetManualRates] = useState(false);
    const [blankWeight, setBlankWeight]       = useState(0);

    const close = () => {
        setShow(false);
        setAuto(true);
        setOrder();
        setItem();
        setBin();
        setAction();
        setShippingPrices();
        setWeight(0);
        setDimensions();
        setLabel();
        setMultiBox(false);
        setBoxes([]);
        setGetManualRates(false);
        setBlankWeight(0);
    };

    const addBox = () => {
        setBoxes(prev => [...prev, { weight, dimensions }]);
        setWeight(0);
        setDimensions();
        setShippingPrices();
        setGetWeight(prev => !prev);
    };

    useEffect(() => {
        const getShippingRates = async () => {
            const currentBox = weight > 0 && dimensions ? [{ weight, dimensions }] : [];
            const allBoxes = multiBox ? [...boxes, ...currentBox] : null;
            const res = await axios.post("/api/production/shipping/rates", {
                address: order.shippingAddress,
                marketplace: order.marketplace,
                shippingType: order.shippingType,
                weight: allBoxes ? allBoxes.reduce((s, p) => s + p.weight, 0) : weight,
                dimensions: allBoxes ? allBoxes[0]?.dimensions : dimensions,
                orderId: order._id,
                packages: allBoxes,
            });
            if (res.data.error) alert(res.data.msg);
            else setShippingPrices(res.data.rates.rates);
        };
        const singleReady = !multiBox && show && order && weight > 0 && dimensions?.width > 0 && dimensions?.length > 0 && dimensions?.height > 0;
        const multiReady  = multiBox  && show && order && getManualRates && (boxes.length > 0 || (weight > 0 && dimensions));
        if (singleReady || multiReady) {
            getShippingRates();
            if (multiReady) setGetManualRates(false);
        }
    }, [dimensions, weight, getManualRates]);

    useEffect(() => {
        const countDown = async () => {
            setCloseTimer(true);
            setStopClose(false);
            for (let i = 2; i >= 0; i--) {
                setTimer(i);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            checkClose();
        };
        const checkClose = () => {
            if (!stopClose) {
                setCloseTimer();
                setLabel();
                close();
                setCloseTimer(false);
            } else countDown();
        };
        if (label) countDown();
    }, [label]);

    useEffect(() => {
        const startTimer = async () => {
            for (let i = 2; i >= 1; i--) {
                setTimer(i);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            await doGetWeight();
            setTimer(0);
        };
        const doGetWeight = async () => {
            const res = await axios.get(`/api/production/shipping/scales?station=${station}&id=${order._id}`);
            if (res.data.error) {
                alert(res.data.msg);
                setWeight(0);
            } else {
                setWeight(res.data.value);
            }
        };
        const getBlankWeight = async () => {
            setLoadingWeight(true);
            try {
                const res = await axios.get(`/api/production/shipping/scales?noScale=true&id=${order._id}`);
                const total = res.data.error ? 8 : res.data.value;
                setBlankWeight(total);
                // In multi-box mode, suggest the remaining unallocated weight for this box
                const allocated = boxes.reduce((s, b) => s + b.weight, 0);
                setWeight(multiBox ? Math.max(1, total - allocated) : total);
            } catch {
                setBlankWeight(8);
                setWeight(8);
            } finally {
                setLoadingWeight(false);
            }
        };
        if (action === "ship" && weight === 0) {
            if (hasScale === false) getBlankWeight();
            else startTimer();
        }
    }, [show, getWeight]);

    const isOld = order && new Date(order.date) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    return (
        <Dialog open={show} onClose={close} maxWidth="xl" fullWidth scroll="paper">
            <DialogTitle sx={{ py: 1.5, px: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    {order && (
                        <>
                            <Typography variant="h6" sx={{ fontWeight: 800, mr: 0.5 }}>{order.poNumber}</Typography>
                            <Chip label={order.status} size="small" sx={{ fontWeight: 600 }} />
                            <Chip
                                label={new Date(order.date).toLocaleDateString("en-US")}
                                size="small"
                                variant="outlined"
                                color={isOld ? "error" : "default"}
                            />
                            {order.notes?.length > 0 && (
                                <IconButton size="small" color="warning" onClick={() => setShowNotes(true)} title="Order Notes">
                                    <NotesIcon fontSize="small" />
                                </IconButton>
                            )}
                            <Button
                                size="small"
                                variant="outlined"
                                endIcon={<OpenInNewIcon fontSize="small" />}
                                onClick={() => window.open(`/orders/${order._id}`, "_blank")}
                                sx={{ whiteSpace: "nowrap" }}
                            >
                                Open Order
                            </Button>
                        </>
                    )}
                    {bin && (
                        <BinInfo bin={bin} close={close} setBins={setBins} />
                    )}
                    <IconButton size="small" onClick={close} sx={{ ml: "auto !important" }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 2 }}>
                {action && (
                    <Actions
                        action={action} setAction={setAction}
                        bin={bin} order={order} item={item}
                        shippingPrices={shippingPrices} setShippingPrices={setShippingPrices}
                        timer={timer} weight={weight}
                        setGetWeight={setGetWeight} getWeight={getWeight}
                        loadingWeight={loadingWeight}
                        setDimensions={setDimensions} dimensions={dimensions}
                        station={station} close={close}
                        label={label} setLabel={setLabel}
                        closeTimer={closeTimer} setCloseTimer={setCloseTimer}
                        stopClose={stopClose} setStopClose={setStopClose}
                        setBins={setBins} source={source} onAction={onAction}
                        multiBox={multiBox} setMultiBox={setMultiBox}
                        boxes={boxes} setBoxes={setBoxes}
                        addBox={addBox} setGetManualRates={setGetManualRates}
                        blankWeight={blankWeight} setWeight={setWeight}
                    />
                )}
                {order && (
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, mt: action ? 2 : 0 }}>
                        <Address order={order} />
                        <Items order={order} source={source} />
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
