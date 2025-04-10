"use client";
import {
    Typography,
    Container,
    Grid,
    Table,
    TableRow,
    TableCell,
    TableHead,
    TableBody,
    Box,
    Divider,
    Button,
    Pagination,
    TextField,
    IconButton,
    ToggleButtonGroup,
    ToggleButton,
    Modal,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
  } from "@mui/material";
import axios from "axios";
import React from "react";
import { useEffect, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import ModalCloseButton from "@/components/ModalCloseButton";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

const companies = [
  "Sanmar",
  "SS Activewear",
  "One Stop",
  "alphabroder",
  "Otto Cap",
  "Lane Seven Apparel"
];
export const dynamic = 'force-dynamic'; 
const Index = (props) => {
    const [sort, setSort] = useState({});
    const [view, setView] = useState("edit");
    const [activeItem, setActiveItem] = useState(null);
    const [pendingOrders, setPendingOrders] = useState(false);
    const [inventoryOrderModalOpen, setInventoryOrderModalOpen] = useState(false);
  
    const [orderModalVisible, setOrderModalVisible] = useState(false);
  
    const [style, setStyle] = useState();
    const [color, setColor] = useState();
    const [size, setSize] = useState();
  
    const [totalVal, setTotalVal] = useState(0);
  
    const [inventory, setInventory] = useState([]);
  
    const [inOrder, setInOrder] = useState([]);
  
    const getInventoryValue = async () => {
      let results = await axios.get("/api/admin/inventory/get-cash-value", {});
      setTotalVal(results.data.total);
    };
  
    useEffect(() => {
      updatePendingOrders();
      getInventoryValue();
    }, []);
  
    useEffect(() => {
      console.log("pending", pendingOrders);
      getInventory();
    }, [pendingOrders]);
  
    const updatePendingOrders = () => {
      axios.post("/api/admin/inventory/update-pending-orders");
    };
  
    const placeInventoryOrder = async (item) => {
      let result = await axios.post("/api/admin/inventory/orders", {
        inOrder,
        po: item,
      });
      console.log(result);
      location.reload();
    };
  
    const addToOrder = (item) => {
      console.log(item);
      setInOrder((prev) => {
        let arr = [...prev];
        arr = arr.filter((i) => i.inventory_id != item.inventory_id);
        arr.push(item);
        return arr;
      });
    };
  
    const removeFromOrder = (item) => {
      setInOrder((prev) => {
        let arr = [...prev];
        arr = arr.filter((i) => i.inventory_id != item.inventory_id);
        return arr;
      });
    };
  
    const getInventory = async (page = 0) => {
      console.log("getInve");
      let results = await axios.get("/api/admin/inventory", {
        params: { page, style, color, size, sort, pendingOrders },
      });
      setInventory(results.data);
    };
  
    const handlePaginationChange = (e, page) => {
      console.log(page);
      getInventory(page);
    };
  
    const handleSearch = () => {
      getInventory();
    };
  
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        handleSearch();
      }
    };
  
    const handleStyleChange = (e, val) => {
      setStyle(e.target.value);
    };
    const handleSizeChange = (e, val) => {
      setSize(e.target.value);
    };
    const handleColorChange = (e, val) => {
      setColor(e.target.value);
    };
  
    const handleSort = (column) => {
        
      let newSort = { ...sort };
      if (newSort[column]) {
        newSort[column] = newSort[column] == 1 ? -1 : 1;
      } else {
        newSort[column] = -1;
      }
      setSort(newSort);
    };
  
    const toggleView = () => {
      setView((prev) => {
        if (prev == "edit") {
          return "ordering";
        }
        return "edit";
      });
    };
  
    const removeSort = (key) => {
      let newSort = { ...sort };
      delete newSort[key];
      setSort(newSort);
    };
  
    useEffect(() => {
      if (sort) {
        console.log(sort);
        getInventory();
      }
    }, [sort]);
  
    return (
      <Container maxWidth="lg" sx={{background: "#fff"}}>
        <div style={{ paddingBottom: 50 }}>
          <Typography variant="h4" component="h1" mb={3} color="#000">
            Inventory
          </Typography>
  
          <Box>
            <TextField
              size="small"
              onChange={handleStyleChange}
              variant="outlined"
              placeholder="Style Code"
              onKeyDown={handleKeyDown}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={handleSearch}>
                    <SearchIcon />
                  </IconButton>
                ),
              }}
            />{" "}
            <TextField
              size="small"
              onChange={handleColorChange}
              variant="outlined"
              placeholder="Color"
              onKeyDown={handleKeyDown}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={handleSearch}>
                    <SearchIcon />
                  </IconButton>
                ),
              }}
            />
            <TextField
              size="small"
              onChange={handleSizeChange}
              variant="outlined"
              placeholder="Size"
              onKeyDown={handleKeyDown}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={handleSearch}>
                    <SearchIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>
          <Box sx={{ display: "flex", my: 2, justifyContent: "space-between" }}>
            <Box>
              <Button onClick={toggleView}>Toggle View ({view})</Button>
              <Button onClick={() => setInventoryOrderModalOpen(true)}>
                View Inventory Orders
              </Button>
            </Box>
            {view == "ordering" ? (
              <Box>
                <Button onClick={() => setPendingOrders((prev) => !prev)}>
                  Toggle Items With Pending Orders
                </Button>
                <Button onClick={() => setOrderModalVisible(true)}>
                  Place Order
                </Button>
              </Box>
            ) : null}
          </Box>
  
          <Box sx={{ my: 3 }}>
            <Typography color="#000">Total Value: ${totalVal.toLocaleString()}</Typography>
          </Box>
  
          <Typography color="#000">Sort Order</Typography>
          <Box sx={{ backgroundColor: "#f1f1f1", p: 2, display: "flex" }}>
            {Object.keys(sort).map((key) => (
              <Box
                key={key}
                sx={{
                  display: "flex",
                  mr: 2,
                  cursor: "pointer",
                  backgroundColor: "white",
                  p: 1,
                  borderRadius: 1,
                }}
                onClick={() => removeSort(key)}
              >
                <Typography sx={{ mr: 2 }}>
                  {key}: {sort[key]}
                </Typography>
                <HighlightOffIcon color="red" />
              </Box>
            ))}
          </Box>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow sx={{ cursor: "pointer" }}>
                <TableCell onClick={() => handleSort("style_code")}>
                  Code
                </TableCell>
                <TableCell onClick={() => handleSort("color_name")}>
                  Color
                </TableCell>
                <TableCell onClick={() => handleSort("size_name")}>
                  Size
                </TableCell>
                <TableCell onClick={() => handleSort("quantity")}>
                  In Stock
                </TableCell>
                <TableCell onClick={() => handleSort("pending_quantity")}>
                  Ordered
                </TableCell>
                <TableCell onClick={() => handleSort("pending_orders")}>
                  Active Orders
                </TableCell>
  
                {view == "ordering" ? (
                  <>
                    <TableCell>Order Qty</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>State</TableCell>
                  </>
                ) : null}
  
                {view == "edit" ? (
                  <>
                    <TableCell></TableCell>
                  </>
                ) : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {inventory.sort((a,b)=>{
                if(a.style_code < b.style_code) return -1
                else if(a.style_code > b.style_code) return 1
                else if(a.color_name > b.color_name) return 1
                else if(a.color_name < b.color_name) return -1
                else if(a.size_name.replace("2", "") > b.size_name.replace("2", "")) return 1
                else if(a.size_name.replace("2", "") < b.size_name.replace("2", "")) return -1
                else return 0
              }).map((item, idx) => {
                let inOrderItem = inOrder.filter(
                  (i) => i.inventory_id == item.inventory_id
                )[0];
                return (
                  <TableRow key={item.inventory_id}>
                    <TableCell>{item.style_code}</TableCell>
                    <TableCell>{item.color_name}</TableCell>
                    <TableCell>{item.size_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.pending_quantity}</TableCell>
                    <TableCell>{item.pending_orders}</TableCell>
                    {view == "ordering" ? (
                      <>
                        <TableCell
                          onClick={() =>
                            setActiveItem({
                              inventory_id: item.inventory_id,
                              ...inOrderItem,
                            })
                          }
                        >
                          <Typography color="blue">
                            {inOrderItem ? inOrderItem.quantity : "-"}
                          </Typography>
                        </TableCell>
                        <TableCell
                          onClick={() =>
                            setActiveItem({
                              inventory_id: item.inventory_id,
                              ...inOrderItem,
                            })
                          }
                        >
                          <Typography color="blue">
                            {inOrderItem ? inOrderItem.vendor : "-"}
                          </Typography>
                        </TableCell>
                        <TableCell
                          onClick={() =>
                            setActiveItem({
                              inventory_id: item.inventory_id,
                              ...inOrderItem,
                            })
                          }
                        >
                          <Typography color="blue">
                            {inOrderItem ? inOrderItem.state : "-"}
                          </Typography>
                        </TableCell>
                      </>
                    ) : null}
                    {view == "edit" ? (
                      <>
                        <TableCell>
                          <Typography
                            onClick={() => setActiveItem(item)}
                            color="blue"
                            sx={{cursor: "pointer"}}
                          >
                            Edit
                          </Typography>
                        </TableCell>
                      </>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination count={10} onChange={handlePaginationChange} />
        </div>
        <InventoryOrderModal
          modalVisible={inventoryOrderModalOpen}
          setModalVisible={setInventoryOrderModalOpen}
        />
        <EditModal
          getInventory={getInventory}
          key={activeItem && activeItem.inventory_id + "-edit"}
          activeItem={activeItem}
          modalVisible={activeItem && view == "edit"}
          setModalVisible={() => setActiveItem(null)}
        />
        <OrderModal
          placeInventoryOrder={placeInventoryOrder}
          modalVisible={orderModalVisible}
          setModalVisible={setOrderModalVisible}
        />
        <AddToOrderModal
          removeFromOrder={removeFromOrder}
          key={activeItem && activeItem.inventory_id}
          setModalVisible={() => setActiveItem(null)}
          activeItem={activeItem}
          addToOrder={addToOrder}
          modalVisible={activeItem && view == "ordering"}
        />
      </Container>
    );
  };
  
  const InventoryOrderModal = ({
    modalVisible,
    setModalVisible,
    placeInventoryOrder,
  }) => {
    const [orders, setOrders] = useState([]);
    const [activeOrder, setActiveOrder] = useState();
  
    const getOrders = async () => {
      let results = await axios.get("/api/admin/inventory/orders");
      setOrders(results.data);
    };
  
    const receiveOrder = async (name, vendor) => {
      console.log("receiveOrder", name);
      let results = await axios.post("/api/admin/inventory/receive-order", {
        name,
        vendor,
      });
      let labels = results.data;
      let print = await axios.post("/api/production/printLabels", {
        labels,
        printPO: name,
        batchID: name,
      });
      location.reload();
    };
  
    useEffect(() => {
      if (modalVisible) {
        getOrders();
      }
    }, [modalVisible]);
    console.log(activeOrder);
    return (
      <Modal
        open={modalVisible}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "scroll",
        }}
        onClose={() => setModalVisible(false)}
      >
        <Box
          sx={{
            bgcolor: "white",
            padding: 3,
            width: { xs: "100%", md: "50%" },
            height: "auto",
            maxHeight: "100%",
            minHeight: "80%",
            borderRadius: 1,
            my: 6,
            overflowY: "auto",
            position: "relative",
          }}
        >
          <ModalCloseButton onClick={() => setModalVisible(false)} />
  
          {activeOrder ? (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Typography onClick={() => setActiveOrder(null)} color="blue">
                  X - Close Order
                </Typography>
              </Box>
  
              <Typography variant="h6">
                {activeOrder.name} - {activeOrder.vendor}
              </Typography>
              {activeOrder.received ? (
                <>
                  <Typography>Order Already Receieved</Typography>
                  {/* <Button
                    onClick={() =>
                      receiveOrder(activeOrder.name, activeOrder.vendor)
                    }
                  >
                    Mark Order Receieved
                  </Button> */}
                </>
              ) : (
                <Button
                  onClick={() =>
                    receiveOrder(activeOrder.name, activeOrder.vendor)
                  }
                >
                  Mark Order Receieved
                </Button>
              )}
              <Box
                sx={{
                  py: 2,
                  px: 2,
                  borderBottom: 1,
                  borderColor: "#e1e1e1",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Typography>Item</Typography>
                <Typography>Quantity</Typography>
              </Box>
              {activeOrder.items.map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    py: 2,
                    px: 2,
                    borderBottom: 1,
                    borderColor: "#e1e1e1",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography>{item.inventory.inventory_id}</Typography>
                  <Typography>{item.quantity}</Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <>
              <Typography variant="h6">Active Inventory Orders</Typography>
              {orders.map((o, i) => {
                return (
                  <Box
                    key={o.name}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: "2px",
                      borderBottom: 1,
                      borderColor: "#e1e1e1",
                    }}
                  >
                    <Box
                      sx={{
                        flex: 0,
                        mr: "8px",
                        display: "flex",
                        flexDir: "row",
                        alignItems: "center",
                      }}
                    >
                      {o.received ? (
                        <Box
                          sx={{
                            width: "16px",
                            height: "16px",
                            bgcolor: "green",
                            borderRadius: "50%",
                          }}
                        ></Box>
                      ) : (
                        <Box
                          sx={{
                            width: "16px",
                            height: "16px",
                            bgcolor: "red",
                            borderRadius: "50%",
                          }}
                        ></Box>
                      )}
                    </Box>
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDir: "row",
                        alignItems: "center",
                      }}
                    >
                      <Typography fontWeight="700">
                        {o.name} - {o.vendor}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <p style={{ textAlign: "center" }}>{o.items.length}</p>
                    </Box>
                    <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
                      <Button onClick={() => setActiveOrder(o)}>View</Button>
                    </Box>
                  </Box>
                );
              })}
            </>
          )}
        </Box>
      </Modal>
    );
  };
  
  const OrderModal = ({ modalVisible, setModalVisible, placeInventoryOrder }) => {
    const [poNumbers, setPoNumbers] = useState(
      companies.reduce((acc, company) => ({ ...acc, [company]: "" }), {})
    );
  
    const handleChange = (key, value) => {
      setPoNumbers((prev) => ({ ...prev, [key]: value }));
    };
  
    const handleClick = () => {
      if (placeInventoryOrder) {
        placeInventoryOrder(poNumbers);
      }
      setModalVisible(false);
    };
  
    return (
      <Modal
        open={modalVisible}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
        onClose={() => setModalVisible(false)}
      >
        <Box
          sx={{
            bgcolor: "white",
            padding: 3,
            width: { xs: "100%", md: "25%" },
            height: "auto",
            borderRadius: 1,
            my: 6,
            overflowY: "auto",
            position: "relative",
          }}
        >
          <Typography>Place Inventory Order</Typography>
  
          {companies.map((company) => (
            <Box key={company} sx={{ my: 2 }}>
              <Typography>{company} #</Typography>
              <TextField
                onChange={(e) => handleChange(company, e.target.value)}
                size="small"
                variant="outlined"
                placeholder="PO Number"
                value={poNumbers[company]}
              />
            </Box>
          ))}
  
          <Button onClick={handleClick}>Place Order</Button>
        </Box>
      </Modal>
    );
  };
  
  const EditModal = ({
    modalVisible,
    setModalVisible,
    activeItem,
    getInventory,
  }) => {
    const [quantity, setQuantity] = useState(activeItem && activeItem.quantity);
    const [cost, setCost] = useState(activeItem && activeItem.unit_cost);
    const [aisle, setAisle] = useState(activeItem && activeItem.row);
    const [unit, setUnit] = useState(activeItem && activeItem.unit);
    const [shelf, setShelf] = useState(activeItem && activeItem.shelf);
    const [bin, setBin] = useState(activeItem && activeItem.bin);
  
    const handleClick = async () => {
      let result = await axios.post("/api/admin/inventory", {
        quantity,
        cost,
        aisle,
        shelf,
        unit,
        bin,
        inventory_id: activeItem.inventory_id,
      });
      setModalVisible(false);
      getInventory();
    };
  
    const handleDelete = async () => {
      if (confirm("Are you sure you want to delete this inventory item?")) {
        let result = await axios.put("/api/admin/inventory",  {
            inventory_id: activeItem.inventory_id,
          },
        );
        setModalVisible(false);
        getInventory();
      }
    };
  
    return (
      <Modal
        open={modalVisible}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
        onClose={() => setModalVisible(false)}
      >
        <Box
          sx={{
            bgcolor: "white",
            padding: 3,
            width: { xs: "100%", md: "25%" },
            height: "auto",
            borderRadius: 1,
            my: 6,
            overflowY: "auto",
            position: "relative",
          }}
        >
            <ModalCloseButton onClick={() => setModalVisible(false)} />
  
            <Typography>Edit Modal</Typography>
            <Typography>{activeItem && activeItem.inventory_id}</Typography>
            <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                <Box>
                    <Box sx={{ my: 2 }}>
                        <TextField
                        size="small"
                        type="number"
                        variant="outlined"
                        label="quantity"
                        placeholder="Quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        />
                    </Box>
            
                    <Box sx={{ my: 2 }}>
                        <TextField
                        size="small"
                        type="number"
                        variant="outlined"
                        label="price"
                        placeholder="Quantity"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        />
                    </Box>
                </Box>
                <Box>
                    <Box sx={{my: 2}}>
                        <TextField 
                            size="small"
                            variant="outlined"
                            label="Aisle"
                            value={aisle}
                            onChange={(e)=>{setAisle(e.target.value)}}                            
                        />
                    </Box>
                    <Box sx={{my: 2}}>
                        <TextField 
                            size="small"
                            variant="outlined"
                            label="Unit"
                            value={unit}
                            onChange={(e)=>{setUnit(e.target.value)}}                            
                        />
                    </Box>
                </Box>
                <Box>
                    <Box sx={{my: 2}}>
                        <TextField 
                            size="small"
                            variant="outlined"
                            label="Shelf"
                            value={shelf}
                            onChange={(e)=>{setShelf(e.target.value)}}                            
                        />
                    </Box>
                    <Box sx={{my: 2}}>
                        <TextField 
                            size="small"
                            variant="outlined"
                            label="Bin"
                            value={bin}
                            onChange={(e)=>{setBin(e.target.value)}}                            
                        />
                    </Box>
                </Box>
            </Box>
            <Button onClick={handleClick}>Save</Button>
            <Button color="error" onClick={handleDelete}>
                Delete
            </Button>
        </Box>
      </Modal>
    );
  };
  
  const AddToOrderModal = ({
    modalVisible,
    view = 0,
    addToOrder,
    removeFromOrder,
    activeItem,
    setModalVisible,
  }) => {
    const [vendor, setVendor] = useState(
      activeItem && activeItem.vendor ? activeItem.vendor : -1
    );
    const [quantity, setQuantity] = useState(activeItem && activeItem.quantity);
    const [state, setState] = useState(activeItem && activeItem.state);
  
    const handleClick = () => {
      console.log(vendor, quantity, state);
      if (addToOrder) {
        addToOrder({
          quantity,
          state,
          vendor,
          inventory_id: activeItem.inventory_id,
        });
      }
      setModalVisible(false);
    };
  
    useEffect(() => {
      if (activeItem) {
        if (quantity > 0 && vendor != -1) {
          addToOrder({
            quantity,
            state,
            vendor,
            inventory_id: activeItem.inventory_id,
          });
        } else {
          removeFromOrder({
            quantity,
            state,
            vendor,
            inventory_id: activeItem.inventory_id,
          });
        }
      }
    }, [vendor, quantity, state]);
  
    const handleRemoveClick = () => {
      console.log(vendor, quantity, state);
      if (removeFromOrder) {
        removeFromOrder({
          quantity,
          state,
          vendor,
          inventory_id: activeItem.inventory_id,
        });
      }
      setModalVisible(false);
    };
  
    return (
      <Modal
        open={modalVisible}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
        onClose={() => setModalVisible(false)}
      >
        <Box
          sx={{
            bgcolor: "white",
            padding: 3,
            width: { xs: "100%", md: "25%" },
            height: "auto",
            borderRadius: 1,
            my: 6,
            overflowY: "auto",
            position: "relative",
          }}
        >
          <ModalCloseButton onClick={() => setModalVisible(false)} />
  
          <Typography>{activeItem && activeItem.inventory_id}</Typography>
          {view == 0 ? (
            <>
              <Box sx={{ my: 2 }}>
                <TextField
                  size="small"
                  type="number"
                  variant="outlined"
                  placeholder="Quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </Box>
              <Box sx={{ my: 2 }}>
                <Select
                  size="small"
                  onChange={(e) => setVendor(e.target.value)}
                  value={vendor}
                >
                  <MenuItem value={-1}>Select Vendor</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company} value={company}>
                      {company}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
              <Box sx={{ my: 2 }}>
                <TextField
                  size="small"
                  variant="outlined"
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </Box>
              {/* <Button onClick={handleClick}>Add To Order</Button> */}
              <Button color="error" onClick={handleRemoveClick}>
                Remove From Order
              </Button>
            </>
          ) : null}
        </Box>
      </Modal>
    );
  };

  export default Index;
  