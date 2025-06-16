"use client";
import {Box, Modal, Typography, Card, TextField, Grid2, Button} from "@mui/material";
import Image from "next/image"
import {Items} from "./OrderModalComponents/items";
import { Address } from "./OrderModalComponents/address";
import { BinInfo } from "./OrderModalComponents/BinInfo";
import { Actions } from "./OrderModalComponents/Action";
import CloseIcon from '@mui/icons-material/Close';
import axios from "axios"
import { createImage } from "../functions/image";
import {useState, useEffect} from "react";
export function OrderModal({order, item, bin, setOrder, setItem,setBin, setAuto, show, setShow, style, setBins, action, setAction, station, source}){
    console.log(createImage("red", "AT", {url: "https://s3.wasabisys.com/teeshirtpalace-node-dev/designs/1734432513522.png&w=256&q=75"}))
    const [shippingPrices, setShippingPrices] = useState()
    const [weight, setWeight] = useState(0)
    const [getWeight, setGetWeight] = useState(false)
    const [timer, setTimer] = useState(0)
    const [dimensions, setDimensions] = useState()
    const [label, setLabel] = useState()
    const [closeTimer, setCloseTimer] = useState(false)
    const [stopClose, setStopClose] = useState(false)
    const close = ()=>{
      setShow(false);
      setAuto(true);
      setOrder();
      setItem();
      setBin();
      setAction()
      setShippingPrices()
      setWeight(0)
      setDimensions()
      setLabel()
    }
    useEffect(()=>{
      let getShippingRates = async ()=>{
        let res = await axios.post("/api/production/shipping/rates", {address: order.shippingAddress, marketplace: order.marketplace, shippingType: order.shippingType, weight, dimensions})
        if(res.data.error) alert(res.data.msg)
        else {
          setShippingPrices(res.data.rates.rates)
          console.log(res.data.rates.rates)
        }
      }
      if(show && order && weight > 0 && dimensions){
        getShippingRates()
      }
    }, [dimensions, weight])
    useEffect(()=>{
      let countDown = async ()=>{
          setCloseTimer(true)
          setStopClose(false)
          for(let i = 5; i >= 0; i--){
              setTimer(i)
              console.log(i, closeTimer, timer,  "close timer")
              await new Promise((resolve)=>{
                setTimeout(()=>{
                  resolve()
                }, 1000)
              })
          }
          checkClose()
      }
      let checkClose = ()=>{
          if(!stopClose){
              setCloseTimer()
              setLabel()
              close()
              setCloseTimer(false)
          }else countDown()
      }
      if(label){
          countDown()
      }
  }, [label])
    useEffect(()=>{
      let startTimer = async ()=>{
        for(let i = 3; i >= 1; i--){
          setTimer(i)
          await new Promise((resolve)=>{
            setTimeout(()=>{
              resolve()
            }, 1000)
          })
        }
        await getWeight()
        setTimer(0)
      }
      let getWeight = async ()=>{
        let res = await axios.get(`/api/production/shipping/scales?station=${station}&id=${order._id}`)
        if(res.data.error) {
          alert(res.data.msg)
          setWeight(0)
        }else {
          console.log(res.data, "+++++++++++ result from weight") //186.25
          setWeight(res.data.value)
        }
        return
      }
      if(action == "ship"){
        startTimer()
      }
    }, [show, getWeight])
    return (
      <Modal
        open={show}
        onClose={() => {
          close()
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", cursor: "pointer", color: "red"}}>
            <CloseIcon sx={{color: "red"}} onClick={()=>{
               close()
            }}/>
          </Box>
          <Grid2 container spacing={2}>
            {bin && (<BinInfo bin={bin} close={close} setBins={setBins}/>)}
          </Grid2>
          {action && <Actions action={action} setAction={setAction} bin={bin} order={order} item={item} style={style} shippingPrices={shippingPrices} setShippingPrices={setShippingPrices} timer={timer} weight={weight} setGetWeight={setGetWeight} getWeight={getWeight} setDimensions={setDimensions} dimensions={dimensions} station={station} close={close} label={label} setLabel={setLabel} closeTimer={closeTimer} setCloseTimer={setCloseTimer} stopClose={stopClose} setStopClose={setStopClose} setBins={setBins} source={source}/>}
          {order && (
            <Card sx={{height: `${style.height * 0.75}px`, overflow: "auto"}}>
              <Box sx={{display: "flex", flexDirection: 'row', justifyContent: "space-evenly"}}>
                <Typography fontWeight="bold" fontSize="1.2rem" sx={{display: {xs: "none", sm: "block"}}}>
                   {new Date(order.date).toLocaleDateString("EN-us")}
                </Typography>
                <Typography fontWeight="bold" fontSize="1.2rem">
                  {order.poNumber} 
                </Typography>
                <Typography fontWeight="bold" fontSize="1.2rem" sx={{display: {xs: "none", sm: "block"}}}>
                   {order.status}
                </Typography>
              </Box>
              <Grid2 container spacing={2}>
                <Address order={order} style={style} />
                <Items order={order} style={style} source={source}/>
              </Grid2>
            </Card>
          )}
        </Box>
      </Modal>
    );
}