import {Box, Typography, Container} from "@mui/material";


export default function PrivacyPage() {
    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>Privacy Policy</Typography>
            <Box sx={{ whiteSpace: 'pre-line' }}>
                <Typography variant="body1" paragraph>
                    At Pythias, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your personal information when you use our services. 
                </Typography>
                <Typography variant="body1" paragraph>
                    1. Information We Collect:
                    We may collect personal information such as your name, email address, and payment details when you register for an account or make a purchase. We also collect non-personal information such as browser type, IP address, and usage data to improve our services.
                </Typography>
                <Typography variant="body1" paragraph>
                    2. How We Use Your Information:
                    We use your personal information to provide and improve our services, process transactions, and communicate with you. Non-personal information is used for analytics and to enhance user experience.    

                </Typography>
                <Typography variant="body1" paragraph>
                    3. Data Sharing and Disclosure:
                    We do not sell or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our business, subject to confidentiality agreements. We may also disclose your information if required by law or to protect our rights.  
                </Typography>
                <Typography variant="body1" paragraph>
                    4. Data Security:
                    We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.
                </Typography>
                <Typography variant="body1" paragraph>
                    5. Your Rights:
                    You have the right to access, correct, or delete your personal information. You may also opt-out of receiving marketing communications from us. To exercise these rights, please contact us at support@pythiastechnologies.com.
                </Typography>
                <Typography variant="body1" paragraph>
                    6. Changes to This Privacy Policy:
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on our website. You are advised to review this policy periodically for any updates.
                </Typography>
                <Typography variant="body1" paragraph>
                    7. Contact Us:
                    If you have any questions or concerns about this Privacy Policy, please contact us at support@pythiastechnologies.com.
                </Typography>
            </Box>
        </Container>
    );
}