"use client";
import {
    Box, Container, Typography, Stack, Card, CardContent, Button, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Chip, CircularProgress, Alert, TextField, Divider, Dialog, DialogTitle,
    DialogContent, DialogActions, IconButton, MenuItem,
} from "@mui/material";
import { useState, useCallback } from "react";
import axios from "axios";
import { Footer } from "../reusable/Footer";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DownloadIcon from "@mui/icons-material/Download";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import BalanceIcon from "@mui/icons-material/Balance";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CATEGORIES  = ["General","Software / Subscriptions","Marketing","Office / Supplies","Payroll","Utilities","Travel","Professional Services","Other"];

function fmt(n) { return `$${(n ?? 0).toFixed(2)}`; }

function KpiCard({ label, value, subtitle, color = "text.primary", icon }) {
    return (
        <Card variant="outlined" sx={{ borderRadius: 2, flex: 1, minWidth: 150 }}>
            <CardContent sx={{ pb: "16px !important" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5} lineHeight={1.4}>
                        {label}
                    </Typography>
                    {icon && <Box sx={{ color, opacity: 0.65, mt: 0.25 }}>{icon}</Box>}
                </Stack>
                <Typography variant="h5" fontWeight={800} color={color} mt={0.5}>{value}</Typography>
                {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
            </CardContent>
        </Card>
    );
}

function ClientCard({ title, invoiced, klingCost, expenses }) {
    const net = invoiced - klingCost - expenses;
    return (
        <Card variant="outlined" sx={{ borderRadius: 2, flex: 1, minWidth: 200 }}>
            <CardContent sx={{ pb: "16px !important" }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>{title}</Typography>
                <Stack spacing={0.75}>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Invoiced</Typography>
                        <Typography variant="body2" fontWeight={600}>{fmt(invoiced)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Kling Costs</Typography>
                        <Typography variant="body2" fontWeight={600} color={klingCost > 0 ? "error.main" : "text.secondary"}>{fmt(klingCost)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Expenses</Typography>
                        <Typography variant="body2" fontWeight={600} color={expenses > 0 ? "error.main" : "text.secondary"}>{fmt(expenses)}</Typography>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Net</Typography>
                        <Typography variant="body2" fontWeight={700} color={net >= 0 ? "success.main" : "error.main"}>{fmt(net)}</Typography>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}

function ExpenseDialog({ expense, defaultMonth, defaultYear, onClose, onSave }) {
    const isNew = !expense?._id;
    const [description, setDescription] = useState(expense?.description ?? "");
    const [amount, setAmount]           = useState(expense?.amount ?? "");
    const [category, setCategory]       = useState(expense?.category ?? "General");
    const [month, setMonth]             = useState(expense?.month ?? defaultMonth);
    const [year, setYear]               = useState(expense?.year ?? defaultYear);
    const [notes, setNotes]             = useState(expense?.notes ?? "");
    const [saving, setSaving]           = useState(false);
    const [error, setError]             = useState("");

    const handleSave = async () => {
        if (!description.trim() || !amount) { setError("Description and amount are required"); return; }
        setSaving(true);
        setError("");
        try {
            await onSave({ _id: expense?._id, description: description.trim(), amount: parseFloat(amount), category, month: parseInt(month), year: parseInt(year), notes: notes.trim() });
            onClose();
        } catch (e) {
            setError(e?.response?.data?.error ?? "Save failed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle fontWeight={700}>{isNew ? "Add Expense" : "Edit Expense"}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} fullWidth size="small" required />
                    <TextField label="Amount ($)" type="number" value={amount} onChange={e => setAmount(e.target.value)} fullWidth size="small" required inputProps={{ min: 0, step: 0.01 }} />
                    <TextField select label="Category" value={category} onChange={e => setCategory(e.target.value)} fullWidth size="small">
                        {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                    <Stack direction="row" spacing={2}>
                        <TextField select label="Month" value={month} onChange={e => setMonth(e.target.value)} size="small" fullWidth>
                            {MONTH_NAMES.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
                        </TextField>
                        <TextField label="Year" type="number" value={year} onChange={e => setYear(e.target.value)} size="small" sx={{ width: 110 }} />
                    </Stack>
                    <TextField label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} fullWidth size="small" multiline rows={2} />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button variant="outlined" onClick={onClose} disabled={saving}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} disabled={saving}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
                    {saving ? "Saving…" : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export function FinanceDashboard({ initialData, initialFrom, initialTo, initialExpenses }) {
    const [from, setFrom]         = useState(initialFrom);
    const [to, setTo]             = useState(initialTo);
    const [data, setData]         = useState(initialData);
    const [expenses, setExpenses] = useState(initialExpenses ?? []);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState(null);
    const [expenseDialog, setExpenseDialog] = useState(null);

    const now = new Date();
    const defaultMonth = now.getMonth() + 1;
    const defaultYear  = now.getFullYear();

    const load = useCallback(async (f, t) => {
        setLoading(true);
        setError(null);
        try {
            const [finRes, expRes] = await Promise.all([
                axios.get(`/api/admin/finance?from=${f}&to=${t}`),
                axios.get(`/api/admin/finance/expenses?from=${f}&to=${t}`),
            ]);
            setData(finRes.data);
            setExpenses(expRes.data.expenses);
        } catch (e) {
            setError(e?.response?.data?.error ?? "Failed to load data");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSaveExpense = async (data) => {
        if (data._id) {
            const res = await axios.put("/api/admin/finance/expenses", data);
            setExpenses(prev => prev.map(e => e._id === data._id ? res.data.expense : e));
        } else {
            const res = await axios.post("/api/admin/finance/expenses", data);
            setExpenses(prev => [res.data.expense, ...prev]);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!confirm("Delete this expense?")) return;
        try {
            await axios.delete("/api/admin/finance/expenses", { data: { _id: id } });
            setExpenses(prev => prev.filter(e => e._id !== id));
        } catch (e) {
            setError(e?.response?.data?.error ?? "Delete failed");
        }
    };

    const s = data?.summary ?? {};
    const months = data?.months ?? [];
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const net = (s.totalCollected ?? 0) - (s.totalKlingCost ?? 0) - totalExpenses;

    return (
        <Box sx={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>

                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #D3A73D 0%, #b8860b 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <TrendingUpIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>Finance Dashboard</Typography>
                            <Typography variant="body2" color="text.secondary">Income, costs, and profitability</Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" rowGap={1}>
                        <TextField type="month" label="From" value={from} onChange={e => setFrom(e.target.value)}
                            size="small" sx={{ width: 165 }} InputLabelProps={{ shrink: true }} />
                        <TextField type="month" label="To" value={to} onChange={e => setTo(e.target.value)}
                            size="small" sx={{ width: 165 }} InputLabelProps={{ shrink: true }} />
                        <Button variant="contained" onClick={() => load(from, to)} disabled={loading} sx={{ minWidth: 90 }}>
                            {loading ? <CircularProgress size={18} color="inherit" /> : "Apply"}
                        </Button>
                        <Button variant="outlined" startIcon={<DownloadIcon />}
                            href={`/api/admin/finance/csv?from=${from}&to=${to}`} download>
                            Export CSV
                        </Button>
                    </Stack>
                </Box>

                {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

                {/* KPI cards */}
                <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: "wrap", rowGap: 2 }}>
                    <KpiCard label="Total Invoiced"  value={fmt(s.totalInvoiced)}   subtitle="All service invoices issued"  color="primary.main"  icon={<ReceiptLongIcon fontSize="small" />} />
                    <KpiCard label="Collected"        value={fmt(s.totalCollected)}  subtitle="Paid invoices"               color="success.main"  icon={<AttachMoneyIcon fontSize="small" />} />
                    <KpiCard label="Outstanding"      value={fmt(s.totalOutstanding)} subtitle={s.totalOutstanding > 0 ? "Awaiting payment" : "All clear"} color={s.totalOutstanding > 0 ? "warning.main" : "text.disabled"} icon={<AccountBalanceIcon fontSize="small" />} />
                    <KpiCard label="Kling AI Costs"   value={fmt(s.totalKlingCost)}  subtitle="Video generation expense"   color="error.main"    icon={<OndemandVideoIcon fontSize="small" />} />
                    <KpiCard label="Expenses"         value={fmt(totalExpenses)}     subtitle={`${expenses.length} entr${expenses.length !== 1 ? "ies" : "y"}`} color="error.main" icon={<MoneyOffIcon fontSize="small" />} />
                    <KpiCard label="Net"              value={fmt(net)}               subtitle="Collected − Kling − Expenses" color={net >= 0 ? "success.main" : "error.main"} icon={<BalanceIcon fontSize="small" />} />
                </Stack>

                {/* Per-client breakdown */}
                <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: "wrap", rowGap: 2 }}>
                    <ClientCard title="Premier Printing" invoiced={s.premierInvoiced ?? 0} klingCost={s.premierKlingCost ?? 0} expenses={totalExpenses} />
                    <ClientCard title="PO"               invoiced={s.poInvoiced ?? 0}      klingCost={s.poKlingCost ?? 0}      expenses={0} />
                </Stack>

                {/* Monthly income/cost table */}
                {months.length > 0 && (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "action.hover" }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Premier Service</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">PO Service</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Premier Kling</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">PO Kling</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Expenses</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Total Income</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Total Costs</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Net</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {months.map(row => {
                                    const monthExpenses = expenses.filter(e => e.month === row.month && e.year === row.year).reduce((s, e) => s + e.amount, 0);
                                    const totalCosts = row.premierKling + row.poKling + monthExpenses;
                                    const rowNet = row.totalIncome - totalCosts;
                                    return (
                                        <TableRow key={`${row.year}-${row.month}`} hover>
                                            <TableCell sx={{ fontWeight: 600 }}>{MONTH_SHORT[row.month - 1]} {row.year}</TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.5}>
                                                    <Typography variant="body2">{fmt(row.premierService)}</Typography>
                                                    {row.premierService > 0 && (
                                                        <Chip size="small" label={row.premierServicePaid ? "Paid" : "Open"}
                                                            color={row.premierServicePaid ? "success" : "warning"} variant="outlined"
                                                            sx={{ height: 18, fontSize: "0.65rem", "& .MuiChip-label": { px: 0.75 } }} />
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.5}>
                                                    <Typography variant="body2">{fmt(row.poService)}</Typography>
                                                    {row.poService > 0 && (
                                                        <Chip size="small" label={row.poServicePaid ? "Paid" : "Open"}
                                                            color={row.poServicePaid ? "success" : "warning"} variant="outlined"
                                                            sx={{ height: 18, fontSize: "0.65rem", "& .MuiChip-label": { px: 0.75 } }} />
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: row.premierKling > 0 ? "error.main" : "text.disabled" }}>{fmt(row.premierKling)}</TableCell>
                                            <TableCell align="right" sx={{ color: row.poKling > 0 ? "error.main" : "text.disabled" }}>{fmt(row.poKling)}</TableCell>
                                            <TableCell align="right" sx={{ color: monthExpenses > 0 ? "error.main" : "text.disabled" }}>{fmt(monthExpenses)}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(row.totalIncome)}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, color: totalCosts > 0 ? "error.main" : "text.disabled" }}>{fmt(totalCosts)}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 800, color: rowNet >= 0 ? "success.main" : "error.main" }}>{fmt(rowNet)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                                <TableRow sx={{ backgroundColor: "action.hover" }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(s.premierInvoiced)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(s.poInvoiced)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: "error.main" }}>{fmt(s.premierKlingCost)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: "error.main" }}>{fmt(s.poKlingCost)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: "error.main" }}>{fmt(totalExpenses)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800 }}>{fmt(s.totalInvoiced)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: "error.main" }}>{fmt((s.totalKlingCost ?? 0) + totalExpenses)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: net >= 0 ? "success.main" : "error.main" }}>{fmt(net)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Expenses section */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Typography variant="h6" fontWeight={700}>Expenses</Typography>
                    <Button variant="contained" size="small" startIcon={<AddIcon />}
                        onClick={() => setExpenseDialog({})}>
                        Add Expense
                    </Button>
                </Box>

                {expenses.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                        <MoneyOffIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                        <Typography color="text.secondary">No expenses for this period. Click Add Expense to get started.</Typography>
                    </Box>
                ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "action.hover" }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                                    <TableCell sx={{ width: 80 }} />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {expenses.map(exp => (
                                    <TableRow key={exp._id} hover>
                                        <TableCell sx={{ whiteSpace: "nowrap" }}>{MONTH_SHORT[exp.month - 1]} {exp.year}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{exp.description}</TableCell>
                                        <TableCell><Chip size="small" label={exp.category} variant="outlined" /></TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: "error.main" }}>{fmt(exp.amount)}</TableCell>
                                        <TableCell sx={{ color: "text.secondary", fontSize: "0.82rem" }}>{exp.notes || "—"}</TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={0.5}>
                                                <IconButton size="small" onClick={() => setExpenseDialog(exp)}><EditIcon fontSize="small" /></IconButton>
                                                <IconButton size="small" color="error" onClick={() => handleDeleteExpense(exp._id)}><DeleteIcon fontSize="small" /></IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Container>
            <Footer />
            {expenseDialog !== null && (
                <ExpenseDialog
                    expense={expenseDialog._id ? expenseDialog : null}
                    defaultMonth={defaultMonth}
                    defaultYear={defaultYear}
                    onClose={() => setExpenseDialog(null)}
                    onSave={handleSaveExpense}
                />
            )}
        </Box>
    );
}
