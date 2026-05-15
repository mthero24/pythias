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

export function OrderModal({ order, item, bin, setOrder, setShowNotes, setItem, setBin, setAuto, show, setShow, style, setBins, action, setAction, station, source, weight, setWeight, dimensions, setDimensions }) {
    const [shippingPrices, setShippingPrices] = useState();
    const [getWeight, setGetWeight]           = useState(false);
    const [timer, setTimer]                   = useState(0);
    const [label, setLabel]                   = useState();
    const [closeTimer, setCloseTimer]         = useState(false);
    const [stopClose, setStopClose]           = useState(false);

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
    };

    useEffect(() => {
        const getShippingRates = async () => {
            const res = await axios.post("/api/production/shipping/rates", {
                address: order.shippingAddress,
                marketplace: order.marketplace,
                shippingType: order.shippingType,
                weight,
                dimensions,
            });
            if (res.data.error) alert(res.data.msg);
            else setShippingPrices(res.data.rates.rates);
        };
        if (show && order && weight > 0 && dimensions) getShippingRates();
    }, [dimensions, weight]);

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
        if (action === "ship" && weight === 0) startTimer();
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
                        setDimensions={setDimensions} dimensions={dimensions}
                        station={station} close={close}
                        label={label} setLabel={setLabel}
                        closeTimer={closeTimer} setCloseTimer={setCloseTimer}
                        stopClose={stopClose} setStopClose={setStopClose}
                        setBins={setBins} source={source}
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
