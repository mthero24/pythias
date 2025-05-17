"use client";
import {Box, Typography,LinearProgress , Card, Button, Grid2, Link } from "@mui/material"
import {useState, useEffect} from "react"
import axios from "axios"
export function Main({act, past}){
    const [active, setActive] = useState(act? act: false)
    const [files, setFiles] = useState(past)
    console.log(files, "files")
    const start = async ()=>{
        let res = await axios.post("/api/admin/create-csv")
        if(res.data.error) setActive(false)
        else {
            console.log(res.data.past, "past")
            setActive({...res.data.csvupdate})
            setFiles(res.data.past)
        }
    }
    useEffect(()=>{
        const checkFiles = async ()=>{
            let res = await axios.get(`/api/admin/create-csv?id=${active._id}`)
            if(res.data.error) setActive(false)
            else {
                await new Promise((resolve)=>{
                    setTimeout(()=>{
                        resolve()
                    }, 10000)
                })
                console.log(res.data.past, "past useEffect")
                setActive(res.data.csvupdate.error || !res.data.csvupdate.active? false: {...res.data.csvupdate})
                setFiles(res.data.past)
            }
        }
        if(active != false) checkFiles()
    },[active])
    return (
        <Box sx={{padding: "3%", background: "#e2e2e2", minHeight: "94vh"}}>
            <Card sx={{padding: "3%"}}>
                {!active && (
                    <>
                        <Typography textAlign={"center"} fontSize={"2rem"}>Create New CSVs</Typography>
                        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
                            <Box sx={{width: "50%"}}>
                                <Button fullWidth onClick={start}>Start Update</Button>
                            </Box>
                        </Box>
                    </>
                )}
                 {active && (
                    <>
                        <Typography textAlign={"center"} fontSize={"2rem"}>Processing Update</Typography>
                        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
                            <Box sx={{width: "50%"}}>
                                <LinearProgress />
                                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
                                    <Typography>{!active.infoGathered? "Gathering Info": !active.dataParsed? "Parsing Data": "CSV's Ready"}</Typography>
                                </Box>
                                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center"}}>

                                </Box>
                            </Box>
                        </Box>
                    </>
                )}
            </Card>
            <Grid2 container spacing={2} sx={{marginTop: "1%"}}>
                {files.sort((a,b)=>{
                    if(new Date(a.date) < new Date(b.date)) return 1
                    if(new Date(a.date) > new Date(b.date)) return -1
                    return 0
                }).map(f=>(
                    <Grid2 key={f._id} size={6}>
                        <Card sx={{padding: "3%"}}>
                            {f.error && <Typography>Error</Typography>}
                            {f.active && <Typography>Active</Typography>}
                            {new Date(f.date).toLocaleDateString("En-us")}
                            {Object.keys(f.files? f.files: {}).map(fi=>(
                                <Typography key={fi}>{fi}: <Link href={f.files[fi]}>{f.files[fi].split("/")[f.files[fi].split("/").length - 1]}</Link> </Typography>
                            ))}
                        </Card>
                    </Grid2>
                ))}
            </Grid2>
        </Box>
    )
}