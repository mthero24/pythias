"use client";
import {useState, useEffect, useContext, createContext} from 'react';
import {Fab, Drawer, Box} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { set } from 'mongoose';

const CSVContext = createContext();


export const CSVProvider = ({ children }) => {
    const [csvData, setCsvData] = useState([]);
    const [show, setShow] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    useEffect(() => {
        // Load initial CSV data if needed
        const loadInitialData = async () => {
            let csv = localStorage.getItem("csvData");
            if (csv) {
                setCsvData(JSON.parse(csv));
            }
        };
        loadInitialData();
    }, []);
    return (
        <CSVContext.Provider value={{ csvData, setCsvData, show, setShow }}>
            {children}
            <Fab color="primary" aria-label="add" sx={{ display: show ? 'block' : 'none', position: 'fixed', bottom: 16, right: 16 }} onClick={() => {setShow(false);setDrawerOpen(true)}}>
                <AddIcon />
            </Fab>
            <Drawer
                anchor={"right"}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            >
                <Box
                    sx={{ width: 250 }}
                    role="presentation"
                >
                </Box>
            </Drawer>
        </CSVContext.Provider>
    );
};

export const useCSV = () => {
    const context = useContext(CSVContext);
    if (!context) {
        throw new Error("useCSV must be used within a CSVProvider");
    }
    return context;
};
