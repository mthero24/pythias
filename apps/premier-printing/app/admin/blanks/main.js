"use client";
import {
  Typography,
  Container,
  Box,
  Button,
} from "@mui/material";
import React, { useState } from "react";
import Link from "next/link";
import CustomSearchBar from "@/components/CustomSearchBar";
import DashCard from "@/components/DashCard";
import SortableTable from "@/components/SortableTable";
import Theme from "@/components/Theme";
export function Main({ blanks }) {
    const [visibleBlanks, setVisibleBlanks] = useState(blanks);
    let tableItems = visibleBlanks.map((s) => ({
        code: { value: s.code },
        name: { value: s.name },
        vendor: { value: s.vendor },
        department: { value: s.department },
        sales: { value: s.sales ? s.sales : 0 },
        href: `/admin/blanks/${s._id}`,
    }));
    const handleSearch = ({ value }) => {
        //console.log(value);
        let filtered = blanks.filter(
          (s) =>
            s.code.toLowerCase().includes(value.toLowerCase()) ||
            s.name.toLowerCase().includes(value.toLowerCase())
        );
        setVisibleBlanks([...filtered]);
    };
    return (
      <Container maxWidth="lg">
        <div style={{ paddingBottom: 50 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h4" component="h1" fontWeight={700} mb={3}>
              Blanks
            </Typography>
            <Button href={"/admin/blanks/create"} sx={{background: Theme.colors.primary, color: "#ffffff", width: "100px", height: "30px", marginTop: ".8%", "&:hover": {background: Theme.colors.support}}}>Create</Button>
          </Box>
          <CustomSearchBar onSubmit={handleSearch} />
          <DashCard>
            <SortableTable items={tableItems} />
          </DashCard>
        </div>
      </Container>
    );
};
