"use client"
import { Typography, Container, Button } from "@mui/material";
import axios from "axios";
import Link from "next/link";
import LoaderOverlay from "@/components/LoaderOverlay";
import {useState} from "react";
export function Main({style}){
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
      if (confirm("Delete?")) {
        let result = await axios.delete(`/api/admin/blanks?id=${style._id}`, {id: style._id});
        location.replace("/admin/blanks");
      }
    };

    const generateInventory = async () => {
      setLoading(true);
      let result = await axios.post("/api/admin/blanks/generate-inventory", {
        id: style._id,
      });
      setLoading(false);
    };

    return (
      <Container maxWidth="lg">
        <div style={{ paddingBottom: 50 }}>
          <Typography variant="h4" component="h1" mb={3}>
            {style.code} - {style.name}
          </Typography>
          <div>
            <Typography variant="p">Sales: {style.sales}</Typography>
          </div>
          <div>
            <Typography variant="p">Vendor: {style.vendor}</Typography>
          </div>

          <div>
            <Link href={`/admin/blanks/create?id=${style._id}`}>
              <Button>Edit</Button>
            </Link>
            <Button color="error" onClick={handleDelete}>
              Delete
            </Button>
            <a href={`/admin/blanks/production/${style._id}`}>
              <Button>Change Production Settings</Button>
            </a>

            <Button onClick={generateInventory}>
              Generate Missing Inventory
            </Button>
          </div>
        </div>
        {loading && <LoaderOverlay />}
      </Container>
    );
}