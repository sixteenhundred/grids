/**
 * GRID Terms of Service — structured content.
 *
 * Rendered by /terms. Bracketed placeholders ([Legal Company Name],
 * [Insert Jurisdiction], etc.) must be completed with real legal details
 * before launch. Update TERMS_LAST_UPDATED / TERMS_EFFECTIVE when revising.
 */

export type TermsBlock = { type: "p"; text: string } | { type: "ul"; items: string[] };
export type TermsSection = { id: string; n: number; title: string; blocks: TermsBlock[] };

export const TERMS_LAST_UPDATED = "[Insert Date]";
export const TERMS_EFFECTIVE = "[Insert Date]";

export const TERMS_INTRO: TermsBlock[] = [
  {
    type: "p",
    text: "These Terms of Service (“Terms”) constitute a legally binding agreement between you (“User,” “you,” or “your”) and GRID [Legal Company Name] (“GRID,” “Company,” “we,” “us,” or “our”) governing your access to and use of the GRID platform, website, mobile application, software, tools, payment features, escrow-related features, messaging systems, AI features, project management features, business operations tools, creator tools, content storage systems, and any other products, services, or features made available by GRID from time to time (collectively, the “Platform”).",
  },
  {
    type: "p",
    text: "By accessing, registering for, using, browsing, submitting information to, creating an account on, entering into a transaction through, communicating through, or otherwise interacting with the Platform, you acknowledge that you have read, understood, and agreed to be legally bound by these Terms and any additional policies, guidelines, payment terms, community standards, privacy policies, product-specific terms, and supplemental agreements incorporated by reference.",
  },
];

export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: "platform-role",
    n: 1,
    title: "GRID’s Role as a Technology Platform",
    blocks: [
      { type: "p", text: "GRID is a technology platform designed to help businesses, creators, agencies, brands, freelancers, production professionals, and other users discover each other, communicate, manage projects, organize creative operations, facilitate payments, use AI-assisted tools, store and exchange content, and coordinate production workflows." },
      { type: "p", text: "GRID is not a party to any agreement, project, booking, contract, engagement, production, delivery, creative service, employment relationship, agency relationship, partnership, joint venture, fiduciary relationship, or professional relationship entered into between Users, except where GRID expressly enters into a separate written agreement signed by an authorized representative of GRID." },
      { type: "p", text: "GRID does not own, control, supervise, direct, manage, employ, represent, endorse, guarantee, insure, verify, or warrant any User, Creator, Business, Project, Service, Deliverable, Proposal, Portfolio, Listing, Production, Content, Contract, Payment, Expense, Statement, Representation, Review, Rating, AI Output, or User Generated Content available through or connected to the Platform." },
      { type: "p", text: "Users are independent parties. Creators are not employees, agents, contractors, representatives, partners, franchisees, or joint venturers of GRID. Businesses are not customers of GRID for purposes of receiving creative services from GRID unless expressly agreed in a separate written agreement. GRID provides software infrastructure only." },
      { type: "p", text: "GRID does not guarantee that any User will perform, pay, deliver, respond, cooperate, appear, attend, complete a project, comply with laws, satisfy professional standards, meet deadlines, provide accurate information, maintain availability, avoid cancellation, or act in good faith." },
    ],
  },
  {
    id: "no-guarantee",
    n: 2,
    title: "No Guarantee of Results",
    blocks: [
      { type: "p", text: "GRID may provide tools intended to improve creative production, hiring, project management, business operations, communication, pricing, payments, content planning, AI support, workflow management, and opportunity discovery. However, GRID does not guarantee any commercial, financial, creative, professional, operational, reputational, marketing, employment, business, audience, income, performance, conversion, ranking, exposure, engagement, or project outcome." },
      { type: "p", text: "You acknowledge and agree that all business decisions, hiring decisions, creative decisions, pricing decisions, contract decisions, payment decisions, production decisions, operational decisions, and publication decisions are made solely by you." },
      { type: "p", text: "GRID is not responsible for failed campaigns, missed opportunities, lost revenue, unsatisfactory creative output, poor communication between Users, reputational harm, low engagement, low conversion, missed deadlines, project failure, business interruption, or any other result arising from your use of the Platform." },
    ],
  },
  {
    id: "availability",
    n: 3,
    title: "Platform Availability, Downtime, and Technical Interruptions",
    blocks: [
      { type: "p", text: "GRID does not guarantee that the Platform will be uninterrupted, error-free, secure, timely, available, accurate, complete, or free from delays, outages, defects, data loss, cyberattacks, service interruptions, third-party failures, internet failures, software bugs, system overloads, payment delays, hosting failures, maintenance periods, API failures, AI system failures, notification failures, messaging failures, file upload failures, delivery failures, synchronization issues, or other technical problems." },
      { type: "p", text: "The Platform may be unavailable, limited, suspended, interrupted, delayed, modified, degraded, or terminated at any time due to scheduled maintenance, emergency maintenance, system updates, security measures, third-party service provider failures, internet connectivity issues, cloud infrastructure outages, payment processor issues, regulatory requirements, force majeure events, cyber incidents, software defects, operational decisions, or circumstances beyond GRID’s reasonable control." },
      { type: "p", text: "You agree that GRID shall not be liable for any damages, losses, claims, expenses, costs, disputes, missed deadlines, missed bookings, missed projects, failed communications, lost revenue, lost profits, lost business opportunities, reputational harm, production delays, client dissatisfaction, creator dissatisfaction, business interruption, data loss, or consequential harm resulting from Platform downtime, delays, interruptions, or errors." },
      { type: "p", text: "Users are solely responsible for maintaining independent backup methods, alternative communication channels, copies of important files, local records, calendar reminders, contract copies, payment records, production plans, client contact information, creator contact information, and emergency workflows outside the Platform where necessary." },
    ],
  },
  {
    id: "user-responsibility",
    n: 4,
    title: "User Responsibility",
    blocks: [
      { type: "p", text: "You are solely responsible for your conduct, decisions, communications, representations, commitments, contracts, payments, tax obligations, legal compliance, project performance, deliverables, uploaded content, profile information, portfolio materials, pricing, availability, credentials, reviews, disputes, and interactions with other Users." },
      { type: "p", text: "You agree not to rely solely on GRID for time-sensitive, mission-critical, safety-critical, legally required, financially critical, or business-critical operations without maintaining your own independent safeguards." },
      { type: "p", text: "You are responsible for verifying the identity, qualifications, licenses, insurance, experience, reliability, legality, availability, and suitability of any User before entering into any transaction, project, contract, or engagement." },
      { type: "p", text: "GRID may provide verification features, badges, ratings, reviews, match scores, pricing insights, AI recommendations, or other informational tools. These tools are provided for convenience only and do not constitute guarantees, endorsements, certifications, warranties, legal opinions, financial advice, hiring advice, production advice, or professional recommendations." },
    ],
  },
  {
    id: "user-contracts",
    n: 5,
    title: "User Agreements and Contracts Between Users",
    blocks: [
      { type: "p", text: "Users may enter into contracts, project agreements, statements of work, proposals, creative briefs, licensing agreements, usage agreements, production agreements, cancellation terms, revision terms, delivery terms, payment terms, intellectual property terms, confidentiality terms, and other arrangements between themselves." },
      { type: "p", text: "Unless GRID is expressly identified as a contracting party in a separate written agreement signed by GRID, GRID is not a party to such agreements and has no responsibility to enforce, interpret, mediate, guarantee, monitor, supervise, or perform obligations under such agreements." },
      { type: "p", text: "Any contract templates, AI-generated contract language, suggested clauses, project briefs, pricing suggestions, licensing suggestions, or legal-style documents made available through GRID are provided for informational and operational convenience only. GRID does not provide legal advice. Users are solely responsible for reviewing, approving, modifying, and obtaining professional legal review of any agreement before signing or relying on it." },
    ],
  },
  {
    id: "payments-escrow",
    n: 6,
    title: "Payments, Escrow, and Production Wallet",
    blocks: [
      { type: "p", text: "GRID may provide or integrate tools for payments, deposits, escrow-like workflows, milestone payments, upfront payments, production expense allocations, Production Wallet functionality, refunds, releases, holds, chargebacks, and transaction management." },
      { type: "p", text: "Payment services may be provided by third-party payment processors, financial institutions, escrow providers, banking partners, or infrastructure providers. GRID is not a bank, lender, money transmitter, insurer, financial advisor, investment advisor, broker, fiduciary, tax advisor, accounting provider, or licensed escrow provider unless expressly stated in writing and required by applicable law." },
      { type: "p", text: "Production Wallet funds are intended to support project-related expenses, such as rentals, locations, travel, props, equipment, talent, permits, logistics, or other production needs. GRID does not approve, supervise, audit, verify, guarantee, reimburse, insure, or take responsibility for how Users spend, request, allocate, document, or justify Production Wallet funds." },
      { type: "p", text: "Users are solely responsible for agreeing on:" },
      { type: "ul", items: ["the amount allocated to Production Wallet;", "when funds may be accessed;", "what expenses are permitted;", "what documentation is required;", "whether unused funds are refundable;", "who bears the risk of cancelled expenses;", "who owns rented or purchased materials;", "how disputes are resolved."] },
      { type: "p", text: "GRID may hold, delay, reverse, freeze, suspend, or restrict payments where required by law, payment processor rules, fraud monitoring, risk controls, chargeback risk, sanctions compliance, identity verification, suspicious activity, dispute processes, tax reporting obligations, platform policy violations, or operational necessity." },
      { type: "p", text: "GRID is not liable for payment delays, failed transfers, chargebacks, reversals, bank errors, card network rules, payment processor outages, account freezes, fraud investigations, currency conversion issues, tax withholding, user error, incorrect payment details, or third-party financial institution decisions." },
    ],
  },
  {
    id: "fees",
    n: 7,
    title: "Fees, Commissions, and Non-Circumvention",
    blocks: [
      { type: "p", text: "GRID may charge service fees, transaction fees, subscription fees, commission fees, listing fees, payment processing fees, withdrawal fees, premium feature fees, enterprise fees, advertising fees, or other fees disclosed on the Platform or in applicable order forms." },
      { type: "p", text: "Users agree not to use GRID to discover, contact, identify, solicit, negotiate with, or communicate with another User and then intentionally move the transaction, payment, booking, project, contract, or ongoing relationship outside GRID in order to avoid GRID fees." },
      { type: "p", text: "Unless otherwise permitted in writing by GRID, Users may not:" },
      { type: "ul", items: ["solicit off-platform payments;", "encourage another User to avoid GRID fees;", "exchange external payment instructions before a project is properly formed under GRID rules;", "misrepresent project value;", "split projects artificially to reduce fees;", "cancel on GRID and rebook externally;", "use GRID messaging to redirect transactions away from GRID."] },
      { type: "p", text: "Violation of this section may result in account suspension, permanent removal, fee recovery, liquidated damages where permitted by law, withholding of funds, cancellation of pending transactions, or legal action." },
    ],
  },
  {
    id: "ai-tools",
    n: 8,
    title: "AI Tools and Automated Features",
    blocks: [
      { type: "p", text: "GRID may provide AI-assisted tools, including but not limited to proposal generation, contract drafting assistance, shot list creation, campaign planning, brand analysis, pricing suggestions, match scoring, sales assistance, content planning, CRM assistance, opportunity discovery, project recommendations, creative briefs, business operations suggestions, and automated workflows." },
      { type: "p", text: "AI Outputs may be inaccurate, incomplete, outdated, biased, unsuitable, unlawful, commercially unreasonable, or inappropriate for your specific circumstances. AI Outputs are not legal advice, financial advice, tax advice, investment advice, employment advice, insurance advice, production advice, business advice, or professional advice." },
      { type: "p", text: "You are solely responsible for reviewing, validating, editing, approving, rejecting, and independently verifying all AI Outputs before use. GRID is not liable for decisions, contracts, communications, payments, campaigns, pricing, deliverables, negotiations, legal positions, business strategies, or losses resulting from your use of AI Outputs." },
      { type: "p", text: "You agree not to submit confidential, sensitive, regulated, unlawful, infringing, or third-party information into AI tools unless you have the legal right to do so." },
    ],
  },
  {
    id: "content",
    n: 9,
    title: "Content, Files, Portfolios, and User Generated Content",
    blocks: [
      { type: "p", text: "Users may upload, post, display, store, transmit, submit, share, license, deliver, or otherwise make available text, photos, videos, graphics, audio, project files, contracts, briefs, messages, portfolio materials, reviews, ratings, proposals, invoices, AI prompts, brand assets, and other materials through the Platform (“User Content”)." },
      { type: "p", text: "You retain ownership of your User Content, subject to the licenses granted in these Terms and any agreements you enter into with other Users." },
      { type: "p", text: "By uploading or submitting User Content to GRID, you grant GRID a worldwide, non-exclusive, royalty-free, sublicensable, transferable license to host, store, process, reproduce, display, transmit, adapt, modify, analyze, format, index, cache, distribute, and otherwise use such User Content as necessary to operate, improve, secure, market, support, and provide the Platform." },
      { type: "p", text: "You represent and warrant that:" },
      { type: "ul", items: ["you own or have all necessary rights to your User Content;", "your User Content does not infringe intellectual property rights, privacy rights, publicity rights, confidentiality obligations, contractual rights, or applicable laws;", "your User Content does not contain unlawful, defamatory, misleading, harmful, discriminatory, abusive, fraudulent, or prohibited material;", "you have obtained all necessary releases, permissions, licenses, consents, and clearances."] },
      { type: "p", text: "GRID may remove, restrict, disable, moderate, or refuse any User Content at any time if GRID believes it violates these Terms, applicable law, third-party rights, platform rules, payment processor rules, brand safety standards, or operational interests." },
      { type: "p", text: "GRID is not responsible for preserving User Content. Users are solely responsible for backing up their own files, deliverables, contracts, messages, invoices, payment records, and creative assets." },
    ],
  },
  {
    id: "ip",
    n: 10,
    title: "Intellectual Property Between Users",
    blocks: [
      { type: "p", text: "GRID does not automatically transfer ownership of creative work between Users. Ownership, licensing, usage rights, exclusivity, commercial rights, raw file access, editing rights, resale rights, portfolio rights, credit obligations, confidentiality, and publication rights must be agreed between the relevant Users." },
      { type: "p", text: "Unless expressly agreed otherwise between Users in writing:" },
      { type: "ul", items: ["Creators retain ownership of their pre-existing materials, tools, templates, methods, styles, presets, workflows, and intellectual property;", "Businesses receive only the rights expressly granted in the applicable project agreement;", "payment alone does not automatically grant unlimited ownership, raw files, sublicensing rights, resale rights, exclusivity, or perpetual global usage rights;", "GRID does not determine ownership disputes."] },
      { type: "p", text: "Users are solely responsible for defining intellectual property rights before project commencement." },
    ],
  },
  {
    id: "reviews",
    n: 11,
    title: "Reviews, Ratings, and Platform Reputation",
    blocks: [
      { type: "p", text: "GRID may allow Users to leave reviews, ratings, feedback, endorsements, complaints, comments, or other reputation-related content." },
      { type: "p", text: "Reviews must be truthful, lawful, relevant, and based on genuine experience. Users may not manipulate, fake, purchase, pressure, threaten, retaliate over, or artificially influence reviews." },
      { type: "p", text: "GRID may remove, restrict, hide, edit for formatting, investigate, or refuse reviews that violate platform rules or appear fraudulent, abusive, defamatory, irrelevant, discriminatory, extortionate, misleading, or unlawful." },
      { type: "p", text: "GRID does not guarantee the accuracy of reviews, ratings, badges, rankings, match scores, verification indicators, or platform reputation signals." },
    ],
  },
  {
    id: "disputes",
    n: 12,
    title: "Disputes Between Users",
    blocks: [
      { type: "p", text: "Users are solely responsible for resolving disputes with each other, including disputes related to quality, deadlines, revisions, cancellations, payments, refunds, expenses, intellectual property, licensing, conduct, communication, missed bookings, non-performance, project scope, and deliverables." },
      { type: "p", text: "GRID may, at its discretion, provide dispute tools, support workflows, mediation-style assistance, evidence collection, payment holds, refund recommendations, account restrictions, or platform decisions. GRID is not obligated to resolve disputes, act as an arbitrator, act as a court, enforce private agreements, provide legal conclusions, or guarantee any outcome." },
      { type: "p", text: "GRID may make platform-level decisions based on available evidence, internal policies, risk controls, payment processor rules, and operational judgment. Such decisions may include releasing funds, refunding funds, suspending accounts, limiting features, restricting withdrawals, or closing disputes." },
      { type: "p", text: "GRID’s involvement in a dispute does not make GRID a party to the underlying project, contract, or transaction." },
    ],
  },
  {
    id: "cancellations",
    n: 13,
    title: "Cancellations, Refunds, and Failed Projects",
    blocks: [
      { type: "p", text: "Cancellation and refund rights may depend on the project terms agreed between Users, GRID policies, payment processor rules, applicable law, and the specific circumstances of the project." },
      { type: "p", text: "GRID does not guarantee refunds, replacements, reshoots, revisions, alternative creators, alternative clients, compensation, reimbursement, or project completion." },
      { type: "p", text: "Unless expressly required by law or GRID policy, Users are not automatically entitled to refunds for dissatisfaction, delays, subjective creative disagreement, changed preferences, poor planning, failure to provide materials, lack of response, missed communications, cancellation by another User, or technical interruptions." },
    ],
  },
  {
    id: "prohibited",
    n: 14,
    title: "Prohibited Conduct",
    blocks: [
      { type: "p", text: "You agree not to:" },
      { type: "ul", items: ["violate any law, regulation, court order, intellectual property right, privacy right, or contractual obligation;", "use the Platform for fraud, deception, scams, money laundering, tax evasion, harassment, discrimination, exploitation, illegal services, or unlawful content;", "impersonate another person or entity;", "provide false, misleading, outdated, or incomplete information;", "interfere with Platform security, operations, infrastructure, APIs, networks, or software;", "scrape, copy, harvest, reverse engineer, overload, attack, or misuse the Platform;", "upload malware, viruses, harmful code, spyware, or malicious files;", "manipulate payments, reviews, rankings, algorithms, availability, pricing, or account systems;", "use GRID to facilitate off-platform circumvention;", "threaten, harass, abuse, discriminate against, exploit, or harm other Users;", "post or request unlawful, infringing, sexually exploitative, violent, hateful, discriminatory, or prohibited content;", "misuse AI tools or automated systems;", "use GRID in a way that creates legal, regulatory, financial, operational, reputational, or security risk for GRID."] },
      { type: "p", text: "GRID may investigate suspected violations and take any action GRID considers appropriate, including warnings, content removal, account suspension, payment holds, cancellation of projects, removal from search, reporting to authorities, or permanent termination." },
    ],
  },
  {
    id: "compliance",
    n: 15,
    title: "Compliance with Laws",
    blocks: [
      { type: "p", text: "Users are solely responsible for understanding and complying with all laws, regulations, licensing requirements, permits, insurance obligations, tax obligations, employment rules, labor laws, immigration laws, consumer protection laws, advertising laws, intellectual property laws, privacy laws, data protection laws, drone laws, filming permits, location permits, music licensing rules, model releases, union rules, industry regulations, and platform rules applicable to their activities." },
      { type: "p", text: "GRID does not guarantee that any User, project, location, production, service, deliverable, content, contract, AI Output, payment structure, or workflow complies with applicable law." },
    ],
  },
  {
    id: "taxes",
    n: 16,
    title: "Taxes",
    blocks: [
      { type: "p", text: "Users are solely responsible for determining, collecting, reporting, withholding, remitting, and paying all taxes, VAT, sales taxes, income taxes, payroll taxes, social contributions, duties, levies, and governmental charges associated with their use of GRID, transactions, earnings, expenses, purchases, and services." },
      { type: "p", text: "GRID may provide invoices, reports, payout records, tax forms, or transaction summaries for convenience, but GRID does not provide tax advice and does not guarantee the accuracy or sufficiency of any tax-related information for your circumstances." },
    ],
  },
  {
    id: "third-party",
    n: 17,
    title: "Third-Party Services",
    blocks: [
      { type: "p", text: "GRID may integrate with or rely on third-party services, including payment processors, hosting providers, cloud infrastructure providers, identity verification providers, analytics providers, AI providers, communication providers, mapping services, file storage providers, email providers, calendar providers, social media platforms, API providers, and other vendors." },
      { type: "p", text: "GRID is not responsible for third-party services, outages, errors, delays, data loss, policy changes, pricing changes, account restrictions, payment issues, API failures, security incidents, or terms imposed by third parties." },
      { type: "p", text: "Your use of third-party services may be subject to separate terms and policies." },
    ],
  },
  {
    id: "termination",
    n: 18,
    title: "Account Suspension and Termination",
    blocks: [
      { type: "p", text: "GRID may suspend, restrict, deactivate, or terminate your account or access to the Platform at any time, with or without notice, if GRID believes that:" },
      { type: "ul", items: ["you violated these Terms;", "you created risk or potential liability for GRID;", "your conduct harms other Users;", "your account is associated with fraud, abuse, illegality, chargebacks, sanctions risk, payment risk, security risk, or policy violations;", "your information is false, incomplete, or unverifiable;", "required by law, court order, regulator, payment processor, or operational necessity;", "continued access is not in GRID’s legitimate business interest."] },
      { type: "p", text: "GRID may preserve, delete, restrict, or disable access to account data and User Content following termination, subject to applicable law and internal policies." },
      { type: "p", text: "Termination does not relieve you of obligations incurred before termination, including payment obligations, fee obligations, indemnity obligations, dispute obligations, confidentiality obligations, intellectual property obligations, or liability for damages." },
    ],
  },
  {
    id: "warranties",
    n: 19,
    title: "Disclaimer of Warranties",
    blocks: [
      { type: "p", text: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE PLATFORM AND ALL GRID SERVICES, FEATURES, TOOLS, AI OUTPUTS, CONTENT, INFORMATION, RECOMMENDATIONS, PAYMENT FEATURES, ESCROW-RELATED FEATURES, PRODUCTION WALLET FEATURES, MATCHING FEATURES, RATINGS, REVIEWS, COMMUNICATION SYSTEMS, FILE STORAGE, AND BUSINESS TOOLS ARE PROVIDED “AS IS,” “AS AVAILABLE,” AND “WITH ALL FAULTS.”" },
      { type: "p", text: "GRID DISCLAIMS ALL WARRANTIES, EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, AVAILABILITY, RELIABILITY, SECURITY, QUIET ENJOYMENT, PROFESSIONAL QUALITY, BUSINESS PERFORMANCE, COURSE OF DEALING, AND COURSE OF PERFORMANCE." },
      { type: "p", text: "GRID DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, TIMELY, ACCURATE, COMPLETE, PROFITABLE, LAWFUL FOR YOUR PARTICULAR USE, COMPATIBLE WITH YOUR SYSTEMS, FREE FROM HARMFUL COMPONENTS, OR THAT DEFECTS WILL BE CORRECTED." },
    ],
  },
  {
    id: "liability",
    n: 20,
    title: "Limitation of Liability",
    blocks: [
      { type: "p", text: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, GRID, ITS AFFILIATES, DIRECTORS, OFFICERS, EMPLOYEES, CONTRACTORS, AGENTS, LICENSORS, SERVICE PROVIDERS, INVESTORS, SUCCESSORS, AND ASSIGNS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, PUNITIVE, ENHANCED, OR LOST-PROFIT DAMAGES, INCLUDING DAMAGES FOR LOST REVENUE, LOST PROFITS, LOST BUSINESS, LOST OPPORTUNITY, LOST BOOKINGS, LOST CLIENTS, LOST CREATORS, LOST DATA, LOST CONTENT, BUSINESS INTERRUPTION, PRODUCTION DELAYS, REPUTATIONAL HARM, EMOTIONAL DISTRESS, COST OF SUBSTITUTE SERVICES, FAILED CAMPAIGNS, MISSED DEADLINES, OR FAILURE TO ACHIEVE RESULTS, WHETHER BASED ON CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, WARRANTY, STATUTE, OR ANY OTHER LEGAL THEORY, EVEN IF GRID HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES." },
      { type: "p", text: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, GRID’S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS, THE PLATFORM, ANY TRANSACTION, ANY PROJECT, ANY USER CONDUCT, ANY PAYMENT, ANY ESCROW-RELATED FEATURE, ANY PRODUCTION WALLET FEATURE, ANY AI OUTPUT, ANY DOWNTIME, OR ANY DISPUTE SHALL NOT EXCEED THE GREATER OF: (A) THE TOTAL FEES PAID BY YOU TO GRID, EXCLUDING AMOUNTS PAID TO OTHER USERS, DURING THE THREE MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM; OR (B) EUR 100." },
      { type: "p", text: "THESE LIMITATIONS APPLY EVEN IF ANY LIMITED REMEDY FAILS OF ITS ESSENTIAL PURPOSE." },
      { type: "p", text: "Some jurisdictions do not allow certain exclusions or limitations of liability. In such jurisdictions, GRID’s liability shall be limited to the maximum extent permitted by applicable law." },
    ],
  },
  {
    id: "indemnification",
    n: 21,
    title: "Indemnification",
    blocks: [
      { type: "p", text: "You agree to defend, indemnify, and hold harmless GRID, its affiliates, directors, officers, employees, contractors, agents, licensors, service providers, investors, successors, and assigns from and against any claims, demands, actions, damages, losses, liabilities, settlements, penalties, fines, costs, and expenses, including reasonable attorneys’ fees, arising out of or related to:" },
      { type: "ul", items: ["your use or misuse of the Platform;", "your violation of these Terms;", "your violation of any law or third-party right;", "your User Content;", "your projects, services, deliverables, contracts, payments, expenses, or disputes;", "your interaction with another User;", "your tax obligations;", "your intellectual property infringement;", "your confidentiality breach;", "your fraud, negligence, misconduct, or misrepresentation;", "your use of AI Outputs;", "your off-platform conduct connected to GRID;", "any claim that GRID is responsible for your actions, omissions, services, or obligations."] },
      { type: "p", text: "GRID reserves the right to assume exclusive defense and control of any matter subject to indemnification, and you agree to cooperate with GRID’s defense." },
    ],
  },
  {
    id: "force-majeure",
    n: 22,
    title: "Force Majeure",
    blocks: [
      { type: "p", text: "GRID shall not be liable for delay, failure, interruption, non-performance, data loss, payment delay, Platform unavailability, or inability to provide services resulting from events beyond GRID’s reasonable control, including acts of God, natural disasters, war, terrorism, civil unrest, labor disputes, pandemics, epidemics, governmental action, regulatory changes, court orders, internet failures, hosting failures, cloud provider outages, payment processor failures, cyberattacks, denial-of-service attacks, power failures, telecommunications failures, third-party API failures, supply chain disruptions, emergency maintenance, or other events beyond GRID’s reasonable control." },
    ],
  },
  {
    id: "changes",
    n: 23,
    title: "Changes to the Platform and Terms",
    blocks: [
      { type: "p", text: "GRID may modify, suspend, discontinue, replace, limit, remove, or update any part of the Platform at any time, including features, pricing, fees, workflows, AI tools, payment systems, escrow-related features, Production Wallet features, messaging systems, search visibility, rankings, policies, and eligibility requirements." },
      { type: "p", text: "GRID may update these Terms from time to time. Updated Terms will become effective when posted, unless otherwise stated. Continued use of the Platform after updated Terms become effective constitutes acceptance of the updated Terms." },
      { type: "p", text: "If you do not agree to updated Terms, you must stop using the Platform." },
    ],
  },
  {
    id: "governing-law",
    n: 24,
    title: "Governing Law and Dispute Resolution",
    blocks: [
      { type: "p", text: "These Terms shall be governed by the laws of [Insert Jurisdiction], without regard to conflict of law principles." },
      { type: "p", text: "Before filing any claim, you agree to first contact GRID and attempt to resolve the dispute informally. If the dispute is not resolved within [30] days, the dispute shall be resolved through the courts or arbitration process specified by GRID in the applicable jurisdiction-specific terms." },
      { type: "p", text: "To the maximum extent permitted by law, claims must be brought individually and not as a plaintiff or class member in any class action, collective action, representative action, consolidated proceeding, or private attorney general action." },
      { type: "p", text: "Any claim arising out of or relating to the Platform or these Terms must be filed within one year after the claim arose, unless applicable law requires a longer period." },
    ],
  },
  {
    id: "severability",
    n: 25,
    title: "Severability",
    blocks: [
      { type: "p", text: "If any provision of these Terms is found unenforceable, invalid, or unlawful, that provision shall be limited or modified to the minimum extent necessary so that the remaining provisions remain in full force and effect." },
    ],
  },
  {
    id: "entire-agreement",
    n: 26,
    title: "Entire Agreement",
    blocks: [
      { type: "p", text: "These Terms, together with all incorporated policies and supplemental terms, constitute the entire agreement between you and GRID regarding the Platform and supersede all prior agreements, understandings, communications, proposals, and representations, whether oral or written." },
    ],
  },
  {
    id: "contact",
    n: 27,
    title: "Contact",
    blocks: [
      { type: "p", text: "For legal notices, contact:" },
      { type: "ul", items: ["GRID [Legal Company Name]", "[Legal Address]", "[Legal Email]", "[Company Registration Number]"] },
    ],
  },
];
