import {
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  Typography
} from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation'

const SortableTable = ({ items }) => {
  const router = useRouter()
  //console.log("renderSortableTable", items.length);
  const [sortedData, setSortedData] = useState(items);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    setSortedData(items);
  }, [items]);

  useEffect(() => {
    if (sortBy) {
      sortData();
    }
  }, [sortBy, sortOrder]);

  const handleSort = (column) => {
    //console.log("handleSort", column);
    if (sortBy === column) {
      //console.log("if");
      setSortOrder((prevSortOrder) =>
        prevSortOrder === "asc" ? "desc" : "asc"
      );
    } else {
      //console.log("else");
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const sortData = () => {
    //console.log(sortBy, sortOrder);
    let data = [...sortedData];

    if (typeof data[0][sortBy].value == "string") {
      data.sort((a, b) => {
        if (sortOrder === "asc") {
          return a[sortBy].value.localeCompare(b[sortBy].value);
        } else {
          return b[sortBy].value.localeCompare(a[sortBy].value);
        }
      });
    } else {
      data.sort((a, b) => {
        if (sortOrder === "asc") {
          return a[sortBy].value - b[sortBy].value;
        } else {
          return b[sortBy].value - a[sortBy].value;
        }
      });
    }

    //console.log(data.map((i) => i[sortBy].value));
    setSortedData(data);
  };

  if (sortedData.length == 0) return null;
  return (
    <Table sx={{ minWidth: 650 }} aria-label="simple table">
      <TableHead>
        <TableRow>
          {Object.keys(sortedData[0])
            .filter((k) => k != "onClick" && k != "href")
            .map((i) => (
              <TableCell onClick={() => handleSort(i)} key={i}>
                {i}
              </TableCell>
            ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {sortedData.map((item, i) => (
          <TableRow
            sx={{ "&:last-child td, &:last-child th": { border: 0 }, background: i % 2 ==0? "#d2d2d2": "#e2e2e2", }}
            key={i}
            onClick={() => {
              router.push(item.href);
            }}
          >
            {Object.keys(item)
              .filter((k) => k != "onClick" && k != "href")
              .map((key, i) => (
                <TableCell component="th" scope="row" key={i}>
                  <Typography fontSize="1.0rem" fontWeight={600}>{item[key].value}</Typography>
                </TableCell>
              ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SortableTable;
