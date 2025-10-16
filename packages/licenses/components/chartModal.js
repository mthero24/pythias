import {Modal, Typography, Box, TextField, Grid2, Grid} from "@mui/material"
import { BarChart } from '@mui/x-charts/BarChart';
import {useState, useEffect} from "react"
import axios from "axios"
import CloseIcon from '@mui/icons-material/Close';
export function ChartModal({open, setOpen,}){
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    const [months, setMonths] = useState([])
    const [licenses, setLicenses] = useState([])
    const [loading, setLoading] = useState(true)
    useEffect(()=>{
        let getData = async ()=>{
            let data = await axios.get("/api/admin/license")
            setMonths(data.data.months)
            setLicenses(data.data.licenses)
            setLoading(false)
        }
        if(open){
            getData()
            setLoading(true)
        }
    }, [open])
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "95%",
        height: "95%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        overflow: "auto",
    };
    let dataOwed = []
    let dataSold = []
    for(let l of licenses){
        if(l.name){
            dataOwed.push({label: l.name, data: months.map(m => {
                let ml = m.licenses.filter((lic) => lic._id === l._id);
                return ml.length > 0 ? ml[0].totalOwed : 0;
            }), id: l._id});
            dataSold.push({label: l.name, data: months.map(m => {
                let ml = m.licenses.filter((lic) => lic._id === l._id);
                return ml.length > 0 ? ml[0].sold : 0;
            }), id: l._id});
        }
    }
    const uData = [4000, 3000, 2000, 2780, 1890, 2390, 3490];
    const pData = [2400, 1398, 9800, 3908, 4800, 3800, 4300];
    const xLabels = [
        'Page A',
        'Page B',
        'Page C',
        'Page D',
        'Page E',
        'Page F',
        'Page G',
    ];
    return (
        <Modal
        open={open}
        onClose={()=>setOpen(false)}
        >
            <Box sx={style}>
                <Typography variant="h6">License Chart</Typography>
                <Box sx={{display: "flex", justifyContent: "flex-end", marginTop: "-3%", marginBottom: "1%"}}>
                    <CloseIcon sx={{ cursor: "pointer", color: "#780606" }} onClick={()=>setOpen(false)}/>
                </Box>
                {loading ? (
                    <Box sx={{display: "flex", justifyContent: "center", alignItems: "center", height: "100%"}}>
                        <Typography>Loading...</Typography>
                    </Box>
                ) : (
                    <Grid2 container spacing={2} sx={{ mt: 2 }}>
                        <Grid2 item size={9}>
                            <Typography variant="h5">Total Owed To License Holders</Typography>
                            <Box sx={{ width: '100%', height: 600 }}>
                                <BarChart
                                    series={dataOwed}
                                    xAxis={[{ data: monthNames }]}
                                    yAxis={[{ width: 50 }]}
                                />
                            </Box>
                            <hr />
                            <br />
                            <Typography variant="h5">Total Sold by License Holders</Typography>
                            <Box sx={{ width: '100%', height: 600 }}>
                                <BarChart
                                    series={dataSold}
                                    xAxis={[{ data: monthNames }]}
                                    yAxis={[{ width: 50 }]}
                                />
                            </Box>
                        </Grid2>
                        <Grid2 item size={3}>
                            <Grid2 container spacing={2}>
                                {months.map((month) => (
                                    <Grid2 item size={12} key={month.number}>
                                        <Typography variant="subtitle1">{monthNames[month.number]}</Typography>
                                        <Grid2 container spacing={1}>
                                            <Grid2 item size={4}>
                                                <Typography variant="subtitle2">License Holder</Typography>
                                            </Grid2>
                                            <Grid2 item size={4}>
                                                <Typography variant="subtitle2">Sold</Typography>
                                            </Grid2>
                                            <Grid2 item size={4}>
                                                <Typography variant="subtitle2">Owed</Typography>
                                            </Grid2>
                                        </Grid2>
                                        {licenses.map((license) => {
                                            let ml = month.licenses.filter((l) => l._id === license._id);
                                            return ml.length > 0 ? (
                                                <Grid2 container spacing={1} key={license._id} sx={{background: "#f2f2f2", marginBottom: ".5%", borderBottom: "1px solid #ccc", padding: ".5% 0%"}}>
                                                    <Grid2 item size={4}>
                                                        <Typography variant="body2">{license.name}</Typography>
                                                    </Grid2>
                                                    <Grid2 item size={4}>
                                                        <Typography variant="body2">${ml[0].sold.toFixed(2)}</Typography>
                                                    </Grid2>
                                                    <Grid2 item size={4}>
                                                        <Typography variant="body2">${ml[0].totalOwed.toFixed(2)}</Typography>
                                                    </Grid2>
                                                </Grid2>
                                            ) : null;
                                        })}
                                        <Grid2 container spacing={1} sx={{ background: "#f2f2f2", marginBottom: ".5%", borderBottom: "1px solid #ccc", padding: ".5% 0%" }}>
                                            <Grid2 item size={4}>
                                                <Typography variant="body2">{"Total"}</Typography>
                                            </Grid2>
                                            <Grid2 item size={4}>
                                                <Typography variant="body2">${month.licenses.reduce((acc, l) => acc + l.sold, 0).toFixed(2)}</Typography>
                                            </Grid2>
                                            <Grid2 item size={4}>
                                                <Typography variant="body2">${month.licenses.reduce((acc, l) => acc + l.totalOwed, 0).toFixed(2)}</Typography>
                                            </Grid2>
                                        </Grid2>
                                    </Grid2>
                                ))}
                            </Grid2>
                        </Grid2>
                    </Grid2>
                )}
            </Box>
        </Modal>
    )
}