import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

const faqs = [
  {
    question: "What printers are supported?",
    answer:
      "We specialize in Brother GTX printer integration, including the GTX series and DTG printers. We also support most popular folding machines and can integrate with other production equipment upon request.",
  },
  {
    question: "Does it work with Etsy, Amazon, and other marketplaces?",
    answer:
      "Yes! We integrate with all major marketplaces including Amazon, Etsy, Walmart, Target, eBay, Shopify, and more. Orders automatically sync and flow through your production workflow.",
  },
  {
    question: "How fast is onboarding?",
    answer:
      "Most customers are up and running within 1-2 weeks. Our team comes to your warehouse and handles the technical setup, printer integration, and marketplace connections. We provide full training and support throughout the process.",
  },
  {
    question: "What's included in the monthly fee?",
    answer:
      "Everything! Unlimited orders, all integrations, 24/7 support, software updates, printer connectivity, shipping software, inventory management, and analytics. No hidden fees or per-transaction costs.",
  },
  {
    question: "Do you provide technical support?",
    answer:
      "Yes, we provide 24/7 technical support via chat, email, phone, and dedicated Slack channels. Our team includes print production experts who understand your workflow and can help optimize your operations.",
  },
];

export default function FAQSection() {
  return (
    <Box
      component="section"
      sx={{
        padding: { xs: "4rem 0", lg: "6rem 0" },
        background: "white",
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: "center", marginBottom: { xs: 4, lg: 6 } }}>
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontSize: { xs: "2rem", md: "2.5rem", lg: "3rem" },
              fontWeight: 700,
              marginBottom: 2,
              color: "#1a1a1a",
            }}
          >
            Frequently Asked Questions
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "#666666",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Everything you need to know about Pythias Technologies
          </Typography>
        </Box>

        <Box>
          {faqs.map((faq, index) => (
            <Accordion
              key={index}
              sx={{
                marginBottom: 2,
                border: "1px solid #e5e7eb",
                borderRadius: "8px !important",
                "&:before": { display: "none" },
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  padding: "1rem 1.5rem",
                  "& .MuiAccordionSummary-content": {
                    margin: 0,
                  },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: "#1a1a1a",
                  }}
                >
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  padding: "0 1.5rem 1.5rem 1.5rem",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: "#666666",
                    lineHeight: 1.7,
                  }}
                >
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
