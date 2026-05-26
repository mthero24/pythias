const DATE = "May 26, 2026";
const REVIEW = "May 26, 2027";

const POLICIES = [
  {
    slug: "network-security",
    title: "Network Security Policy",
    subtitle: "Network Segregation & Threat Monitoring",
    filename: "pythias-network-security-policy.pdf",
    effectiveDate: DATE,
    reviewDate: REVIEW,
    sections: [
      {
        number: "1", title: "Purpose",
        body: [
          { type: "p", text: "This policy defines Pythias Technologies' standards for securing its network infrastructure, segregating environments, and monitoring for threats. It applies to all network-connected systems and services operated by or on behalf of Pythias." },
        ],
      },
      {
        number: "2", title: "Network Architecture & Segregation",
        body: [
          { type: "p", text: "Pythias maintains logical separation between production, development, and administrative environments:" },
          { type: "li", text: "Production systems (MongoDB Atlas, application servers, Wasabi storage) are isolated from development and testing environments." },
          { type: "li", text: "MongoDB Atlas clusters are restricted by IP allowlist — only authorized server IPs may connect to the production database." },
          { type: "li", text: "Application servers are hosted on dedicated infrastructure with inbound access limited to HTTPS (443) from the public internet and SSH (22) from authorized administrator IPs only." },
          { type: "li", text: "Internal services communicate over private/internal network channels where possible; all cross-service traffic uses authenticated API calls." },
          { type: "li", text: "Development and staging environments do not share credentials, API keys, or databases with production." },
        ],
      },
      {
        number: "3", title: "Firewall & Perimeter Security",
        body: [
          { type: "li", text: "All inbound traffic to production servers is filtered at the host and/or cloud provider level. Only ports 80 (redirected to 443) and 443 are open to the public." },
          { type: "li", text: "Administrative access via SSH is restricted to key-based authentication from approved IP ranges. Password-based SSH authentication is disabled." },
          { type: "li", text: "Default-deny inbound rules are applied — all ports are closed unless explicitly opened for a documented purpose." },
          { type: "li", text: "Cloud provider security groups (where applicable) are reviewed quarterly to remove any unused rules." },
        ],
      },
      {
        number: "4", title: "Traffic Monitoring & Threat Detection",
        body: [
          { type: "li", text: "Application logs are retained for 30 days and reviewed for anomalous patterns including repeated authentication failures, unexpected API calls, and unusual data access volumes." },
          { type: "li", text: "MongoDB Atlas alerts are configured to notify on unauthorized connection attempts, unusual query patterns, and replication anomalies." },
          { type: "li", text: "Server-level access logs (SSH, HTTP) are monitored. Repeated failed login attempts trigger account lockout or temporary IP block." },
          { type: "li", text: "Rate limiting is applied to public-facing API endpoints to mitigate brute-force and abuse attempts." },
          { type: "li", text: "Any detected threat or anomaly is treated as a security incident per the Incident Response Policy." },
        ],
      },
      {
        number: "5", title: "Remote Access",
        body: [
          { type: "p", text: "Administrative access to production systems from outside the office network is permitted only under the following conditions:" },
          { type: "li", text: "Access is via SSH with key-based authentication only. No password SSH, no RDP to production." },
          { type: "li", text: "SSH keys must be passphrase-protected and stored securely on the administrator's device." },
          { type: "li", text: "Remote administrators are expected to use a secure, private network — no public Wi-Fi without a VPN." },
          { type: "li", text: "Any administrative session must be terminated when not in active use." },
        ],
      },
      {
        number: "6", title: "Third-Party Network Connections",
        body: [
          { type: "p", text: "Connections to third-party services (ShipStation, marketplace APIs, OpenAI, Google) are made outbound over HTTPS only. Inbound webhooks from third parties are validated using shared secrets or HMAC signatures before processing. No third party is granted direct inbound network access to Pythias infrastructure." },
        ],
      },
      {
        number: "7", title: "Policy Review",
        body: [
          { type: "p", text: `This policy is reviewed annually (next review: ${REVIEW}) and updated following any significant infrastructure change, security incident, or vendor change that affects network topology.` },
        ],
      },
    ],
  },

  {
    slug: "endpoint-security",
    title: "Endpoint Security Policy",
    subtitle: "Antivirus & Device Protection Standards",
    filename: "pythias-endpoint-security-policy.pdf",
    effectiveDate: DATE,
    reviewDate: REVIEW,
    sections: [
      {
        number: "1", title: "Purpose",
        body: [
          { type: "p", text: "This policy establishes minimum security requirements for all endpoints (laptops, desktops, and mobile devices) used to access Pythias systems, data, or internal tools. The goal is to prevent malware, unauthorized access, and data exfiltration through compromised devices." },
        ],
      },
      {
        number: "2", title: "Scope",
        body: [
          { type: "p", text: "This policy applies to all devices — company-owned or personal (BYOD) — used by Pythias employees, contractors, or any person with access to Pythias production systems or Confidential/Restricted data." },
        ],
      },
      {
        number: "3", title: "Antivirus & Anti-malware Requirements",
        body: [
          { type: "li", text: "All Windows endpoints must have Windows Defender (or equivalent enterprise AV) installed, active, and up to date. Real-time protection must be enabled at all times." },
          { type: "li", text: "Antivirus definitions must be updated automatically. Endpoints that cannot receive automatic updates must be updated manually at least weekly." },
          { type: "li", text: "Full system scans must be performed at least monthly. Scans must be logged and results reviewed." },
          { type: "li", text: "macOS endpoints must have Gatekeeper and XProtect enabled, and must run a reputable third-party AV solution if accessing Restricted data." },
          { type: "li", text: "Any endpoint with a detected infection must be immediately isolated from the network and reported to the company owner before re-joining." },
        ],
      },
      {
        number: "4", title: "Operating System & Software Updates",
        body: [
          { type: "li", text: "Operating systems must be kept current. Critical and security patches must be applied within 7 days of release." },
          { type: "li", text: "Auto-update must be enabled for the OS and all major applications (browsers, Node.js runtimes, etc.) on production-access devices." },
          { type: "li", text: "End-of-life operating systems (e.g., Windows 10 after October 2025) must not be used to access Pythias production systems." },
          { type: "li", text: "Development dependencies (npm packages, Docker images) must be reviewed for known CVEs at least monthly using automated audit tools (e.g., npm audit)." },
        ],
      },
      {
        number: "5", title: "Device Access Controls",
        body: [
          { type: "li", text: "All endpoints must require authentication (PIN, password, biometric) to unlock. Screens must lock automatically after 5 minutes of inactivity." },
          { type: "li", text: "Full-disk encryption must be enabled on all devices used to access Pythias systems (BitLocker on Windows, FileVault on macOS)." },
          { type: "li", text: "No Pythias Restricted or Confidential data may be stored unencrypted on a local device. Cloud sync to personal accounts (personal Dropbox, Google Drive, iCloud) is not permitted for business data." },
          { type: "li", text: "Lost or stolen devices must be reported to the company owner immediately so remote-wipe can be initiated and associated credentials rotated." },
        ],
      },
      {
        number: "6", title: "Prohibited Software & Behavior",
        body: [
          { type: "li", text: "Installing software from untrusted or pirated sources is prohibited on any device used to access Pythias systems." },
          { type: "li", text: "Connecting personal USB storage, external drives, or unknown peripherals to devices accessing production systems is prohibited without explicit approval." },
          { type: "li", text: "Disabling or circumventing AV, firewall, or OS security features on any business-access device is prohibited." },
        ],
      },
      {
        number: "7", title: "Policy Review",
        body: [
          { type: "p", text: `This policy is reviewed annually (next review: ${REVIEW}) or when a material change in device types, operating systems, or threat landscape warrants it.` },
        ],
      },
    ],
  },

  {
    slug: "security-baseline",
    title: "Security Baseline Policy",
    subtitle: "Minimum Security Standards for Daily Operations",
    filename: "pythias-security-baseline-policy.pdf",
    effectiveDate: DATE,
    reviewDate: REVIEW,
    sections: [
      {
        number: "1", title: "Purpose",
        body: [
          { type: "p", text: "This policy defines the minimum security controls that must be in place and actively maintained across all Pythias systems and operations. It serves as the operational floor — every system, account, and process must meet or exceed these standards." },
        ],
      },
      {
        number: "2", title: "Authentication Baseline",
        body: [
          { type: "li", text: "All user accounts must use a unique, strong password (minimum 12 characters, mix of upper/lower/numbers/symbols). Passwords must not be reused across systems." },
          { type: "li", text: "All user passwords stored in Pythias systems are hashed using bcrypt with a minimum cost factor of 12. Plaintext passwords are never stored or logged." },
          { type: "li", text: "Multi-factor authentication (MFA) is required for all administrator-level access to cloud infrastructure (MongoDB Atlas, hosting providers, domain registrars)." },
          { type: "li", text: "Default credentials on any system, device, or service must be changed immediately upon provisioning. No system may remain in production with vendor-default passwords." },
          { type: "li", text: "Session tokens expire after inactivity. JWT tokens issued by Pythias services have defined expiry periods and are invalidated on sign-out." },
        ],
      },
      {
        number: "3", title: "System Hardening Standards",
        body: [
          { type: "li", text: "All production servers must have only the services and ports required for their function enabled. All unused services must be disabled." },
          { type: "li", text: "SSH root login is disabled on all servers. Administrative SSH access uses key-based authentication only from approved IP addresses." },
          { type: "li", text: "Application processes run under non-root system users with the minimum permissions required." },
          { type: "li", text: "Error messages returned to end users must not expose internal stack traces, file paths, database structure, or other system internals." },
          { type: "li", text: "All web services enforce HTTPS. HTTP connections are redirected to HTTPS. HSTS headers are set on all production domains." },
        ],
      },
      {
        number: "4", title: "Secrets & Configuration Management",
        body: [
          { type: "li", text: "All secrets (API keys, database credentials, OAuth tokens, signing secrets) are stored in environment variables or a secure secrets manager. They are never hardcoded in source code." },
          { type: "li", text: "Version control repositories (.git) must never contain secrets. .gitignore rules must exclude all .env and .env.local files before first commit." },
          { type: "li", text: "Secrets are rotated at least annually and immediately upon any suspected or confirmed compromise." },
          { type: "li", text: "Each service or integration uses its own credential set — shared credentials between unrelated services are not permitted." },
        ],
      },
      {
        number: "5", title: "Patch & Dependency Management",
        body: [
          { type: "li", text: "Critical CVEs affecting production dependencies must be patched within 48 hours of a viable fix being available." },
          { type: "li", text: "High-severity CVEs must be patched within 7 days. Medium and low severity within 30 days." },
          { type: "li", text: "Dependency audits (npm audit or equivalent) are run on every deployment. CI/CD pipelines or manual audits must flag new high/critical vulnerabilities before code reaches production." },
          { type: "li", text: "Operating systems and runtime environments (Node.js) on production servers must remain within their supported version ranges." },
        ],
      },
      {
        number: "6", title: "Backup & Recovery Baseline",
        body: [
          { type: "li", text: "Production databases are backed up daily via MongoDB Atlas automated backups. Backups are retained for a minimum of 7 days." },
          { type: "li", text: "Application code is version-controlled in a private Git repository. Deployment scripts are documented and reproducible." },
          { type: "li", text: "Recovery procedures are tested at least annually by restoring from backup to a non-production environment." },
        ],
      },
      {
        number: "7", title: "Logging & Auditability",
        body: [
          { type: "li", text: "All authentication events (successful and failed logins), administrative actions, and API calls involving Restricted or Confidential data must be logged." },
          { type: "li", text: "Logs must not contain plaintext passwords, full API keys, full credit card numbers, or other Restricted data." },
          { type: "li", text: "Log files are retained for at least 30 days on a rolling basis. Longer retention is required during active security investigations." },
          { type: "li", text: "Logs are reviewed at least weekly for anomalies; alerts are configured for repeated authentication failures and unexpected access patterns." },
        ],
      },
      {
        number: "8", title: "Policy Review",
        body: [
          { type: "p", text: `This baseline is reviewed annually (next review: ${REVIEW}) and updated when new systems are introduced, significant incidents occur, or industry best practices materially change.` },
        ],
      },
    ],
  },

  {
    slug: "access-control",
    title: "Access Control Policy",
    subtitle: "User Access, Roles, and Privilege Management",
    filename: "pythias-access-control-policy.pdf",
    effectiveDate: DATE,
    reviewDate: REVIEW,
    sections: [
      {
        number: "1", title: "Purpose",
        body: [
          { type: "p", text: "This policy defines how access to Pythias systems, data, and infrastructure is granted, maintained, and revoked. The goal is to ensure that every person and service has the minimum access necessary for their role, and that access is revoked promptly when no longer needed." },
        ],
      },
      {
        number: "2", title: "Guiding Principles",
        body: [
          { type: "li", text: "Least privilege — every account is granted only the access required for its specific function. No blanket admin access without documented justification." },
          { type: "li", text: "Need to know — access to Confidential or Restricted data is limited to individuals with a specific, documented business need." },
          { type: "li", text: "Separation of duties — where feasible, critical operations (e.g., code deployment, database changes, billing) require action by more than one person." },
          { type: "li", text: "Default deny — access is not granted by default. All access rights must be explicitly provisioned." },
        ],
      },
      {
        number: "3", title: "Role Definitions",
        body: [
          { type: "p", text: "Pythias platforms define the following roles:" },
          { type: "classification", label: "ADMIN", text: "Full access to all features, data, and configuration. Reserved for company owners and designated senior technical staff. Requires MFA." },
          { type: "classification", label: "PRODUCTION", text: "Access to order management, production queues, shipping, and operational data. Cannot modify system configuration, access billing, or view admin-only analytics." },
          { type: "classification", label: "VIEWER", text: "Read-only access to assigned data sets. Cannot modify records, export data in bulk, or access configuration." },
          { type: "classification", label: "SERVICE", text: "Machine-to-machine accounts used by automated processes and integrations. Scoped to the minimum API permissions required. No UI access." },
        ],
      },
      {
        number: "4", title: "Account Lifecycle",
        body: [
          { type: "sub", text: "Provisioning" },
          { type: "li", text: "New accounts are created only upon written or documented request from a manager or company owner." },
          { type: "li", text: "Accounts are provisioned with the minimum role required for the stated job function." },
          { type: "li", text: "Temporary contractors receive time-limited accounts that expire at the end of the engagement." },
          { type: "sub", text: "Modification" },
          { type: "li", text: "Role changes require documented approval. Privilege elevation (e.g., from Production to Admin) requires company owner approval." },
          { type: "sub", text: "Deprovisioning" },
          { type: "li", text: "Accounts must be disabled within one business day of an employee or contractor departure." },
          { type: "li", text: "Any credentials the departing individual had access to (shared API keys, deploy keys) must be rotated within five business days." },
          { type: "li", text: "Deprovisioning is logged and confirmed by the company owner." },
        ],
      },
      {
        number: "5", title: "Authentication Requirements",
        body: [
          { type: "li", text: "All accounts require a unique password meeting the Security Baseline Policy minimum standards." },
          { type: "li", text: "MFA is mandatory for Admin accounts accessing cloud infrastructure (MongoDB Atlas, hosting control panels, DNS)." },
          { type: "li", text: "Passwords must not be shared. Each person has their own named account — shared/generic accounts are not permitted for human users." },
          { type: "li", text: "Service accounts use API key or token-based authentication, not username/password." },
        ],
      },
      {
        number: "6", title: "Access Reviews",
        body: [
          { type: "p", text: "All user accounts and their assigned roles are reviewed quarterly by the company owner. During each review:" },
          { type: "li", text: "Accounts with no activity in the previous 90 days are flagged for deactivation." },
          { type: "li", text: "Admin-level accounts are verified as still required and still appropriate." },
          { type: "li", text: "Service account permissions are verified against documented integration requirements." },
        ],
      },
      {
        number: "7", title: "Third-Party & Client Access",
        body: [
          { type: "p", text: "Clients access their own data through scoped API tokens or platform accounts. Third-party integrations (marketplace APIs, shipping carriers) are granted API access scoped to the minimum permissions required by the integration. All such tokens are documented, auditable, and revocable." },
        ],
      },
      {
        number: "8", title: "Policy Review",
        body: [
          { type: "p", text: `This policy is reviewed annually (next review: ${REVIEW}) and updated whenever organizational structure, platform roles, or access infrastructure changes.` },
        ],
      },
    ],
  },

  {
    slug: "data-classification",
    title: "Data Classification & Encryption Policy",
    subtitle: "Classifying Data and Encrypting It in Transit and at Rest",
    filename: "pythias-data-classification-encryption-policy.pdf",
    effectiveDate: DATE,
    reviewDate: REVIEW,
    sections: [
      {
        number: "1", title: "Purpose",
        body: [
          { type: "p", text: "This policy defines how Pythias classifies the data it handles and the encryption standards applied to each classification level, both when data is stored (at rest) and when it is transmitted (in transit). All employees, contractors, and systems processing Pythias data must adhere to these standards." },
        ],
      },
      {
        number: "2", title: "Data Classification Tiers",
        body: [
          { type: "classification", label: "RESTRICTED", text: "Credentials, API keys, OAuth tokens, hashed passwords, signing secrets, and payment-adjacent data. Highest protection level. Must never appear in logs, commits, or plaintext storage." },
          { type: "classification", label: "CONFIDENTIAL", text: "End-customer PII (name, email, phone, address), client billing details, employee personal information, and internal financial data. Requires encryption at rest and in transit. Access limited to documented business need." },
          { type: "classification", label: "INTERNAL", text: "Client account data, operational analytics, design assets, production records. Encrypted in transit. Access limited to Pythias staff and the owning client." },
          { type: "classification", label: "PUBLIC", text: "Marketing content, public-facing documentation, published blog posts. No encryption requirement beyond standard HTTPS delivery." },
        ],
      },
      {
        number: "3", title: "Encryption in Transit",
        body: [
          { type: "li", text: "All data transmitted between clients and Pythias services is encrypted using TLS 1.2 or higher. TLS 1.0 and 1.1 are not accepted." },
          { type: "li", text: "HTTP is redirected to HTTPS on all public-facing endpoints. HSTS (HTTP Strict Transport Security) headers are enforced on production domains." },
          { type: "li", text: "All API calls to third-party services (marketplace APIs, MongoDB Atlas, Wasabi, ShipStation, OpenAI) are made over HTTPS/TLS." },
          { type: "li", text: "Internal inter-service communication uses authenticated, encrypted channels." },
          { type: "li", text: "Webhook payloads received from third parties (Google Lead Forms, marketplace order hooks) are received over HTTPS and validated using HMAC signatures or shared secrets." },
          { type: "li", text: "Email transmission of Confidential data must use encrypted email (TLS-secured mail delivery). Sensitive data should not be transmitted via unencrypted email where avoidable." },
        ],
      },
      {
        number: "4", title: "Encryption at Rest",
        body: [
          { type: "li", text: "MongoDB Atlas encrypts all data at rest using AES-256. Encryption is managed by MongoDB and is applied automatically to all databases and backups." },
          { type: "li", text: "Wasabi object storage uses server-side encryption (AES-256) for all stored objects by default." },
          { type: "li", text: "Application servers store no persistent Confidential or Restricted data outside the encrypted database and storage services." },
          { type: "li", text: "Endpoint devices used to access Pythias production systems must enable full-disk encryption (BitLocker on Windows, FileVault on macOS)." },
          { type: "li", text: "Backup files (database snapshots) are encrypted by the hosting provider (MongoDB Atlas) and are not stored in unencrypted form on any Pythias-controlled storage." },
        ],
      },
      {
        number: "5", title: "Password & Secret Handling",
        body: [
          { type: "li", text: "User passwords are hashed with bcrypt (cost factor >= 12) before storage. Plaintext passwords are never stored, logged, or transmitted." },
          { type: "li", text: "Secrets (API keys, tokens, connection strings) are stored in environment variables or a secrets manager. They are excluded from version control." },
          { type: "li", text: "NEXTAUTH_SECRET and all signing secrets are generated with sufficient entropy (minimum 256-bit) and rotated annually." },
        ],
      },
      {
        number: "6", title: "Handling Requirements by Classification",
        body: [
          { type: "sub", text: "Restricted" },
          { type: "li", text: "Never log, print, or include in error messages." },
          { type: "li", text: "Never store in plaintext anywhere — only hashed (passwords) or in secured environment configuration (API keys)." },
          { type: "li", text: "Rotate at least annually or immediately upon suspected compromise." },
          { type: "sub", text: "Confidential" },
          { type: "li", text: "Encrypt in transit (TLS) and at rest (AES-256 via hosting providers)." },
          { type: "li", text: "Access limited to named individuals with documented business need." },
          { type: "li", text: "Deletion requests honored within 30 days." },
          { type: "sub", text: "Internal" },
          { type: "li", text: "Encrypt in transit. Do not share externally without authorization." },
          { type: "sub", text: "Public" },
          { type: "li", text: "Served over HTTPS. No additional encryption requirements." },
        ],
      },
      {
        number: "7", title: "Policy Review",
        body: [
          { type: "p", text: `This policy is reviewed annually (next review: ${REVIEW}) and updated when encryption standards, infrastructure providers, or applicable regulations change.` },
        ],
      },
    ],
  },

  {
    slug: "incident-response",
    title: "Incident Response Policy",
    subtitle: "Roles, Responsibilities & Communication Channels",
    filename: "pythias-incident-response-policy.pdf",
    effectiveDate: DATE,
    reviewDate: REVIEW,
    sections: [
      {
        number: "1", title: "Purpose & Scope",
        body: [
          { type: "p", text: "This policy establishes Pythias Technologies' procedures for detecting, reporting, containing, and recovering from security incidents. It defines roles, responsibilities, and communication channels to ensure an organized, timely response that minimizes impact on clients, data, and operations." },
          { type: "p", text: "This policy applies to all security incidents affecting Pythias systems, data, or personnel — including unauthorized access, data breaches, malware infections, service disruptions, and compromised credentials." },
        ],
      },
      {
        number: "2", title: "Incident Classification",
        body: [
          { type: "classification", label: "CRITICAL", text: "Active breach of Confidential or Restricted data; ransomware or destructive malware; full production service outage caused by an attack. Requires immediate response — 24/7." },
          { type: "classification", label: "HIGH", text: "Suspected unauthorized access to production systems; compromised admin credentials; significant data exposure. Response required within 4 hours." },
          { type: "classification", label: "MEDIUM", text: "Repeated failed authentication attempts suggesting brute force; suspicious API usage; non-production system compromise. Response within 24 hours." },
          { type: "classification", label: "LOW", text: "Policy violations, phishing attempts (not clicked), vulnerability discovery with no evidence of exploitation. Response within 72 hours." },
        ],
      },
      {
        number: "3", title: "Roles & Responsibilities",
        body: [
          { type: "sub", text: "Incident Commander — Company Owner" },
          { type: "li", text: "Declares and closes incidents." },
          { type: "li", text: "Makes containment decisions, including taking services offline." },
          { type: "li", text: "Approves all external communications (client notifications, legal referrals)." },
          { type: "li", text: "Coordinates with legal counsel if required." },
          { type: "sub", text: "Technical Lead — Senior Developer or Technical Staff" },
          { type: "li", text: "Performs technical investigation and containment actions." },
          { type: "li", text: "Identifies scope of impact and affected data." },
          { type: "li", text: "Implements fixes and validates remediation." },
          { type: "li", text: "Preserves evidence (logs, snapshots) without destroying artifacts." },
          { type: "sub", text: "All Employees & Contractors" },
          { type: "li", text: "Report any suspected incident immediately — do not investigate alone." },
          { type: "li", text: "Do not take unilateral containment actions beyond logging out of affected systems." },
          { type: "li", text: "Preserve evidence — do not delete files, logs, or emails related to the incident." },
        ],
      },
      {
        number: "4", title: "Response Phases",
        body: [
          { type: "sub", text: "Phase 1 — Detection & Reporting" },
          { type: "p", text: "Any person detecting an incident or anomaly reports it immediately to the Incident Commander via direct phone call or text. Email alone is insufficient for Critical/High incidents. The initial report should include: what was observed, when, on which system, and by whom." },
          { type: "sub", text: "Phase 2 — Assessment" },
          { type: "p", text: "The Technical Lead assesses the incident within the timeframe set by its classification. Assessment determines: type of incident, systems and data affected, whether the incident is ongoing, and initial severity classification." },
          { type: "sub", text: "Phase 3 — Containment" },
          { type: "li", text: "Isolate affected systems if active compromise is confirmed (revoke credentials, restrict network access, take service offline if necessary)." },
          { type: "li", text: "Preserve logs and system state before making changes." },
          { type: "li", text: "Block attack vectors (revoke compromised tokens, patch exploited vulnerabilities, ban attacking IPs)." },
          { type: "sub", text: "Phase 4 — Eradication" },
          { type: "li", text: "Remove malicious artifacts, unauthorized accounts, or compromised configurations." },
          { type: "li", text: "Rotate all potentially compromised credentials even if not yet confirmed as compromised." },
          { type: "li", text: "Verify that the root cause has been addressed." },
          { type: "sub", text: "Phase 5 — Recovery" },
          { type: "li", text: "Restore services from known-good state (backups, clean deployments)." },
          { type: "li", text: "Monitor closely for 48 hours post-recovery for signs of re-compromise." },
          { type: "li", text: "Incident Commander formally closes the incident once services are confirmed stable and secure." },
          { type: "sub", text: "Phase 6 — Post-Incident Review" },
          { type: "p", text: "A written post-incident review is completed within 14 days. It covers: timeline, root cause, impact, what went well, what to improve, and follow-up action items with owners and deadlines." },
        ],
      },
      {
        number: "5", title: "Communication Channels",
        body: [
          { type: "sub", text: "Internal reporting" },
          { type: "li", text: "Critical/High incidents: direct phone call to Incident Commander immediately." },
          { type: "li", text: "Medium/Low incidents: report via email to info@pythiastechnologies.com with \"SECURITY INCIDENT\" in the subject line, within 4 hours of discovery." },
          { type: "sub", text: "Client notification" },
          { type: "li", text: "Affected clients are notified within 72 hours of confirming a breach involving their data." },
          { type: "li", text: "Notifications include: nature of the incident, data categories potentially affected, steps taken, and guidance for clients to protect themselves." },
          { type: "li", text: "Notifications are sent from info@pythiastechnologies.com to the primary contact on file for each affected client." },
          { type: "sub", text: "External / legal" },
          { type: "li", text: "Legal counsel is engaged for any incident involving Confidential data of 50 or more individuals, or any regulatory notification obligation." },
          { type: "li", text: "Law enforcement is contacted at the Incident Commander's discretion for criminal incidents (extortion, unauthorized access)." },
        ],
      },
      {
        number: "6", title: "Evidence Preservation",
        body: [
          { type: "p", text: "During an incident, the following must be preserved and not modified: application logs, server access logs, authentication logs, network traffic captures (if available), and any files or database records involved in the incident. Logs are downloaded and stored in a secure, separate location as soon as an incident is declared. Evidence is retained for a minimum of 12 months post-incident or for the duration of any legal proceeding, whichever is longer." },
        ],
      },
      {
        number: "7", title: "Policy Review & Testing",
        body: [
          { type: "p", text: `This policy is reviewed annually (next review: ${REVIEW}). A tabletop exercise simulating a data breach or compromise scenario is conducted at least once per year to verify response readiness.` },
        ],
      },
    ],
  },

  {
    slug: "vulnerability-management",
    title: "Vulnerability & Threat Management Procedure",
    subtitle: "Identifying, Assessing, and Remediating Security Vulnerabilities",
    filename: "pythias-vulnerability-management-procedure.pdf",
    effectiveDate: DATE,
    reviewDate: REVIEW,
    sections: [
      {
        number: "1", title: "Purpose",
        body: [
          { type: "p", text: "This procedure defines how Pythias Technologies identifies, evaluates, prioritizes, and remediates security vulnerabilities in its software, infrastructure, and dependencies. The goal is to reduce the window of exposure between vulnerability disclosure and remediation." },
        ],
      },
      {
        number: "2", title: "Scope",
        body: [
          { type: "p", text: "This procedure applies to all Pythias production systems, including web applications, APIs, server infrastructure, third-party dependencies (npm packages, Node.js runtime, OS packages), and cloud service configurations." },
        ],
      },
      {
        number: "3", title: "Vulnerability Identification",
        body: [
          { type: "sub", text: "Automated dependency scanning" },
          { type: "li", text: "npm audit is run on all application packages before every production deployment and at least weekly in the automated build process." },
          { type: "li", text: "CVE alerts for key direct dependencies are monitored via GitHub Dependabot alerts or equivalent." },
          { type: "sub", text: "Infrastructure scanning" },
          { type: "li", text: "MongoDB Atlas security advisor recommendations are reviewed monthly." },
          { type: "li", text: "Server OS package vulnerability lists (via apt/yum security advisories) are reviewed monthly." },
          { type: "sub", text: "Manual and external discovery" },
          { type: "li", text: "Responsible disclosure: external researchers who identify vulnerabilities may report them to info@pythiastechnologies.com. Reports are acknowledged within 5 business days." },
          { type: "li", text: "Security-focused code review is performed for all changes to authentication, authorization, payment-adjacent, and data export functionality." },
        ],
      },
      {
        number: "4", title: "Risk Assessment & Prioritization",
        body: [
          { type: "p", text: "Each identified vulnerability is assessed for: CVSS score (where available), exploitability in Pythias' specific environment, data or service impact if exploited, and availability of a fix or mitigation." },
          { type: "classification", label: "CRITICAL", text: "CVSS 9.0+, or any vulnerability with a known public exploit and direct path to Pythias production data." },
          { type: "classification", label: "HIGH", text: "CVSS 7.0–8.9, or significant risk in the Pythias context even if CVSS is lower." },
          { type: "classification", label: "MEDIUM", text: "CVSS 4.0–6.9, limited exploitability, or mitigating controls already in place." },
          { type: "classification", label: "LOW", text: "CVSS < 4.0, theoretical risk, or requires extensive pre-conditions to exploit." },
        ],
      },
      {
        number: "5", title: "Remediation Timelines",
        body: [
          { type: "li", text: "Critical — patched or mitigated within 48 hours of confirmed identification." },
          { type: "li", text: "High — patched within 7 days." },
          { type: "li", text: "Medium — patched within 30 days." },
          { type: "li", text: "Low — patched within 90 days, or accepted and documented with rationale." },
          { type: "p", text: "If a patch is not available within the required timeline, a compensating control (WAF rule, network restriction, feature disable) must be implemented and documented until the patch is available." },
        ],
      },
      {
        number: "6", title: "Patch Management",
        body: [
          { type: "li", text: "All dependency patches are tested in a non-production environment before deployment to production." },
          { type: "li", text: "Emergency patches (Critical severity) may be deployed directly to production with post-deployment verification." },
          { type: "li", text: "All patches are deployed via version-controlled deployments — no ad-hoc manual changes to production." },
          { type: "li", text: "Patch deployment is logged with date, deployer, and the vulnerability addressed." },
        ],
      },
      {
        number: "7", title: "Tracking & Reporting",
        body: [
          { type: "li", text: "All identified vulnerabilities are tracked in an internal log with: discovery date, CVE or description, severity, affected component, assigned remediation owner, target date, and status." },
          { type: "li", text: "Open vulnerabilities older than their SLA deadline are escalated to the company owner." },
          { type: "li", text: "Vulnerability metrics (open count by severity, mean time to remediate) are reviewed quarterly." },
        ],
      },
      {
        number: "8", title: "Procedure Review",
        body: [
          { type: "p", text: `This procedure is reviewed annually (next review: ${REVIEW}) and updated following any significant vulnerability incident or major change to the technology stack.` },
        ],
      },
    ],
  },

  {
    slug: "personal-data-protection",
    title: "Internal Personal Data Protection Policy",
    subtitle: "How We Handle Personal Data Across All Operations",
    filename: "pythias-personal-data-protection-policy.pdf",
    effectiveDate: DATE,
    reviewDate: REVIEW,
    sections: [
      {
        number: "1", title: "Purpose & Scope",
        body: [
          { type: "p", text: "This policy governs the collection, use, storage, sharing, and disposal of personal data by Pythias Technologies, LLC in the course of its business operations. It applies to personal data relating to: clients and their representatives, end-customers of clients (order recipients), employees and contractors, website visitors, and sales leads." },
          { type: "p", text: "\"Personal data\" means any information that identifies or can reasonably identify a living individual — including names, email addresses, phone numbers, shipping addresses, IP addresses, and device identifiers." },
        ],
      },
      {
        number: "2", title: "Lawful Basis for Processing",
        body: [
          { type: "p", text: "Pythias processes personal data under one or more of the following lawful bases:" },
          { type: "li", text: "Contract — processing necessary to deliver the services contracted by clients (order fulfillment, shipping, marketplace sync)." },
          { type: "li", text: "Legitimate interests — analytics to improve service quality, fraud prevention, and security monitoring." },
          { type: "li", text: "Consent — marketing communications to website visitors and leads who have opted in." },
          { type: "li", text: "Legal obligation — retention of records required by applicable law (e.g., tax records, fraud dispute documentation)." },
        ],
      },
      {
        number: "3", title: "Data Minimization & Purpose Limitation",
        body: [
          { type: "li", text: "Personal data is collected only to the extent necessary for the stated purpose. Fields not required for the service are not collected or retained." },
          { type: "li", text: "Personal data collected for one purpose is not repurposed without a new lawful basis and, where required, new consent." },
          { type: "li", text: "End-customer order data (names, addresses) ingested for fulfillment purposes is used only for order processing, shipping, and fulfillment dispute resolution. It is not used for Pythias' own marketing." },
        ],
      },
      {
        number: "4", title: "Data Subject Rights",
        body: [
          { type: "p", text: "Individuals whose personal data Pythias holds have the following rights, exercised by contacting info@pythiastechnologies.com:" },
          { type: "li", text: "Right of access — to receive a copy of personal data held about them." },
          { type: "li", text: "Right to rectification — to correct inaccurate or incomplete data." },
          { type: "li", text: "Right to erasure — to request deletion of personal data, subject to legal retention requirements." },
          { type: "li", text: "Right to data portability — to receive data in a structured, machine-readable format." },
          { type: "li", text: "Right to object — to object to processing based on legitimate interests, including profiling." },
          { type: "li", text: "Right to withdraw consent — where processing is based on consent, to withdraw it at any time without penalty." },
          { type: "p", text: "All rights requests are acknowledged within 5 business days and fulfilled within 30 days." },
        ],
      },
      {
        number: "5", title: "Internal Handling Rules",
        body: [
          { type: "li", text: "Employees access personal data only when required for their job function. Personal curiosity is not a valid reason to access client or end-customer data." },
          { type: "li", text: "Personal data must not be shared via unencrypted email, personal messaging apps, or personal cloud storage." },
          { type: "li", text: "Personal data must not be stored on personal devices except in temporary, encrypted form strictly required for a specific task." },
          { type: "li", text: "Employees who discover accidental personal data exposure (e.g., data in a log file, sent to the wrong recipient) must report it immediately as a data incident." },
        ],
      },
      {
        number: "6", title: "Third-Party Data Sharing",
        body: [
          { type: "p", text: "Personal data is shared with third parties only as documented in the Data Protection Policy and only to the extent required for service delivery. Key third-party processors include MongoDB Atlas (storage), Wasabi (file storage), ShipStation (shipping fulfillment), marketplace platforms (order sync), and Google (analytics)." },
          { type: "p", text: "Pythias does not sell personal data. Pythias does not share personal data with third parties for their own marketing or profiling purposes." },
        ],
      },
      {
        number: "7", title: "Retention & Deletion",
        body: [
          { type: "p", text: "Personal data is retained only as long as necessary for the original purpose or as required by applicable law. Retention periods by category:" },
          { type: "li", text: "End-customer order data (names, addresses) — 3 years from fulfillment date." },
          { type: "li", text: "Client contact and account data — duration of client relationship plus 1 year." },
          { type: "li", text: "Lead/prospect data — up to 2 years from last interaction, or until opt-out." },
          { type: "li", text: "Employee/contractor data — duration of engagement plus 2 years for legal purposes." },
          { type: "li", text: "Website visitor analytics — 24 months (session-level), 14 months (Google Analytics)." },
          { type: "p", text: "Data is deleted securely upon expiry or request. Deletion is logged and confirmed." },
        ],
      },
      {
        number: "8", title: "Privacy by Design",
        body: [
          { type: "p", text: "When new features or integrations are developed, privacy impact is considered from the outset. New personal data fields are added only with explicit justification. Privacy settings default to the most protective option where feasible." },
        ],
      },
      {
        number: "9", title: "Policy Review",
        body: [
          { type: "p", text: `This policy is reviewed annually (next review: ${REVIEW}), or sooner if applicable law, product features, or data handling practices materially change.` },
        ],
      },
    ],
  },

  {
    slug: "data-deletion",
    title: "Data Deletion & End-of-Contract Policy",
    subtitle: "Customer Data Removal Upon Contract Termination",
    filename: "pythias-data-deletion-policy.pdf",
    effectiveDate: DATE,
    reviewDate: REVIEW,
    sections: [
      {
        number: "1", title: "Purpose",
        body: [
          { type: "p", text: "This policy confirms Pythias Technologies' commitment to deleting customer data at the end of a contractual relationship, and defines the process, timeline, scope, and verification method for doing so. Pythias does not retain customer data beyond what is required for legal compliance after a client relationship ends." },
        ],
      },
      {
        number: "2", title: "Definition of End of Contract",
        body: [
          { type: "p", text: "The contractual relationship ends when any of the following occur:" },
          { type: "li", text: "The client provides written notice of termination." },
          { type: "li", text: "The service subscription expires and is not renewed." },
          { type: "li", text: "Pythias terminates access due to non-payment or material breach." },
          { type: "li", text: "Mutual agreement to close the account." },
          { type: "p", text: "The termination date is the date the access is revoked or the subscription lapses, whichever is earlier." },
        ],
      },
      {
        number: "3", title: "Data Export Before Deletion",
        body: [
          { type: "p", text: "Prior to deletion, clients are offered a 30-day data export window. During this window:" },
          { type: "li", text: "The client may request an export of their account data (products, orders, design files, analytics) in a structured format." },
          { type: "li", text: "Exports are delivered via secure download link or encrypted file transfer." },
          { type: "li", text: "Pythias will not proactively delete data during the 30-day window unless the client requests early deletion." },
          { type: "p", text: "Clients who do not request an export within 30 days of termination waive their right to data recovery." },
        ],
      },
      {
        number: "4", title: "Deletion Scope",
        body: [
          { type: "p", text: "The following customer data will be deleted after the 30-day export window:" },
          { type: "li", text: "All product records, SKUs, design files, and listing data associated with the client account." },
          { type: "li", text: "All order and fulfillment records linked to the client." },
          { type: "li", text: "All client user accounts, credentials, and access tokens." },
          { type: "li", text: "All analytics and activity logs specific to the client." },
          { type: "li", text: "All uploaded files (design assets, images) stored in Pythias file storage." },
          { type: "p", text: "Retained post-deletion (for legal compliance only):" },
          { type: "li", text: "Anonymized billing/payment records required for tax and financial compliance (typically 7 years, per applicable law)." },
          { type: "li", text: "Aggregated, non-identifiable analytics (e.g., total order counts without client or customer identifiers)." },
          { type: "li", text: "Records required for pending legal disputes or regulatory investigations." },
        ],
      },
      {
        number: "5", title: "Deletion Timeline",
        body: [
          { type: "li", text: "Day 0 — Contract end date / access revocation." },
          { type: "li", text: "Days 1–30 — Data export window. Client may request export. Data remains intact." },
          { type: "li", text: "Day 31 — Deletion process initiated. Active deletion of all in-scope records from the production database and file storage." },
          { type: "li", text: "Day 38 — Deletion confirmed in MongoDB Atlas (backup retention means some copies persist in automated backups)." },
          { type: "li", text: "Day 45 — Atlas automated backups cycle through; all backup copies of deleted data are purged from the 7-day backup window." },
          { type: "li", text: "Day 46 — Deletion certification issued to client upon request." },
        ],
      },
      {
        number: "6", title: "Third-Party Data Destruction",
        body: [
          { type: "p", text: "Data stored in third-party processors on behalf of the client is handled as follows:" },
          { type: "li", text: "MongoDB Atlas — data deleted from live database within 31 days. Automated backups cycle and purge within 45 days." },
          { type: "li", text: "Wasabi file storage — all files associated with the client's account (designs, images) are permanently deleted within 31 days. Wasabi object deletion is immediate and irrecoverable." },
          { type: "li", text: "Pythias does not instruct ShipStation, marketplace APIs, or other platforms to delete data on the client's behalf — the client is responsible for managing their data within those platforms independently." },
        ],
      },
      {
        number: "7", title: "Deletion Certification",
        body: [
          { type: "p", text: "Upon completion of deletion (day 46 at the latest), Pythias will provide a written Deletion Certification to the client upon request. The certificate includes: client name, termination date, data categories deleted, deletion completion date, and a signature from the company owner." },
          { type: "p", text: "To request a deletion certificate, contact info@pythiastechnologies.com with subject line: \"Data Deletion Certificate Request — [Company Name]\"." },
        ],
      },
      {
        number: "8", title: "Early Deletion Requests",
        body: [
          { type: "p", text: "Clients may request immediate deletion before the 30-day window expires. Early deletion requests waive the export window. Once early deletion is initiated, data cannot be recovered. Early deletion is confirmed in writing before proceeding." },
        ],
      },
      {
        number: "9", title: "Policy Review",
        body: [
          { type: "p", text: `This policy is reviewed annually (next review: ${REVIEW}), or when changes in cloud infrastructure, backup technology, or legal retention requirements affect the deletion process.` },
        ],
      },
    ],
  },
];

export function getPolicy(slug) {
  return POLICIES.find((p) => p.slug === slug) ?? null;
}

export function getAllPolicySlugs() {
  return POLICIES.map((p) => p.slug);
}

export default POLICIES;
