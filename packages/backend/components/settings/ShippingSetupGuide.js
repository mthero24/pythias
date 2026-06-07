"use client";
import {
    Box, Container, Typography, Stack, Paper, Divider,
    Chip, Alert,
} from "@mui/material";
import Link from "next/link";
import RouterIcon from "@mui/icons-material/Router";
import PrintIcon from "@mui/icons-material/Print";
import ScaleIcon from "@mui/icons-material/Scale";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import LabelIcon from "@mui/icons-material/Label";

function Code({ children }) {
    return (
        <Box component="code" sx={{
            bgcolor: "action.hover", px: 0.75, py: 0.25,
            borderRadius: 0.5, fontFamily: "monospace", fontSize: "0.85em",
            display: "inline",
        }}>
            {children}
        </Box>
    );
}

function Step({ number, icon, title, children }) {
    return (
        <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{
                    width: 36, height: 36, borderRadius: "50%",
                    bgcolor: "primary.main", color: "primary.contrastText",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 16, flexShrink: 0,
                }}>
                    {number}
                </Box>
                <Box flex={1}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                        {icon}
                        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
                    </Stack>
                    {children}
                </Box>
            </Stack>
        </Paper>
    );
}

export function ShippingSetupGuide({ settingsPath = "/admin/settings/shipping", labelsPath = "/admin/settings/labels" }) {
    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Stack spacing={1} sx={{ mb: 4 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight={700}>Shipping Setup Guide</Typography>
                        <Link href={settingsPath} style={{ textDecoration: "none" }}>
                            <Typography variant="body2" color="primary.main">← Back to settings</Typography>
                        </Link>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        Follow these steps in order to connect your internal server, carrier accounts, label printers, and shipping scales.
                    </Typography>
                </Stack>

                <Stack spacing={2}>

                    {/* Step 1 — Internal Server */}
                    <Step number={1} icon={<RouterIcon color="primary" fontSize="small" />} title="Install & connect the Pythias Internal Server">
                        <Stack spacing={1.5}>
                            <Typography variant="body2">
                                The Pythias Internal Server is a small Windows application that runs on a PC on your local network. It bridges USB scales and label printers to the cloud dashboard and handles DTF file delivery to production machines.
                            </Typography>

                            <Divider />

                            <Typography variant="body2" fontWeight={600}>Step 1a — Find the server PC&apos;s IP address</Typography>
                            <Stack component="ol" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
                                <Typography component="li" variant="body2">On the server PC, open <strong>Command Prompt</strong> and run <Code>ipconfig</Code></Typography>
                                <Typography component="li" variant="body2">Copy the <Code>IPv4 Address</Code> (e.g. <Code>192.168.1.50</Code>)</Typography>
                                <Typography component="li" variant="body2">The server listens on port <Code>3005</Code> — enter the combined value <Code>192.168.1.50:3005</Code> in the <strong>Internal Server IP</strong> field in <Link href={settingsPath}>Shipping &amp; Hardware settings</Link></Typography>
                            </Stack>

                            <Typography variant="body2" fontWeight={600}>Step 1b — Get the API key</Typography>
                            <Stack component="ol" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
                                <Typography component="li" variant="body2">Open the Pythias Internal Server app on the server PC</Typography>
                                <Typography component="li" variant="body2">Go to <strong>Settings → API Key</strong> and copy the bearer token</Typography>
                                <Typography component="li" variant="body2">Paste it into the <strong>Internal Server API Key</strong> field in <Link href={settingsPath}>Shipping &amp; Hardware settings</Link></Typography>
                            </Stack>

                            <Alert severity="info" sx={{ mt: 0.5 }}>
                                Assign a <strong>static IP</strong> to the server PC in your router settings so the address does not change after a reboot. Look for &ldquo;DHCP Reservation&rdquo; or &ldquo;IP Binding&rdquo; in your router&apos;s admin panel.
                            </Alert>
                        </Stack>
                    </Step>

                    {/* Step 2 — Warehouse address */}
                    <Step number={2} icon={<WarehouseIcon color="primary" fontSize="small" />} title="Set your warehouse / return address">
                        <Stack spacing={1.5}>
                            <Typography variant="body2">
                                This address appears as the <strong>return address</strong> on every shipping label and is used as the origin when calculating rates from USPS, UPS, FedEx, and DHL.
                            </Typography>
                            <Typography variant="body2">
                                Go to <Link href={settingsPath}>Shipping &amp; Hardware → Warehouse / Return Address</Link> and complete every field. The ZIP code and state must match your physical ship-from location — carriers use this when computing rates and transit times.
                            </Typography>
                        </Stack>
                    </Step>

                    {/* Step 3 — Carrier credentials */}
                    <Step number={3} icon={<VpnKeyIcon color="primary" fontSize="small" />} title="Add carrier API credentials">
                        <Stack spacing={2.5}>
                            <Typography variant="body2">
                                All credentials are stored encrypted in your database and are never re-exposed in plain text after saving. Open each carrier section in <Link href={settingsPath}>Shipping &amp; Hardware settings</Link>.
                            </Typography>

                            <Box>
                                <Chip label="ShipStation" size="small" sx={{ mb: 1 }} />
                                <Stack component="ol" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
                                    <Typography component="li" variant="body2">Log into ShipStation → <strong>Account Settings → API Keys</strong></Typography>
                                    <Typography component="li" variant="body2">Copy the <strong>API Key</strong> and <strong>API Secret</strong> (used for order sync)</Typography>
                                    <Typography component="li" variant="body2">On the same page, generate a <strong>V2 Bearer Token</strong> (used for rate shopping)</Typography>
                                </Stack>
                            </Box>

                            <Divider />

                            <Box>
                                <Chip label="USPS" size="small" sx={{ mb: 1 }} />
                                <Stack component="ol" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
                                    <Typography component="li" variant="body2">Register at <strong>developer.usps.com</strong> and create an app — this gives you the <strong>Client ID</strong> and <strong>Client Secret</strong></Typography>
                                    <Typography component="li" variant="body2">Your <strong>Account Number</strong>, <strong>CRID</strong>, and <strong>MID</strong> come from the USPS Business Customer Gateway (bcg.usps.com)</Typography>
                                    <Typography component="li" variant="body2"><strong>Manifest MID</strong> is typically the same as your MID unless you use a separate SCAN form account</Typography>
                                </Stack>
                            </Box>

                            <Divider />

                            <Box>
                                <Chip label="UPS" size="small" sx={{ mb: 1 }} />
                                <Stack component="ol" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
                                    <Typography component="li" variant="body2">Go to <strong>developer.ups.com</strong> → My Apps → Add App</Typography>
                                    <Typography component="li" variant="body2">Select the Shipping APIs and copy the <strong>Client ID</strong> and <strong>Client Secret</strong></Typography>
                                    <Typography component="li" variant="body2">Your 6-character <strong>Account Number</strong> is on your UPS invoice or under My Profile in UPS.com</Typography>
                                </Stack>
                            </Box>

                            <Divider />

                            <Box>
                                <Chip label="FedEx" size="small" sx={{ mb: 1 }} />
                                <Stack component="ol" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
                                    <Typography component="li" variant="body2">Log into <strong>developer.fedex.com</strong> → My Projects → Create a project</Typography>
                                    <Typography component="li" variant="body2">Add the &ldquo;Ship&rdquo; API and copy the <strong>Client ID</strong> and <strong>Client Secret</strong></Typography>
                                    <Typography component="li" variant="body2">Your <strong>Account Number</strong> is on FedEx Billing Online or any FedEx invoice</Typography>
                                </Stack>
                            </Box>

                            <Divider />

                            <Box>
                                <Chip label="DHL" size="small" sx={{ mb: 1 }} />
                                <Stack component="ol" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
                                    <Typography component="li" variant="body2">Register at <strong>developer.dhl.com</strong> and create an app for DHL Parcel or Express</Typography>
                                    <Typography component="li" variant="body2">Copy the <strong>Client ID</strong> and <strong>Client Secret</strong></Typography>
                                    <Typography component="li" variant="body2">Your <strong>Account Number</strong> appears on your DHL contract or in the DHL Business portal</Typography>
                                </Stack>
                            </Box>
                        </Stack>
                    </Step>

                    {/* Step 4 — Label printers */}
                    <Step number={4} icon={<PrintIcon color="primary" fontSize="small" />} title="Add label printers">
                        <Stack spacing={1.5}>
                            <Typography variant="body2">
                                Go to <Link href={settingsPath}>Shipping &amp; Hardware → Label Printers</Link>. You need each printer&apos;s local network IP address and the correct label format.
                            </Typography>

                            <Typography variant="body2" fontWeight={600}>Choosing ZPL vs PDF</Typography>
                            <Stack spacing={1}>
                                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                    <Chip label="ZPL" size="small" color="primary" variant="outlined" sx={{ mt: 0.25, flexShrink: 0 }} />
                                    <Typography variant="body2">
                                        <strong>Direct network printing — fastest.</strong> The label is sent in raw ZPL directly to the printer&apos;s IP over port <Code>9100</Code>.
                                        Compatible printers: Zebra ZD421, ZD621, GK420d, GX430t, ZP450, LP2844.
                                        Connect via Ethernet or Wi-Fi and enter the printer&apos;s IP directly.
                                    </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                    <Chip label="PDF" size="small" color="secondary" variant="outlined" sx={{ mt: 0.25, flexShrink: 0 }} />
                                    <Typography variant="body2">
                                        <strong>USB-bridged via internal server.</strong> For printers connected by USB to the server PC. The internal server receives the PDF and routes it to the correct printer.
                                        Compatible: Rollo X1038, DYMO LabelWriter 4XL, Munbyn ITPP941, Citizen CL-S521.
                                        Use the internal server IP and port <Code>9100</Code>.
                                    </Typography>
                                </Stack>
                            </Stack>

                            <Typography variant="body2" fontWeight={600}>Finding your printer&apos;s IP address</Typography>
                            <Stack component="ul" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
                                <Typography component="li" variant="body2"><strong>Zebra printers:</strong> Hold the feed button for 2 seconds to print a config label showing the IP address</Typography>
                                <Typography component="li" variant="body2"><strong>Other printers:</strong> Check your router&apos;s DHCP client list and match by MAC address from the printer&apos;s label or settings menu</Typography>
                                <Typography component="li" variant="body2">Assign a <strong>static IP</strong> via the printer&apos;s network menu or via DHCP reservation in your router</Typography>
                            </Stack>
                        </Stack>
                    </Step>

                    {/* Step 5 — Stations */}
                    <Step number={5} icon={<PointOfSaleIcon color="primary" fontSize="small" />} title="Add shipping stations">
                        <Stack spacing={1.5}>
                            <Typography variant="body2">
                                Go to <Link href={settingsPath}>Shipping &amp; Hardware → Production Machines → Shipping Stations</Link>. Each station card represents one packing workstation on your production floor.
                            </Typography>

                            <Stack spacing={0.75}>
                                <Typography variant="body2">
                                    <strong>Name</strong> — must exactly match the station identifier in your internal server&apos;s <Code>fwSettings.json</Code>. Convention: <Code>station1</Code>, <Code>station2</Code>, etc. Names are case-sensitive.
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Scale toggle</strong> — enable if a USB scale is plugged into the server PC at that station. When enabled, the shipping modal reads weight automatically instead of requiring manual entry.
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Format (ZPL / PDF)</strong> — choose based on the printer physically at that station. ZPL sends the label directly to a networked Zebra; PDF routes through the internal server to a USB printer.
                                </Typography>
                            </Stack>

                            <Alert severity="warning">
                                Station names are case-sensitive and must exactly match the identifiers in <Code>fwSettings.json</Code>. A mismatch will cause labels to print at the wrong station or silently fail.
                            </Alert>
                        </Stack>
                    </Step>

                    {/* Step 6 — Scales */}
                    <Step number={6} icon={<ScaleIcon color="primary" fontSize="small" />} title="Add shipping scales">
                        <Stack spacing={1.5}>
                            <Typography variant="body2">
                                Go to <Link href={settingsPath}>Shipping &amp; Hardware → Shipping Scales</Link>. Scales connect via USB to the server PC. The internal server exposes each scale as a local HTTP endpoint.
                            </Typography>

                            <Typography variant="body2" fontWeight={600}>Compatible models</Typography>
                            <Stack component="ul" spacing={0.25} sx={{ pl: 2.5, m: 0 }}>
                                <Typography component="li" variant="body2">Stamps.com 5 lb Digital Scale</Typography>
                                <Typography component="li" variant="body2">Dymo M25 (25 lb capacity)</Typography>
                                <Typography component="li" variant="body2">Fairbanks SCB-R9000</Typography>
                                <Typography component="li" variant="body2">Adam Equipment CBD 4 Compact</Typography>
                            </Stack>

                            <Typography variant="body2">
                                Use the <strong>internal server IP</strong> and port <Code>8080</Code> for all scales. The <strong>Name</strong> must match the scale identifier in <Code>fwSettings.json</Code>. If you only have one scale, leave the name as <Code>scale1</Code>.
                            </Typography>

                            <Alert severity="info">
                                After saving, open the shipping modal on an order and click <strong>Weigh</strong>. If the scale reads <Code>8oz</Code> on every order without a real reading, the internal server IP is unreachable — check network connectivity and the static IP assignment.
                            </Alert>
                        </Stack>
                    </Step>

                    {/* Step 7 — Label setup */}
                    <Step number={7} icon={<LabelIcon color="primary" fontSize="small" />} title="Configure pick labels">
                        <Stack spacing={1.5}>
                            <Typography variant="body2">
                                Go to <Link href={labelsPath}>Label Settings</Link> to design the pick label printed with every order. The label contains a barcode, order info, and any custom fields you choose.
                            </Typography>

                            <Typography variant="body2" fontWeight={600}>Label Design tab</Typography>
                            <Stack component="ul" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
                                <Typography component="li" variant="body2"><strong>Label size</strong> — choose the physical stock loaded in your label printer (4×6 is standard for shipping labels; 4×3 and 4×2 are common for pick labels)</Typography>
                                <Typography component="li" variant="body2"><strong>Fields</strong> — toggle which data points appear on the label (order number, name, SKU, color, size, ship-by date, etc.). Drag each field on the canvas to position it</Typography>
                                <Typography component="li" variant="body2"><strong>Resize &amp; rotate</strong> — right-click any field on the canvas to change its font size or rotation</Typography>
                                <Typography component="li" variant="body2">Click <strong>Save</strong> when the layout looks correct</Typography>
                            </Stack>

                            <Typography variant="body2" fontWeight={600}>Special Cases tab (optional)</Typography>
                            <Stack component="ul" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
                                <Typography component="li" variant="body2">Enable a marketplace (Target, Walmart, Kohl&apos;s, etc.) to print an <strong>extra label alongside the standard pick label</strong> — both always print; the special label is never a replacement</Typography>
                                <Typography component="li" variant="body2">Choose the <strong>barcode field</strong> (UPC or Piece ID) and which data fields to include</Typography>
                                <Typography component="li" variant="body2">Optionally enable a <strong>brand logo</strong> — this requires brands to be configured under the Brands section</Typography>
                            </Stack>

                            <Alert severity="info">
                                Label changes take effect immediately for new print jobs. Re-printing an existing order picks up the latest template automatically.
                            </Alert>
                        </Stack>
                    </Step>

                </Stack>
            </Container>
        </Box>
    );
}
