# Discover v3 Eval — Lean + gpt-4o

**Date:** 2026-05-21T22:39:09.067Z
**Model:** lean prompt + gpt-4o (production config)
**Cases:** 20 total | 10 profile-only | 10 with instruction

---

## High-Level Summary

| Group | Cases | Total Ideas | Avg Ideas/Case | Avg Duration | Errors |
|-------|-------|-------------|----------------|--------------|--------|
| Profile-only (no instruction) | 10 | 57 | 5.7 | 10.9s | 0 |
| With instruction | 10 | 53 | 5.3 | 9.7s | 0 |
| **All 20** | **20** | **110** | **5.5** | **10.3s** | **0** |

*Lower avg ideas/case = tighter quality gate (target: 4-6 per run). Higher is more likely padding.*

---

## Test Cases Reference

| ID | Group | Label | Instruction |
|----|-------|-------|-------------|
| P01 | no-instruction | Senior full-stack, indie hacker community — no instruction | (none) |
| P02 | no-instruction | ML engineer, funded startup, AI/ML community — no instruction | (none) |
| P03 | no-instruction | Student athlete / league organizer, strong coder — no instruction | (none) |
| P04 | no-instruction | B2B sales pro, knows SMBs, no coding — no instruction | (none) |
| P05 | no-instruction | UI/UX designer, design community, funded startup — no instruction | (none) |
| P06 | no-instruction | Twitch streamer + developer, creator communities — no instruction | (none) |
| P07 | no-instruction | Youth sports organizer, parent community — no instruction | (none) |
| P08 | no-instruction | Weak distribution, generic interests — no instruction (should penalize) | (none) |
| P09 | no-instruction | Broad consumer communities, no constraints — no instruction | (none) |
| P10 | no-instruction | No code, no budget, freelancer network — no instruction | (none) |
| I01 | with-instruction | Senior full-stack — target Shopify store owners specifically | I want to build something specifically for Shopify store own... |
| I02 | with-instruction | ML engineer, funded startup — no generic AI wrappers | I want ideas outside of generic AI wrappers - something with... |
| I03 | with-instruction | Student athlete — 3 intramural leagues, everything in spreadsheets | I run 3 intramural leagues and every single admin task is in... |
| I04 | with-instruction | B2B sales pro — no coding, fast monetization | No coding. Want something I can build or operate without dev... |
| I05 | with-instruction | UI/UX designer — real designer/PM workflow problem, not a portfolio tool | I want to build something that solves a real designer or PM ... |
| I06 | with-instruction | Twitch streamer — solo SaaS under $500/mo, prove market first | Wants solo SaaS under $500/mo to start. Prove the market bef... |
| I07 | with-instruction | Youth sports organizer — 6 leagues, scheduling/payments in spreadsheets | I coordinate 6 youth leagues. Scheduling, communications, pa... |
| I08 | with-instruction | Generic interests — fitness/gaming/productivity (should penalize) | I want to build a SaaS. Interested in fitness, gaming, and p... |
| I09 | with-instruction | Broad consumer communities — targeting dog owners specifically | I want to build something for dog owners specifically. I per... |
| I10 | with-instruction | No code, no budget — first $500 in 30 days | No code at all. No budget. Need to make my first $500 within... |

---
# Profile-Only: No Instruction

These 10 cases give the model only the founder profile — no direct niche input. Tests whether the model can identify strong opportunities from distribution + workflow signals alone.

| # | ID | Label | Ideas | Duration | Status |
|---|-----|-------|-------|----------|--------|
| 1 | P01 | Senior full-stack, indie hacker community — no instruction | 6 | 11.0s | OK |
| 2 | P02 | ML engineer, funded startup, AI/ML community — no instruction | 6 | 13.8s | OK |
| 3 | P03 | Student athlete / league organizer, strong coder — no instruction | 7 | 11.1s | OK |
| 4 | P04 | B2B sales pro, knows SMBs, no coding — no instruction | 6 | 11.2s | OK |
| 5 | P05 | UI/UX designer, design community, funded startup — no instruction | 6 | 8.8s | OK |
| 6 | P06 | Twitch streamer + developer, creator communities — no instruction | 4 | 10.6s | OK |
| 7 | P07 | Youth sports organizer, parent community — no instruction | 6 | 8.4s | OK |
| 8 | P08 | Weak distribution, generic interests — no instruction (should penalize) | 6 | 13.5s | OK |
| 9 | P09 | Broad consumer communities, no constraints — no instruction | 6 | 11.0s | OK |
| 10 | P10 | No code, no budget, freelancer network — no instruction | 4 | 9.7s | OK |

**Avg duration:** 10.9s | **Total ideas:** 57 | **Avg ideas/case:** 5.7

### Detailed Results

---
#### Case 1: [P01] Senior full-stack, indie hacker community — no instruction
**Duration:** 11.0s

**Input profile:**
```
Role: Software engineer
Skills / expertise: Full-stack development, React / Next.js, Backend development, SQL / database queries
Technical level: Full-stack / senior engineer
Communities / networks I have access to: Startup founders / indie hackers, Software developers / engineers, Small business owners
Goal: Build a profitable side project
Monetization preference: Subscriptions (recurring)
Preferred business type: Software / app
```
**Direct instruction:** (none)

**AI-parsed founder:** Role: Software engineer | Skills: Full-stack development, React / Next.js, Backend development, SQL / database queries | Communities: Startup founders / indie hackers, Software developers / engineers, Small business owners
**Search context:** Identifying startup opportunities for a senior full-stack engineer aiming to build a profitable side project with a subscription model preference.
**Total ideas generated:** 6

**Zone: Developer Tooling and Automation**
*Direct access to software developers and startup founders can be leveraged effectively. This founder can build tools that streamline development workflows, which are daily pain points for many developers.*

### CI/CD Pipeline Optimization Tool (score: 85)
> Automate complex CI/CD pipeline configurations for dev teams.
**Audience:** Development teams at small to medium startups.
**Wedge:** Simplified setup and integration for React/Next.js applications.
**Why you:** Deep technical knowledge in full-stack development.
**Why now:** Growing complexity in development workflows.
**Monetization:** $20/month per developer seat.
**First step:** Reach out to developer communities like Indie Hackers.
**Fit scores:** skill:9 dist:7 speed:8 money:8

### Database Query Optimization SaaS (score: 79)
> Optimize and automate complex SQL queries for better performance.
**Audience:** Software engineers and database administrators.
**Wedge:** Automated suggestions for SQL query improvements and performance reporting.
**Why you:** Proficient in SQL and database handling.
**Why now:** Increasing demand for efficient data handling due to big data proliferation.
**Monetization:** Subscription model at $50/month per company.
**First step:** Engage with database administration forums and LinkedIn groups.
**Fit scores:** skill:9 dist:6 speed:7 money:8

**Zone: Small Business Operational Tools**
*Through access to small business owners, operational tools can simplify business processes and save time, appealing to this accessible audience.*

### Automated Invoice Reconciliation Tool (score: 79)
> Automate invoice matching and reconciliation for small businesses.
**Audience:** Small business accountants and financial officers.
**Wedge:** Integrates seamlessly with existing financial tools like QuickBooks.
**Why you:** Access to small business owner communities.
**Why now:** Increased need for digital transformation in finance.
**Monetization:** $100/month per business.
**First step:** Reach out to small business forums and local business networks.
**Fit scores:** skill:7 dist:7 speed:6 money:7

### Customer Feedback Automation System (score: 78)
> Collect and analyze customer feedback automatically for small businesses.
**Audience:** Retail and service businesses.
**Wedge:** Automated feedback gathering with actionable insights.
**Why you:** Existing network among small business owners.
**Why now:** Businesses focus on customer-centric experiences.
**Monetization:** $30/month per location.
**First step:** Engage small business advisors and owners through local meetups.
**Fit scores:** skill:8 dist:6 speed:7 money:7

**Zone: Indie Hacker and Solo Developer Needs**
*Leveraging engagement with Indie Hackers to create niche, highly useful tools that indie developers and makers will value.*

### Micro-SaaS Launch Toolkit (score: 97)
> All-in-one tool to quickly deploy, monitor, and iterate on Micro-SaaS products.
**Audience:** Indie developers and solo founders launching small SaaS.
**Wedge:** Pre-built components and analytics tailored to Micro-SaaS needs.
**Why you:** Deep understanding of indie hacking community's needs and fast execution.
**Why now:** Rise in Micro-SaaS popularity due to simplicity and low startup costs.
**Monetization:** $10/month per project.
**First step:** Post prototype on Indie Hackers community for feedback.
**Fit scores:** skill:9 dist:8 speed:9 money:9

### Tech Conference Preparation Platform (score: 84)
> Streamline the process of preparing and applying for tech talks and conferences.
**Audience:** Developers and tech speakers aiming to increase exposure.
**Wedge:** Automates abstract submissions and organizes speaking opportunities.
**Why you:** Access to networks of developers interested in speaking engagements.
**Why now:** Growing tech conference market with new hybrid events.
**Monetization:** $15/month per user.
**First step:** Connect with active tech speakers and meetup organizers.
**Fit scores:** skill:8 dist:7 speed:8 money:7

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 2: [P02] ML engineer, funded startup, AI/ML community — no instruction
**Duration:** 13.8s

**Input profile:**
```
Role: Software engineer
Skills / expertise: Machine learning engineering, LLM / AI engineering, Python development, Data science / ML, Backend development
Technical level: Full-stack / senior engineer
Communities / networks I have access to: AI / ML practitioners, Software developers / engineers, Startup founders / indie hackers
Goal: Launch a funded startup
Monetization preference: Subscriptions (recurring)
Preferred business type: Software / app
```
**Direct instruction:** (none)

**AI-parsed founder:** Role: Software engineer | Skills: Machine learning engineering, LLM / AI engineering, Python development, Data science / ML | Communities: AI / ML practitioners, Software developers / engineers, Startup founders / indie hackers
**Search context:** Insightful opportunities for a software engineer with AI expertise to build a funded startup, with access to developer and AI communities.
**Total ideas generated:** 6

**Zone: AI-Driven B2B Platforms**
*Leverages the founder's AI expertise and connects with existing communities for targeted B2B applications.*

### AI-Powered Compliance Monitoring (score: 76)
> Automate compliance tracking for financial institutions with AI.
**Audience:** Compliance departments in financial institutions
**Wedge:** AI algorithms that automate complex data monitoring tasks.
**Why you:** Access to AI/ML communities and technical know-how for rapid prototyping.
**Why now:** Increasing regulations require more sophisticated compliance solutions.
**Monetization:** Annual subscriptions starting at $20,000 per institution.
**First step:** Contact compliance officers in financial networks like LinkedIn and relevant Slack channels.
**Fit scores:** skill:9 dist:6 speed:7 money:8

### Intelligent API Management Tools (score: 74)
> Use AI to optimize API performance and security in real-time.
**Audience:** DevOps teams in tech companies
**Wedge:** Machine learning optimizations for API performance and security risks.
**Why you:** AI expertise to build intelligent systems and community access for distribution.
**Why now:** Growth in digital transformation increasing API usage and security concerns.
**Monetization:** Monthly subscriptions at $300 per company.
**First step:** Engage with CTOs of tech startups in relevant AI/ML communities.
**Fit scores:** skill:8 dist:6 speed:7 money:8

**Zone: Developer Tools with AI Integration**
*Capitalizes on software development background and ML expertise for streamlined developer experiences.*

### AI Code Quality Analyzer (score: 78)
> A plugin to review and optimize code quality using AI.
**Audience:** Software development teams and tech leads
**Wedge:** AI-driven insights and suggestions for code improvements directly in IDEs.
**Why you:** Deep technical understanding of coding ecosystems and access to dev communities.
**Why now:** Increased demand for quality in software delivery pipelines.
**Monetization:** Freemium model with premium features at $20/month per developer.
**First step:** Share early prototypes with software engineering contacts on GitHub and in developer Slack communities.
**Fit scores:** skill:9 dist:7 speed:8 money:7

### Smart Feature Flag Manager (score: 80)
> AI-enhanced feature flag management system for smarter deployments.
**Audience:** DevOps teams and product managers
**Wedge:** Machine learning insights to predict deployment impacts before rollout.
**Why you:** Combines AI skills with direct access to potential users in tech scenes.
**Why now:** Fast deployment cycles require smarter feature management solutions.
**Monetization:** Tiered subscriptions starting at $200/month per organization.
**First step:** Engage with dev ops leaders in startup-focused online forums.
**Fit scores:** skill:9 dist:7 speed:8 money:8

**Zone: Data Science as a Service (DSaaS)**
*Aligns with the founder's data science skills and ability to build B2B solutions with scalable subscription models.*

### Automated Data Cleaning Platform (score: 74)
> An intelligent platform for automated data preprocessing and cleaning.
**Audience:** Data analysts and business intelligence teams
**Wedge:** Speed up data prepping with scalable AI-driven processes.
**Why you:** Expertise in data science to deliver high-impact MVPs quickly.
**Why now:** Business reliance on data-driven decisions continues to accelerate.
**Monetization:** Subscriptions starting at $500/month based on data volume.
**First step:** Reach out to data teams via LinkedIn and specialized data science groups.
**Fit scores:** skill:9 dist:5 speed:7 money:8

### Predictive Customer Insights (score: 80)
> Provide predictive analytics for customer behavior using AI.
**Audience:** Marketing and sales teams in medium to large enterprises
**Wedge:** Custom AI models to forecast customer trends and behaviors.
**Why you:** ML engineering expertise to build and customize predictive models quickly.
**Why now:** Shift towards data-driven strategies in competitive markets.
**Monetization:** Enterprise subscriptions starting at $2,000/month.
**First step:** Data-driven conferences and webinars to connect with enterprise marketers.
**Fit scores:** skill:9 dist:6 speed:8 money:8

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 3: [P03] Student athlete / league organizer, strong coder — no instruction
**Duration:** 11.1s

**Input profile:**
```
Role: Student, Software engineer
Skills / expertise: Full-stack development, React / Next.js, Backend development, Community management
Technical level: Strong developer
Communities / networks I have access to: Student athletes, Local sports leagues / intramurals, Youth sports parents & coaches, College students / campus life
Goal: Build a profitable side project
Monetization preference: Subscriptions (recurring)
Preferred business type: Software / app
```
**Direct instruction:** (none)

**AI-parsed founder:** Role: Student, Software engineer | Skills: Full-stack development, React / Next.js, Backend development, Community management | Communities: Student athletes, Local sports leagues / intramurals, Youth sports parents & coaches
**Search context:** The focus is on building a profitable side project leveraging the founder's technical abilities and community connections in sports and student life.
**Total ideas generated:** 7

**Zone: Sports Team Management and Optimization**
*Access to student athletes, local sports leagues, and youth sports parents gives a unique advantage in addressing organizational needs in sports.*

### LeagueHub (score: 86)
> A management tool for local sports leagues to optimize schedules and communications.
**Audience:** Local sports league organizers
**Wedge:** Streamlines scheduling and communication to save time and reduce errors.
**Why you:** Direct access to networks of local sports leagues and understanding of their needs.
**Why now:** An increasing number of leagues seek digital transformation for efficiency.
**Monetization:** Monthly subscription per league or team, $20-50 depending on size.
**First step:** Contact local sports league coordinators
**Fit scores:** skill:9 dist:8 speed:8 money:7

### YouthCoachConnect (score: 80)
> A platform connecting youth sports coaches with resources and training modules.
**Audience:** Youth sports coaches and clubs
**Wedge:** Provides exclusive resources and a community platform for ongoing development.
**Why you:** Existing interactions with youth sports coaches and parents.
**Why now:** Growing demand for quality youth coaching amidst increasing sports participation.
**Monetization:** Subscription model for premium content and community access, $10/month per coach.
**First step:** Engage with coaches through existing networks
**Fit scores:** skill:8 dist:7 speed:7 money:7

**Zone: College Campus Life Enhancement**
*Existing connection to college students allows exploration of tools to enhance campus experience.*

### CampusInsight (score: 80)
> A tool for optimizing student events and community building on campus.
**Audience:** University student unions and event planners
**Wedge:** Provides data-driven insights to increase event turnout and engagement.
**Why you:** Active participation and understanding of campus life dynamics.
**Why now:** Increased focus on improving student satisfaction and retention.
**Monetization:** Contract-based pricing with campus organizations, $100-500/month.
**First step:** Interview student union representatives
**Fit scores:** skill:8 dist:7 speed:7 money:7

### DormBuddy (score: 81)
> A platform to facilitate dormitory exchange and community engagement.
**Audience:** College dormitory residents
**Wedge:** Simplifies room swaps and enhances dorm community interaction.
**Why you:** Experience with the college living environment and student needs.
**Why now:** Increased focus on enhancing student life and community within campuses.
**Monetization:** Freemium model with premium community features, $5/month per student.
**First step:** Engage with dorm residents through student housing offices
**Fit scores:** skill:8 dist:8 speed:7 money:6

**Zone: Youth Sports Analytics**
*Technical skills can be leveraged to develop analytics tools to improve youth sports training efficacy.*

### PlayAnalyser (score: 82)
> AI-powered analytics for youth sports performance improvement.
**Audience:** Youth sports teams and coaches
**Wedge:** Uses video analysis to provide actionable performance insights for training.
**Why you:** Familiarity with youth sports settings and technical capability for development.
**Why now:** Growing interest in performance analytics at all sports levels.
**Monetization:** Subscription for teams, starting at $50/month for small teams.
**First step:** Collaborate with local youth sports teams for pilot testing
**Fit scores:** skill:9 dist:7 speed:6 money:7

### FitTrack Jr. (score: 83)
> Wearable tech integration for tracking youth athlete training progress.
**Audience:** Youth sports parents and coaches
**Wedge:** Combines wearable data with training regimen for enhanced performance tracking.
**Why you:** Existing network access and technical know-how.
**Why now:** Increasing use of fitness technology and desire for comprehensive training data.
**Monetization:** Device sales with optional subscription for advanced data, $100/device plus $10/month.
**First step:** Engage with sports parents and coaches via existing networks
**Fit scores:** skill:9 dist:8 speed:6 money:6

**Zone: Local Sports League Administration**
*Access to and understanding of local sports environments allows targeted administrative solutions.*

### RefereeConnect (score: 81)
> A platform connecting certified referees with local sports events that need officiating.
**Audience:** Local sports leagues
**Wedge:** Solves shortage and scheduling issues by streamlining referee hiring.
**Why you:** Direct connections to local sports entities needing officiating solutions.
**Why now:** Consistent demand for officiating amidst expanding sports leagues.
**Monetization:** Commission per match booked, $10-20 depending on match scale.
**First step:** Reach out to local leagues and referee associations
**Fit scores:** skill:8 dist:8 speed:7 money:7

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 4: [P04] B2B sales pro, knows SMBs, no coding — no instruction
**Duration:** 11.2s

**Input profile:**
```
Role: Non-technical founder
Skills / expertise: B2B enterprise sales, Outbound / cold outreach, Account management, CRM management (HubSpot, Salesforce), Business development
Technical level: Little to none
Communities / networks I have access to: Small business owners, Sales professionals, Freelancers / consultants
Goal: Build a profitable side project
Monetization preference: Subscriptions (recurring)
Preferred business type: Service business, Software / app
```
**Direct instruction:** (none)

**AI-parsed founder:** Role: Non-technical founder | Skills: B2B enterprise sales, Outbound / cold outreach, Account management, CRM management (HubSpot, Salesforce) | Communities: Small business owners, Sales professionals, Freelancers / consultants
**Search context:** This founder is best positioned to execute opportunities grounded in sales process optimization, freelancer business tools, and small business customer management due to their B2B sales expertise, CRM knowledge, and access to communities such as small business owners, sales professionals, and freelancers.
**Total ideas generated:** 6

**Zone: Sales Process Optimization Tools**
*The founder's expertise in sales and CRM systems, combined with access to sales professionals, makes this zone ideal for developing tools that streamline sales operations.*

### Outbound Outreach Automation (score: 79)
> A tool to automate and optimize cold outreach for B2B sales teams.
**Audience:** Sales professionals and small sales teams
**Wedge:** Automates repetitive outreach tasks and integrates with existing CRM systems to enhance efficiency.
**Why you:** Deep experience in B2B sales and existing connections with sales professionals.
**Why now:** Increasing need for efficiency in sales processes amidst rising competition.
**Monetization:** Subscription model at $50/month per user.
**First step:** Interview sales professionals in existing network to identify pain points.
**Fit scores:** skill:9 dist:7 speed:6 money:9

### CRM Cleanup and Enhancement (score: 77)
> A service that cleans and enhances CRM data for improved performance.
**Audience:** Small business owners using CRM systems like HubSpot or Salesforce
**Wedge:** Customized data cleaning to improve CRM utility and system efficiency.
**Why you:** Experience with CRM systems and access to small business networks.
**Why now:** CRMs are becoming data-heavy, leading to inefficiency without regular maintenance.
**Monetization:** Monthly subscription service starting at $100/month.
**First step:** Reach out to small business owners through existing networks to gauge interest.
**Fit scores:** skill:8 dist:8 speed:7 money:8

**Zone: Freelancer Business Tools**
*The founder’s access to freelancers and experience in business development can be leveraged to create tools improving freelancer operations.*

### Freelancer Proposal Generator (score: 74)
> A tool to create and track proposals effectively tailored for freelancers.
**Audience:** Freelancers and consultants
**Wedge:** Automates proposal creation and integrates tracking for feedback loops.
**Why you:** Existing relationships with freelancers.
**Why now:** Freelancers need efficient tools to remain competitive in a saturated market.
**Monetization:** $30/month subscription.
**First step:** Conduct interviews with freelancers to validate demand and features.
**Fit scores:** skill:8 dist:6 speed:7 money:8

### Contract Automation Platform (score: 68)
> An easy-to-use platform for freelancers to manage and automate their contracts.
**Audience:** Freelancers
**Wedge:** Simplifies the contracting process with automation features, reducing manual work.
**Why you:** Access and understanding of freelance market challenges.
**Why now:** Rise in freelance work and the need for streamlined onboarding and management.
**Monetization:** Tiered subscription model starting at $20/month.
**First step:** Engage with freelancer networks to test the concept.
**Fit scores:** skill:7 dist:6 speed:6 money:7

**Zone: Small Business Customer Management**
*Utilize founder's CRM management experience to build tools for small business customer relationship management.*

### Simple Client Tracker (score: 70)
> A lightweight tool for small businesses to track client interactions without a full CRM.
**Audience:** Small business owners
**Wedge:** Offers essential CRM features in an accessible and affordable package.
**Why you:** Understanding of CRM complexities and access to small business networks.
**Why now:** As small businesses digitize, there is more focus on manageable solutions for client tracking.
**Monetization:** $15/month subscription fee.
**First step:** Survey small business owners for interest and feature needs.
**Fit scores:** skill:7 dist:7 speed:6 money:8

### Customer Feedback Collector (score: 68)
> A tool for collecting, analyzing, and responding to customer feedback efficiently.
**Audience:** Small service-based businesses
**Wedge:** Simplifies feedback collection and provides actionable insights.
**Why you:** Experience in service-related client interactions and feedback management.
**Why now:** Increasing importance on customer feedback in an evolving market.
**Monetization:** Subscription model starting at $25/month.
**First step:** Reach out to small service businesses for feature validation.
**Fit scores:** skill:7 dist:7 speed:7 money:7

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 5: [P05] UI/UX designer, design community, funded startup — no instruction
**Duration:** 8.8s

**Input profile:**
```
Role: Designer
Skills / expertise: UI / UX design, Product design, Figma / prototyping, UX research, Design systems
Technical level: Just getting started
Communities / networks I have access to: UX / UI designers, Product managers, Startup founders / indie hackers, Software developers / engineers
Goal: Launch a funded startup
Monetization preference: Subscriptions (recurring)
Preferred business type: Software / app
```
**Direct instruction:** (none)

**AI-parsed founder:** Role: Designer | Skills: UI / UX design, Product design, Figma / prototyping, UX research | Communities: UX / UI designers, Product managers, Startup founders / indie hackers
**Search context:** The goal is to launch a funded startup with a focus on software/apps. The founder's strong suit lies in design, offering natural avenues through design tools and collaboration, but the key is leveraging communities where they hold influence.
**Total ideas generated:** 6

**Zone: UX Design Collaboration Tools**
*Intimate understanding of UX design needs and access to design communities.*

### Real-Time Design Feedback Platform (score: 77)
> A platform enabling seamless real-time feedback during design reviews.
**Audience:** UI/UX design teams and design agencies
**Wedge:** Live collaboration with annotated feedback directly on designs.
**Why you:** Expert in design workflows with strong UI/UX community access.
**Why now:** Increasing remote work demands better collaboration tools.
**Monetization:** Subscription model for teams from $29/month
**First step:** Engage UI/UX designers on LinkedIn groups.
**Fit scores:** skill:9 dist:7 speed:6 money:8

### Design System Management SaaS (score: 77)
> A cloud-based tool for managing and updating design systems collaboratively.
**Audience:** Product designers, design system managers
**Wedge:** Centralizes design system updates with team-wide visibility.
**Why you:** Deep knowledge in design systems and strong network.
**Why now:** Rising trend in design system implementation across companies.
**Monetization:** Tiered subscription fees based on team size and features from $49/month
**First step:** Discuss with product design managers in Slack channels like Designer Hangout.
**Fit scores:** skill:9 dist:7 speed:6 money:8

**Zone: Product Management Automation**
*Connection with product managers and UX research experience.*

### AI-Powered User Persona Generator (score: 68)
> Automate the creation of user personas using AI and user data.
**Audience:** Product managers, UX researchers
**Wedge:** Generates data-driven personas from existing user data.
**Why you:** Background in UX research and product design insights.
**Why now:** Immediate need for data-driven insights due to AI adoption.
**Monetization:** Subscription plans starting at $19/month
**First step:** Engage with product managers in online forums like Product Coalition.
**Fit scores:** skill:8 dist:6 speed:5 money:7

### Feature Prioritization Dashboard (score: 68)
> A tool to prioritize features based on user feedback and analytics.
**Audience:** Product teams in technology companies
**Wedge:** Consolidates real user insights for prioritized feature roll-out.
**Why you:** Experience with product workflows and design research data.
**Why now:** Increasing need for data-driven decision-making tools.
**Monetization:** Team-based subscriptions from $99/month
**First step:** Validate interest in product management communities on LinkedIn.
**Fit scores:** skill:8 dist:6 speed:5 money:7

**Zone: Indie Hacker Tools**
*Active participation in indie hacker and startup founder communities.*

### Lean Design Audit Tool (score: 71)
> On-demand design audits for indie hackers to improve UX and UI.
**Audience:** Indie hackers and early-stage startup founders
**Wedge:** Quick, affordable UX audits without full-scale research.
**Why you:** Access to startup founder networks and expertise in UX design.
**Why now:** Increase in indie development requiring rapid UX iterations.
**Monetization:** Pay-per-audit or subscription model starting at $49/one-off audit
**First step:** Promote in indie hacker forums and Slack groups.
**Fit scores:** skill:8 dist:7 speed:6 money:7

### UX Feedback In a Click (score: 71)
> Get real users to provide UX feedback with a simple URL share.
**Audience:** Solo developers and indie hackers
**Wedge:** Effortless feedback collection mechanism directly from target users.
**Why you:** Connected to indie developers seeking inexpensive UX improvements.
**Why now:** Demand for fast, user-centric design validation for solo projects.
**Monetization:** Subscription model for frequency and depth of feedback from $9/month
**First step:** Contact indie developers in communities like Indie Hackers.
**Fit scores:** skill:8 dist:7 speed:6 money:7

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 6: [P06] Twitch streamer + developer, creator communities — no instruction
**Duration:** 10.6s

**Input profile:**
```
Role: Software engineer
Skills / expertise: Full-stack development, React / Next.js, Community management, Content creation
Technical level: Strong developer
Communities / networks I have access to: Streamers (Twitch / Kick), YouTubers / video creators, Discord / online communities, TikTok creators
Goal: Build a profitable side project
Monetization preference: Subscriptions (recurring), Free + paid tier (freemium)
Preferred business type: Software / app
```
**Direct instruction:** (none)

**AI-parsed founder:** Role: Software engineer | Skills: Full-stack development, React / Next.js, Community management, Content creation | Communities: Streamers (Twitch / Kick), YouTubers / video creators, Discord / online communities
**Search context:** This founder is a software engineer with strong skills in full-stack development, specifically React/Next.js. They are well-positioned within the streaming and content creator communities, possessing experience in community management and content creation. Their goal is to build a profitable side project, preferring a software/app business with subscription or freemium models.
**Total ideas generated:** 4

**Zone: Creator Economy Tools**
*The founder has access and credibility in communities of streamers and content creators who often need tools to enhance productivity and engagement.*

### Streamline (score: 75)
> Task automation tool for streamers to manage overlays and alerts seamlessly.
**Audience:** Twitch and Kick streamers
**Wedge:** Automate the repetitive tasks of managing stream overlays and alerts, integrating with popular streaming software.
**Why you:** Direct access to streamers who can provide immediate insights and testing.
**Why now:** Growing complexity of streaming needs creating demand for automation.
**Monetization:** Freemium model with $10/month for premium features like advanced customization.
**First step:** Connect with 10 streamers in personal network for feedback and pilot use.
**Fit scores:** skill:9 dist:8 speed:7 money:8

### ClipPro (score: 70)
> AI-powered tool for creators to auto-generate and optimize short video clips for social media.
**Audience:** YouTubers, TikTok creators, video bloggers
**Wedge:** Leverage AI to create and suggest the best moments for short clips from longer content.
**Why you:** Connections in video creation communities allow targeted outreach and feedback.
**Why now:** Increased demand for short-form content across platforms.
**Monetization:** Subscription of $15/month with a tiered model based on output volume.
**First step:** Gather feedback from 5 YouTube and TikTok creators contacted via personal Discord channel.
**Fit scores:** skill:8 dist:7 speed:6 money:7

**Zone: Community Engagement Platforms**
*Given the founder's experience in managing online communities, tools that enhance engagement within these spaces are a natural fit.*

### Discord Engagement Booster (score: 75)
> Tool to gamify and reward community participation in Discord servers.
**Audience:** Discord community managers
**Wedge:** Offer customizable templates to introduce gamification elements like points, badges, and leaderboards.
**Why you:** Deep understanding of Discord community dynamics from personal management experience.
**Why now:** Demand for increased community activities and engagement drives interest.
**Monetization:** Subscription model starting at $20/month, with premium integrations at higher tiers.
**First step:** Run a pilot with a known Discord community to test engagement improvements.
**Fit scores:** skill:9 dist:8 speed:7 money:8

**Zone: Content Creator Revenue Optimization**
*Content creators are seeking new revenue streams and efficient monetization strategies, aligning with the founder's goal of creating a profitable subscription model.*

### CreatorBi (score: 70)
> Analytics and insights platform to optimize revenue streams for content creators across multiple platforms.
**Audience:** YouTubers, Twitch streamers, digital content creators
**Wedge:** Centralize data from all creator platforms to provide actionable insights for maximizing earnings.
**Why you:** Strong developer skills to handle data aggregation and visualization effectively.
**Why now:** Creators increasingly seeking diversified income sources with sharper insights into performance.
**Monetization:** Freemium with $25/month for advanced analytics and strategy recommendations.
**First step:** Interview 10 creators from different platforms about their monetization challenges.
**Fit scores:** skill:8 dist:7 speed:6 money:7

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 7: [P07] Youth sports organizer, parent community — no instruction
**Duration:** 8.4s

**Input profile:**
```
Role: Non-technical founder
Skills / expertise: Event operations / coordination, Community management, Sports coaching, Project management
Technical level: Little to none
Communities / networks I have access to: Youth sports parents & coaches, Local sports leagues / intramurals, Parents of young children, Parents of teens / student athletes
Goal: Build a profitable side project
Monetization preference: Subscriptions (recurring)
Preferred business type: Software / app, Service business
```
**Direct instruction:** (none)

**AI-parsed founder:** Role: Non-technical founder | Skills: Event operations / coordination, Community management, Sports coaching, Project management | Communities: Youth sports parents & coaches, Local sports leagues / intramurals, Parents of young children
**Search context:** The founder's experience and network in youth sports and event coordination create opportunities for SaaS solutions targeting these areas. Distribution advantages stem from existing ties in local sports communities.
**Total ideas generated:** 6

**Zone: Youth Sports Management**
*The founder has strong connections in youth sports, providing a solid starting point for reaching customers.*

### Youth Sports Scheduling Platform (score: 81)
> Simplifying event and game scheduling for youth sports leagues.
**Audience:** Youth sports league organizers and coaches
**Wedge:** Eliminates schedule conflicts and reduces manual coordination efforts.
**Why you:** Direct ties with local sports leagues, providing immediate access for validation.
**Why now:** Increased complexity in league scheduling with growing participation.
**Monetization:** Monthly subscription for leagues ($50-$100 based on league size)
**First step:** Contact local leagues to get feedback on scheduling pain points.
**Fit scores:** skill:8 dist:7 speed:6 money:8

### Parent-Coach Communication Hub (score: 88)
> Streamlining communication between sports coaches and parents.
**Audience:** Youth sports coaches and parents
**Wedge:** Facilitates centralized communication reducing missed updates.
**Why you:** Access to both parents and coaches enables quick feedback collection.
**Why now:** Rising demands for real-time updates and organized communication.
**Monetization:** $5/month per team for a premium tier with alerts and file sharing.
**First step:** Survey coaches and parents on existing communication frustrations.
**Fit scores:** skill:9 dist:8 speed:7 money:7

**Zone: Event Coordination Tools**
*Experience in event coordination can be leveraged to improve tools for event organizers.*

### Event Task Management Tool (score: 78)
> A tool for automating repetitive event planning tasks.
**Audience:** Event coordinators and project managers
**Wedge:** Automates checklist creation and follow-up alerts.
**Why you:** Background in event coordination makes for a credible advocate for product value.
**Why now:** Increased demand for efficiency in event planning post-pandemic.
**Monetization:** Subscription model at $20/month per organizer.
**First step:** Reach out to event coordinators for feedback on pain points.
**Fit scores:** skill:7 dist:6 speed:6 money:7

### Event Volunteer Management System (score: 84)
> Simplifying the recruitment and management of event volunteers.
**Audience:** Event organizers and nonprofit managers
**Wedge:** Reduces manual tracking and communication overhead.
**Why you:** Direct experience managing volunteers during events.
**Why now:** Growing industry demands for efficient volunteer operations.
**Monetization:** Annual subscription for event organizations ($100/year).
**First step:** Discuss needs with past event contacts to validate assumptions.
**Fit scores:** skill:8 dist:7 speed:6 money:7

**Zone: Sports Coaching Tools**
*Intimate knowledge of sports coaching needs allows the founder to address specific operational pains.*

### Athlete Performance Tracking App (score: 80)
> Helping coaches measure and analyze athlete performance smoothly.
**Audience:** Sports coaches and trainers
**Wedge:** Streamlines data entry and real-time performance insights.
**Why you:** Strong connections with coaches for easy access to validation phase.
**Why now:** Increased focus on data-driven training methods.
**Monetization:** $10/month per team or school for full analytics suite.
**First step:** Engage directly with local coaches to gather insights on current tracking methods.
**Fit scores:** skill:7 dist:7 speed:5 money:7

### Virtual Coaching Assistant (score: 83)
> A digital tool to assist coaches with training drills and session planning.
**Audience:** Youth sports coaches
**Wedge:** Offers pre-made, customizable training plans.
**Why you:** Experience in sports coaching informs practical tool features.
**Why now:** Rising popularity of virtual and hybrid coaching methods.
**Monetization:** $15/month subscription for ongoing access to new drills and plans.
**First step:** Conduct interviews with coaches for insights on training session planning.
**Fit scores:** skill:8 dist:7 speed:5 money:8

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 8: [P08] Weak distribution, generic interests — no instruction (should penalize)
**Duration:** 13.5s

**Input profile:**
```
Role: Software engineer
Skills / expertise: Full-stack development, React / Next.js
Technical level: Strong developer
Goal: Build a profitable side project
Monetization preference: Subscriptions (recurring)
Preferred business type: Software / app
```
**Direct instruction:** (none)

**AI-parsed founder:** Role: Software engineer | Skills: Full-stack development, React, Next.js | Communities: 
**Search context:** Software engineer with full-stack development expertise looking to build a profitable side project focusing on subscription-based software solutions.
**Total ideas generated:** 6

**Zone: B2B Workflow Enhancements**
*Competence in full-stack development allows for the creation of tools that improve business workflows. This is well-matched for building profitable recurring revenue products with low acquisition cost.*

### Automated Client Onboarding Tool (score: 82)
> Streamline client onboarding processes for small to medium enterprises.
**Audience:** Consulting firms and agencies with multiple clients
**Wedge:** Drastically reduces time spent on manual client setup and management.
**Why you:** As a developer, you can quickly prototype and iterate based on client feedback.
**Why now:** The increasing shift to remote work demands more efficient client management tools.
**Monetization:** Subscription model at $50-$200 per month based on company size.
**First step:** Reach out to local consulting firms for interviews and beta testing.
**Fit scores:** skill:9 dist:4 speed:8 money:8

### Team Collaboration Optimizer (score: 82)
> Boost team productivity by optimizing collaborative efforts and reducing friction.
**Audience:** Small to medium-sized tech startups
**Wedge:** Integrates seamlessly with existing tools to enhance coordination and reduce wasted time.
**Why you:** Ability to integrate with existing software tools using your full-stack skills.
**Why now:** Current increase in remote work necessitates more efficient team collaboration solutions.
**Monetization:** Tiered subscription plan starting at $30 per user per month.
**First step:** Contact startup communities for feedback and pilot testing.
**Fit scores:** skill:9 dist:4 speed:8 money:8

**Zone: Prosumer Market Tools**
*The DIY and creator economy is expanding, with a significant demand for better tools enabling efficiency and monetization.*

### Personal Finance Tracker for Freelancers (score: 75)
> Simple personal finance management specifically for freelancers.
**Audience:** Freelancers and gig workers needing easy finance tracking
**Wedge:** Custom tailored tracking for freelance incomes and expenses, avoiding complex accounting software.
**Why you:** With a strong technical base, you can create tailored solutions quickly.
**Why now:** There's a growing number of freelancers due to the gig economy boom.
**Monetization:** Subscription service at $10 per month.
**First step:** Engage with freelancing communities for insights and initial user feedback.
**Fit scores:** skill:8 dist:3 speed:8 money:7

### Content Monetization Dashboard for Creators (score: 75)
> Aggregate revenue streams and track monetization across platforms.
**Audience:** Content creators on platforms like YouTube, Twitch, and TikTok
**Wedge:** Provides a consolidated view of multiple revenue channels and insights for optimization.
**Why you:** Technical expertise enables integration with multiple APIs for seamless user experience.
**Why now:** Creators increasingly rely on multiple platforms for income; managing them is complex.
**Monetization:** $15 monthly subscription.
**First step:** Research and engagement with online creator forums to establish pain points.
**Fit scores:** skill:8 dist:3 speed:8 money:7

**Zone: Developer Tools**
*As a software engineer, the founder can create products to solve problems they have encountered in the development process, appealing directly to other developers.*

### Code Review Assistant (score: 82)
> AI-driven tool to enhance and automate code reviews.
**Audience:** Software development teams in startups
**Wedge:** Provides intelligent suggestions, decreases errors, and speeds up the review process.
**Why you:** Direct experience with code review and development challenges.
**Why now:** The rapid pace of software development requires faster and more efficient code review processes.
**Monetization:** Subscription pricing based on team size, starting at $25 per seat per month.
**First step:** Connect with developer communities and plug into existing code repositories for beta testing.
**Fit scores:** skill:9 dist:4 speed:8 money:8

### Developer Onboarding Toolkit (score: 82)
> Simplify and automate the onboarding process for newly hired developers.
**Audience:** Tech companies scaling development teams
**Wedge:** Reduces onboarding time and mistakes, leading to faster productivity.
**Why you:** Experience in developing can afford insights into onboarding challenges.
**Why now:** More companies are scaling rapidly and need efficient onboarding processes.
**Monetization:** Monthly subscription model based on team size.
**First step:** Contact HR managers in tech companies to identify pain points and test features.
**Fit scores:** skill:9 dist:4 speed:8 money:8

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 9: [P09] Broad consumer communities, no constraints — no instruction
**Duration:** 11.0s

**Input profile:**
```
Role: Non-technical founder
Skills / expertise: Marketing (digital), Sales / closing deals
Technical level: Little to none
Communities / networks I have access to: College students / campus life, Pet owners (dogs, cats), Car enthusiasts / gearheads
Goal: Still figuring it out
Monetization preference: Not sure yet
Preferred business type: Not sure yet
```
**Direct instruction:** (none)

**AI-parsed founder:** Role: Non-technical founder | Skills: Marketing, Sales / closing deals | Communities: College students / campus life, Pet owners, Car enthusiasts
**Search context:** Optimize startup opportunities for a non-technical founder with marketing and sales expertise, focusing on niche community access.
**Total ideas generated:** 6

**Zone: College Students and Campus Life**
*Direct access to college communities with real credibility and insights into campus life.*

### Campus Event Management Service (score: 58)
> A service that helps college organizations plan and manage events seamlessly.
**Audience:** College student organizations and campus event planners
**Wedge:** Helps student organizations improve participation and streamline event logistics
**Why you:** Existing access to college student networks
**Why now:** Increased focus on campus experiences due to post-pandemic normalization
**Monetization:** Subscription fee or commission-based model with college organizations
**First step:** Reach out to college clubs and student governments known via personal networks
**Fit scores:** skill:8 dist:9 speed:7 money:5

### Student Budgeting Tool (score: 54)
> A subscription-based tool helping students manage finances effectively.
**Audience:** College students
**Wedge:** Focuses on unique student financial challenges, integrating campus-specific discounts and deals
**Why you:** Deep understanding of college student habits and behaviors
**Why now:** Rising student debt and financial literacy awareness
**Monetization:** Freemium model with premium budgeting features
**First step:** Survey college students in known networks to identify pain points
**Fit scores:** skill:8 dist:9 speed:6 money:5

**Zone: Pet Owners**
*Direct access to communities of pet owners, especially dogs and cats, allowing for targeted marketing approaches.*

### Pet Wellness Subscription Box (score: 56)
> Monthly boxes with personalized wellness products for pets.
**Audience:** Pet owners focused on health and wellness
**Wedge:** Customization and expert-curated products for pet health
**Why you:** Engagement with pet owner communities for targeted insights
**Why now:** Growing trend towards pet wellness amidst humanization of pets
**Monetization:** Monthly subscription box service
**First step:** Contact pet owners in existing networks and gauge interest in wellness products
**Fit scores:** skill:8 dist:8 speed:6 money:6

### Pet Owner Community Platform (score: 50)
> A platform for pet owners to connect, learn, and share best practices.
**Audience:** Pet owners looking for community and resources
**Wedge:** Leverages community engagement to provide tailored advice and products
**Why you:** Embedded within pet owner communities
**Why now:** Increasing interest in community-driven platforms
**Monetization:** Freemium with premium features or access to expert advice
**First step:** Leverage existing pet owner network to build initial user base
**Fit scores:** skill:7 dist:8 speed:5 money:5

**Zone: Car Enthusiasts**
*Direct engagement with car enthusiast communities offers insights and networking advantages.*

### Car Modification Marketplace (score: 48)
> A dedicated marketplace for car modification parts and services.
**Audience:** Car enthusiasts and modification specialists
**Wedge:** Centralized access to unique parts and trusted service providers
**Why you:** Strong connections within car enthusiast networks
**Why now:** Growing culture around car customization and modification
**Monetization:** Transactional fees and partner subscriptions
**First step:** Engage with enthusiast forums and networks to validate demand
**Fit scores:** skill:7 dist:7 speed:5 money:6

### Car Meetup Event Coordination Service (score: 54)
> Service facilitating meetups and events for car enthusiasts.
**Audience:** Car clubs and enthusiasts
**Wedge:** Streamlined event planning and personalized experiences for car lovers
**Why you:** Experience with organizing and attending car-related events
**Why now:** Increase in localized, themed meetups over the past years
**Monetization:** Service fees for event organization
**First step:** Contact car clubs and enthusiasts known to the founder for pilot events
**Fit scores:** skill:7 dist:8 speed:6 money:5

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 10: [P10] No code, no budget, freelancer network — no instruction
**Duration:** 9.7s

**Input profile:**
```
Role: Non-technical founder
Skills / expertise: Outbound / cold outreach, Copywriting, Community management
Technical level: Little to none
Communities / networks I have access to: Freelancers / consultants, Small business owners
Goal: Build a profitable side project
Monetization preference: Subscriptions (recurring)
Preferred business type: Service business
```
**Direct instruction:** (none)

**AI-parsed founder:** Role: Non-technical founder | Skills: Outbound / cold outreach, Copywriting, Community management | Communities: Freelancers / consultants, Small business owners
**Search context:** Non-technical founder with skills in outbound outreach, copywriting, and community management. Access to freelancer and small business networks with a goal to build a profitable side project focused on recurring revenue models.
**Total ideas generated:** 4

**Zone: Freelancer Support Services**
*Access to and understanding of freelance and consultant networks provides a direct path to initial customers.*

### Freelancer Cold Outreach Platform (score: 88)
> A service that optimizes and manages cold outreach campaigns for freelancers.
**Audience:** Freelancers looking to increase client acquisition via outreach
**Wedge:** Unique cold outreach expertise tailored to freelance needs
**Why you:** Deep knowledge of cold outreach processes and existing freelancer network
**Why now:** Increase in freelancers seeking more efficient client acquisition methods
**Monetization:** Monthly subscription (e.g., $20/month per user)
**First step:** Contact freelancers within existing network to gauge interest
**Fit scores:** skill:9 dist:8 speed:7 money:8

### Copywriting Templates for Freelancers (score: 83)
> Subscription access to premium copywriting templates for client pitches and proposals.
**Audience:** Freelancers needing improved client communications
**Wedge:** Leverage expertise in compelling copywriting
**Why you:** Expertise in copywriting and access to freelancer networks
**Why now:** Demand for effective client communication tools in competitive freelance market
**Monetization:** Monthly subscription (e.g., $15/month per subscriber)
**First step:** Offer initial templates to freelancers for feedback and interest
**Fit scores:** skill:8 dist:7 speed:8 money:8

**Zone: Small Business Growth Tools**
*Capability in copywriting and outreach enables creation of tools that assist small businesses in growth.*

### Automated Outreach Generator for SMBs (score: 82)
> A service that creates and sends automated outreach campaigns for small businesses.
**Audience:** Small business owners looking to scale outreach effectively
**Wedge:** Combines cold outreach expertise with small business needs
**Why you:** Experience in outreach and access to small business circles
**Why now:** Small businesses increasingly demand scalable growth tools
**Monetization:** Monthly subscription (e.g., $50/month per business)
**First step:** Get feedback from small business owners in existing network
**Fit scores:** skill:9 dist:6 speed:7 money:8

**Zone: Community-Based Learning Services**
*Community management skills can be leveraged to create engaging educational content for specific networks.*

### Freelancer Learning Hub (score: 76)
> A subscription-based learning platform focusing on skills needed by freelancers.
**Audience:** Freelancers looking to expand skill sets
**Wedge:** Community management expertise ensures active, engaging learning environment
**Why you:** Access to freelance community and community-building skills
**Why now:** Growing need for continual learning among freelancers
**Monetization:** Membership subscription (e.g., $30/month per member)
**First step:** Survey freelancer community to identify most wanted topics
**Fit scores:** skill:7 dist:7 speed:6 money:8

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
# With Instruction

Same 10 profiles, each with a specific founder instruction. Tests whether the model correctly overrides profile interests with the direct instruction, honors hard constraints, and avoids loophole-seeking.

| # | ID | Label | Ideas | Duration | Status |
|---|-----|-------|-------|----------|--------|
| 1 | I01 | Senior full-stack — target Shopify store owners specifically | 6 | 10.3s | OK |
| 2 | I02 | ML engineer, funded startup — no generic AI wrappers | 6 | 9.7s | OK |
| 3 | I03 | Student athlete — 3 intramural leagues, everything in spreadsheets | 4 | 9.7s | OK |
| 4 | I04 | B2B sales pro — no coding, fast monetization | 6 | 8.9s | OK |
| 5 | I05 | UI/UX designer — real designer/PM workflow problem, not a portfolio tool | 6 | 10.0s | OK |
| 6 | I06 | Twitch streamer — solo SaaS under $500/mo, prove market first | 4 | 9.4s | OK |
| 7 | I07 | Youth sports organizer — 6 leagues, scheduling/payments in spreadsheets | 3 | 9.9s | OK |
| 8 | I08 | Generic interests — fitness/gaming/productivity (should penalize) | 6 | 8.2s | OK |
| 9 | I09 | Broad consumer communities — targeting dog owners specifically | 6 | 9.6s | OK |
| 10 | I10 | No code, no budget — first $500 in 30 days | 6 | 11.6s | OK |

**Avg duration:** 9.7s | **Total ideas:** 53 | **Avg ideas/case:** 5.3

### Detailed Results

---
#### Case 1: [I01] Senior full-stack — target Shopify store owners specifically
**Duration:** 10.3s

**Input profile:**
```
Role: Software engineer
Skills / expertise: Full-stack development, React / Next.js, Backend development, SQL / database queries
Technical level: Full-stack / senior engineer
Communities / networks I have access to: Startup founders / indie hackers, Software developers / engineers, Small business owners
Goal: Build a profitable side project
Monetization preference: Subscriptions (recurring)
Preferred business type: Software / app
```
**Direct instruction:** I want to build something specifically for Shopify store owners. I know several through my indie hacker and small business communities.

**AI-parsed founder:** Role: Software engineer | Skills: Full-stack development, React / Next.js, Backend development, SQL / database queries | Communities: Startup founders / indie hackers, Software developers / engineers, Small business owners
**Search context:** Focus on Shopify store owners as the main target audience for all opportunity zones, leveraging founder's existing connections and communities.
**Total ideas generated:** 6

**Zone: Shopify Store Optimization**
*The founder has direct access to Shopify store owners, enabling them to address specific operational needs or pain points these businesses face.*

### Automated Bundle Creator (score: 78)
> Automatically generate product bundles based on sales data and inventory for Shopify stores.
**Audience:** Shopify store owners looking to increase AOV (Average Order Value).
**Wedge:** Automates repetitive and time-consuming task of bundling products.
**Why you:** Access to Shopify owners who can provide insights and initial feedback.
**Why now:** Increasing trend in e-commerce towards personalization and upselling.
**Monetization:** Subscription fee based on the number of bundles managed ($29/month).
**First step:** Discuss with Shopify store owners in indie hacker community about their bundling processes.
**Fit scores:** skill:9 dist:8 speed:7 money:8

### Customer Retention Analytics (score: 74)
> Provide actionable insights on customer retention to Shopify stores using automated reports.
**Audience:** Shopify store owners aiming to reduce churn and improve customer retention.
**Wedge:** Integrates directly with Shopify to pull sales data, providing tailored retention strategies.
**Why you:** Strong distribution through indie hackers and small business networks focused on Shopify.
**Why now:** Growing importance of customer retention in competitive e-commerce landscape.
**Monetization:** Tiered subscription model based on store size and complexity ($49-$199/month).
**First step:** Survey Shopify owners about their current retention tactics and challenges.
**Fit scores:** skill:8 dist:7 speed:7 money:9

**Zone: Shopify Marketing Tools**
*Many Shopify store owners need simplified and effective marketing tools integrated directly with their platforms.*

### Multichannel Marketing Dashboard (score: 74)
> A centralized dashboard to manage and track performance of Shopify store marketing across channels.
**Audience:** Shopify store owners who market on various platforms like Facebook, Instagram, and Google.
**Wedge:** Eliminates the need for multiple accounts and dashboards by integrating major ad platforms.
**Why you:** Existing connections to Shopify stores provide immediate access for feedback and testing.
**Why now:** E-commerce marketing is increasingly multichannel, requiring better integration.
**Monetization:** Monthly subscription with a trial tier ($30/month).
**First step:** Conduct interviews with Shopify store owners about their multichannel marketing challenges.
**Fit scores:** skill:8 dist:8 speed:6 money:8

### Influencer Collaboration Finder (score: 72)
> Match Shopify stores with potential influencers based on store products and niche.
**Audience:** Shopify store owners targeting influencer marketing to drive sales.
**Wedge:** Uses data-driven insights to identify influencer-store matches, reducing manual search time.
**Why you:** Close ties with small business owners provide insights into influencer marketing.
**Why now:** Influencer marketing continues to grow but is often inefficiently executed by small stores.
**Monetization:** Freemium model with subscription upgrades for advanced features ($40/month).
**First step:** Reach out to indie hacker community to understand influencer marketing practices.
**Fit scores:** skill:7 dist:8 speed:7 money:8

**Zone: Shopify Financial Tools**
*Financial management is crucial for Shopify store owners and often requires specialized tools to optimize profits and cash flow management.*

### Automated Profit Margin Analyzer (score: 75)
> Tool for Shopify stores to continuously monitor and analyze profit margins on all products.
**Audience:** Shopify store owners who need to track and optimize profit margins.
**Wedge:** Simplifies complex calculations automatically, freeing up store owners' time.
**Why you:** Strong technical ability to build robust financial tools combined with community insights.
**Why now:** Increased competition requires stores to manage margins more aggressively.
**Monetization:** Subscription based on store sales volume ($25/month).
**First step:** Engage Shopify users through indie hacker network to assess interest in profit tracking challenges.
**Fit scores:** skill:9 dist:7 speed:7 money:8

### Cash Flow Forecasting Tool (score: 76)
> A simple tool that predicts future cash flow based on Shopify sales data.
**Audience:** Shopify store owners seeking better financial foresight and planning.
**Wedge:** Provides predictive insights directly integrating with Shopify's existing financial reports.
**Why you:** Access to Shopify store data insights and deep technical expertise.
**Why now:** Economic uncertainties drive demand for better financial predictability tools.
**Monetization:** Software-as-a-Service model with a tiered pricing structure ($50/month).
**First step:** Gauge interest through discussions in the small business owner community about cash flow challenges.
**Fit scores:** skill:9 dist:7 speed:8 money:8

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 2: [I02] ML engineer, funded startup — no generic AI wrappers
**Duration:** 9.7s

**Input profile:**
```
Role: Software engineer
Skills / expertise: Machine learning engineering, LLM / AI engineering, Python development, Data science / ML, Backend development
Technical level: Full-stack / senior engineer
Communities / networks I have access to: AI / ML practitioners, Software developers / engineers, Startup founders / indie hackers
Goal: Launch a funded startup
Monetization preference: Subscriptions (recurring)
Preferred business type: Software / app
```
**Direct instruction:** I want ideas outside of generic AI wrappers - something with real workflow lock-in or proprietary data

**AI-parsed founder:** Role: Software engineer | Skills: Machine learning engineering, LLM / AI engineering, Python development, Data science / ML | Communities: AI / ML practitioners, Software developers / engineers, Startup founders / indie hackers
**Search context:** Direct founder instruction specified a focus on non-generic AI solutions with workflow lock-in and/or proprietary data, excluding the founder’s typical market interests.
**Total ideas generated:** 6

**Zone: Data-Driven Workflow Automation**
*Utilize the founder’s expertise in data processing to automate complex workflows for specific industries.*

### Legal Contract Analysis Automation (score: 79)
> Automate the extraction and analysis of key terms in legal contracts.
**Audience:** Law firms and legal departments
**Wedge:** Proprietary data model trained on diverse legal contracts enhancing accuracy over generic models.
**Why you:** Experience in data science and AI can uniquely tailor models for legal data processing.
**Why now:** Increased digital transformation in legal, along with rising legal costs, pushes demand for automation.
**Monetization:** Subscription model starting at $200/month per legal entity.
**First step:** Contact legal professionals in startup networks and legal tech forums.
**Fit scores:** skill:9 dist:6 speed:7 money:8

### Supply Chain Risk Monitoring (score: 73)
> Real-time risk monitoring and alerts for supply chain disruptions using data analytics.
**Audience:** Manufacturing companies
**Wedge:** Unique data integration capabilities turning disparate supply chain data into actionable insights.
**Why you:** Proficiency in backend data systems ideal for integrating and interpreting supply chain data.
**Why now:** Global supply disruptions heighten awareness and need for reliable monitoring tools.
**Monetization:** Usage-based subscription, starting at $500/month based on number of monitored SKUs.
**First step:** Engage manufacturing experts on LinkedIn groups and SMR conferences.
**Fit scores:** skill:8 dist:5 speed:6 money:7

**Zone: Health and Safety Compliance Tools**
*Providing AI-driven compliance solutions in highly regulated industries, leveraging the founder’s backend and data integration experience.*

### Workplace Safety Compliance Manager (score: 77)
> AI-driven tool for managing and ensuring workplace safety compliance.
**Audience:** Construction and manufacturing firms
**Wedge:** Unique model fine-tuned on specific industry safety standards and requirements.
**Why you:** Technical ability to create models handling complex compliance datasets.
**Why now:** Stringent safety regulations demand efficient compliance management solutions.
**Monetization:** Monthly subscription of $300 per company, with additional fees for customized reports.
**First step:** Reach out to health and safety officers in construction companies within the founder’s network.
**Fit scores:** skill:9 dist:5 speed:6 money:8

### Food Safety Audit Helper (score: 74)
> Automated audit checklist and compliance management tool for food processing.
**Audience:** Food processing plants
**Wedge:** Proprietary AI model designed using datasets of regulatory audits to improve accuracy.
**Why you:** Deep data integration skills are crucial for handling regulatory checklist data types.
**Why now:** Growing food safety regulations and demand for efficiency in compliance are urgent needs.
**Monetization:** Tiered subscription model starting from $150/month, scaling with service breadth.
**First step:** Collaborate with food safety consultants for beta testing and feedback.
**Fit scores:** skill:8 dist:4 speed:7 money:8

**Zone: Custom Machine Learning Models for Niche Markets**
*Creating value through AI models tailored to specific industry needs, leveraging the founder's machine learning expertise.*

### Retail Demand Forecasting AI (score: 79)
> Optimized AI for forecasting demand in retail sectors with fluctuating consumer trends.
**Audience:** Retail chains and e-commerce businesses
**Wedge:** Specialized AI models that integrate seasonal and promotional data from the retail space.
**Why you:** Ability to customize models specifically for retail-specific datasets.
**Why now:** Post-pandemic fluctuations in buying patterns necessitate AI-driven forecasting adjustments.
**Monetization:** Yearly subscription model, starting at $5,000 per outlet.
**First step:** Present concept to retail associations and at e-commerce strategy meetups.
**Fit scores:** skill:9 dist:4 speed:7 money:9

### Precision Agriculture Analytics (score: 75)
> Machine learning models for optimizing crop yield through detailed environmental analytics.
**Audience:** Corporate farms and agricultural consultancy firms
**Wedge:** AI model using satellite imagery and localized climate data to maximize accuracy.
**Why you:** Expertise in building models that can process large sets of contextual environmental data.
**Why now:** Sustainability and profit maximization are driving heavy investments in precision agriculture.
**Monetization:** Service-based pricing, with a starting package of $10,000 per annum.
**First step:** Engage with agricultural tech networks and environmental consultancy firms.
**Fit scores:** skill:8 dist:5 speed:6 money:8

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 3: [I03] Student athlete — 3 intramural leagues, everything in spreadsheets
**Duration:** 9.7s

**Input profile:**
```
Role: Student, Software engineer
Skills / expertise: Full-stack development, React / Next.js, Backend development, Community management
Technical level: Strong developer
Communities / networks I have access to: Student athletes, Local sports leagues / intramurals, Youth sports parents & coaches, College students / campus life
Goal: Build a profitable side project
Monetization preference: Subscriptions (recurring)
Preferred business type: Software / app
```
**Direct instruction:** I run 3 intramural leagues and every single admin task is in Google Sheets or GroupMe.

**AI-parsed founder:** Role: Student, Software engineer | Skills: Full-stack development, React / Next.js, Backend development, Community management | Communities: Student athletes, Local sports leagues / intramurals, Youth sports parents & coaches
**Search context:** The founder's experience managing intramural leagues is the primary directive, focusing on opportunities to streamline management tasks and improve communication within sports teams.
**Total ideas generated:** 4

**Zone: Intramural League Management**
*The founder manages intramural leagues and experiences administrative pain points firsthand. This gives a distribution advantage and deep insight into the needs of similar leagues.*

### LeagueAdmin Pro (score: 86)
> Streamline your intramural league management with automated scheduling, communication, and results tracking.
**Audience:** Intramural league organizers
**Wedge:** Automate repetitive admin tasks with tailored tools
**Why you:** Direct experience with current pain points and workflow
**Why now:** Growing demand for automated solutions in amateur sports
**Monetization:** $50/month per league for premium features
**First step:** Start with current leagues and nearby university sports clubs
**Fit scores:** skill:9 dist:8 speed:7 money:8

### Intramural Scheduler (score: 84)
> AI-powered scheduling and conflict resolution for sports leagues.
**Audience:** Intramural and local sports leagues
**Wedge:** Reduce conflict and manual scheduling work
**Why you:** Experience in handling scheduling complexities for leagues
**Why now:** Increased complexity in league operations post-pandemic
**Monetization:** Subscription model at $10/month per league
**First step:** Pilot with existing managed leagues and expand to nearby colleges
**Fit scores:** skill:9 dist:7 speed:8 money:7

**Zone: Sports Communication and Engagement**
*Founder uses GroupMe for league communication, indicating potential for a tailored communication tool specific to sports.*

### TeamTalk (score: 82)
> A dedicated communication platform tailored for sports teams and leagues.
**Audience:** Sports leagues and team managers
**Wedge:** Replace fragmented communication channels
**Why you:** Experienced in creating engaging communication for teams
**Why now:** Demand for better engagement tools as group sports resume
**Monetization:** Freemium model with $5/user/month for advanced features
**First step:** Test with intramural teams using GroupMe currently
**Fit scores:** skill:8 dist:8 speed:7 money:7

**Zone: Athlete and Participant Experience**
*Current tools for managing participant experiences are generalist; a sports-specific solution can add value.*

### PlayerConnect (score: 80)
> Enhance player experience with performance tracking, feedback, and social sharing tools.
**Audience:** Athletes in intramural and local leagues
**Wedge:** Integrate performance tracking with social sharing
**Why you:** Involved in athlete communities with insight into their needs
**Why now:** Growing interest in performance tracking and social sharing
**Monetization:** Subscriptions at $5/month per player with team discounts
**First step:** Onboard current league participants as beta users
**Fit scores:** skill:8 dist:7 speed:6 money:7

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 4: [I04] B2B sales pro — no coding, fast monetization
**Duration:** 8.9s

**Input profile:**
```
Role: Non-technical founder
Skills / expertise: B2B enterprise sales, Outbound / cold outreach, Account management, CRM management (HubSpot, Salesforce), Business development
Technical level: Little to none
Communities / networks I have access to: Small business owners, Sales professionals, Freelancers / consultants
Goal: Build a profitable side project
Monetization preference: Subscriptions (recurring)
Preferred business type: Service business, Software / app
```
**Direct instruction:** No coding. Want something I can build or operate without developers. Fast monetization.

**AI-parsed founder:** Role: Non-technical founder | Skills: B2B enterprise sales, Outbound/cold outreach, Account management, CRM management | Communities: Small business owners, Sales professionals, Freelancers/consultants
**Search context:** Identify fast monetization, no-code opportunities for a non-technical founder in new markets, focusing on service delivery, automation, and educational content.
**Total ideas generated:** 6

**Zone: Productized B2B Services**
*Founder's skills in sales and network access to small business owners make productized services an easy solo operation.*

### Virtual Sales Assistant Service (score: 81)
> Offer virtual sales assistance packages to small business owners needing sales support.
**Audience:** Small business owners with limited sales teams
**Wedge:** Customized outreach scripts and dedicated virtual assistants for consistent lead generation.
**Why you:** Strong sales expertise and direct network access
**Why now:** Rising demand for outsourced roles in sales and marketing
**Monetization:** Subscription packages starting at $500/month
**First step:** Contact small business owner networks to pilot service
**Fit scores:** skill:9 dist:8 speed:7 money:9

### CRM Optimization Consultancy (score: 78)
> Help businesses optimize HubSpot and Salesforce usage to improve efficiency.
**Audience:** Businesses using CRM systems without dedicated CRM managers
**Wedge:** Quick setup and actionable CRM optimization strategies from an expert.
**Why you:** Deep experience with CRM tools like HubSpot and Salesforce
**Why now:** Increasing complexity and complaints about CRM efficiency
**Monetization:** Consulting fees with performance-based retainers
**First step:** Reach out to known contacts using CRM systems
**Fit scores:** skill:10 dist:7 speed:8 money:7

**Zone: Redundant Task Automation Services**
*Streamlined operations through automation of routine tasks, appealing due to fast implementation and ROI.*

### Email Follow-Up Automation Service (score: 78)
> Automate email follow-ups for sales teams using structured templates.
**Audience:** Small business sales teams
**Wedge:** Template-based email sequences that can be customized quickly without technical setup.
**Why you:** Sales expertise and strong community ties make initial customer access feasible
**Why now:** Growing demand for automation to boost productivity
**Monetization:** Monthly fee based on number of users/emails automated
**First step:** Reach out to small business owners with sales teams for pilot use
**Fit scores:** skill:8 dist:7 speed:8 money:8

### Recurring Task Scheduling Service (score: 71)
> Automated scheduling tools for recurring business tasks that integrate seamlessly with existing systems.
**Audience:** Freelancers and small business owners
**Wedge:** Operational efficiency gains with non-intrusive integration
**Why you:** Access to freelancer and owner networks
**Why now:** Increased focus on productivity tools post-pandemic
**Monetization:** Tiered subscription model based on feature access
**First step:** Contact freelancers and small business owners for testing
**Fit scores:** skill:7 dist:6 speed:7 money:7

**Zone: Educational Content for Sales Professionals**
*Ability to leverage sales experience into educational materials for specific professional development.*

### Sales Mastery Workshops (score: 80)
> Live virtual workshops focused on mastering cold outreach strategies.
**Audience:** Sales professionals seeking to improve their skills
**Wedge:** High-impact live sessions with real-world examples and tactics.
**Why you:** Expertise in sales and access to sales communities
**Why now:** Continuous need for skill development amidst changing sales landscapes
**Monetization:** Paid workshop registration
**First step:** Market to sales professional networks and existing connections
**Fit scores:** skill:9 dist:8 speed:7 money:8

### Subscription-Based Sales Training Platform (score: 76)
> Offer a subscription model for ongoing sales training videos and resources.
**Audience:** Junior sales teams and professionals entering the field
**Wedge:** Constantly updated content reflecting current sales trends.
**Why you:** Existing sales knowledge and network access
**Why now:** Increased shift to online learning platforms
**Monetization:** Monthly subscription
**First step:** Leverage LinkedIn to connect with sales professionals interested in training
**Fit scores:** skill:9 dist:7 speed:7 money:8

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 5: [I05] UI/UX designer — real designer/PM workflow problem, not a portfolio tool
**Duration:** 10.0s

**Input profile:**
```
Role: Designer
Skills / expertise: UI / UX design, Product design, Figma / prototyping, UX research, Design systems
Technical level: Just getting started
Communities / networks I have access to: UX / UI designers, Product managers, Startup founders / indie hackers, Software developers / engineers
Goal: Launch a funded startup
Monetization preference: Subscriptions (recurring)
Preferred business type: Software / app
```
**Direct instruction:** I want to build something that solves a real designer or PM workflow problem. Not a portfolio tool.

**AI-parsed founder:** Role: Designer | Skills: UI / UX design, Product design, Figma / prototyping, UX research | Communities: UX / UI designers, Product managers, Startup founders / indie hackers
**Search context:** Focused on solving design and project management workflow problems specifically mentioned by the founder, emphasizing designer and PM workflow solutions.
**Total ideas generated:** 6

**Zone: Designer Collaboration and Asset Management**
*Focused on addressing workflow issues specific to designers and project managers, enhancing real-time collaboration and asset handling.*

### Design Handoff Automation Tool (score: 81)
> Streamline the design-to-development handoff process with automated spec generation and asset packaging.
**Audience:** Design teams and product managers at tech startups
**Wedge:** Automation of repetitive and error-prone tasks during handoff phases.
**Why you:** Deep understanding of designer workflows and UI/UX pain points.
**Why now:** Growth in remote teams and need for efficient virtual handoffs.
**Monetization:** Subscription plans starting at $49/month per team.
**First step:** Contact design leaders in startup and tech communities to discuss current pain points.
**Fit scores:** skill:9 dist:6 speed:7 money:8

### Design Asset Version Control (score: 75)
> A tool for managing versions and history of design assets with rollback capabilities.
**Audience:** Design teams using Figma and similar tools
**Wedge:** Seamless integration with existing design tools, enhancing version control.
**Why you:** Experience with design systems and workflows.
**Why now:** Increased complexity in modern design projects and collaboration needs.
**Monetization:** Tiered pricing based on number of assets managed.
**First step:** Reach out to Figma community groups to validate the need.
**Fit scores:** skill:8 dist:5 speed:8 money:7

**Zone: Design and PM Synchronization Tools**
*Focuses on easing communication and task management between designers and product managers.*

### Design Brief Alignment Platform (score: 78)
> Platform to create and manage dynamic design briefs aligned closely with PM needs.
**Audience:** Product managers and design teams in tech firms
**Wedge:** Centralized brief creation and reference to keep teams aligned.
**Why you:** Experience in both design areas and interaction with product managers.
**Why now:** Continuing rise of agile methodologies requiring flexible tools.
**Monetization:** Subscriptions at $30/month per team user.
**First step:** Conduct interviews with PMs and designers in tech startups.
**Fit scores:** skill:8 dist:6 speed:7 money:7

### Design-PM Task Sync Tool (score: 76)
> Tool to sync design tasks and updates directly with PM software like Jira.
**Audience:** Tech companies with integrated design and development teams
**Wedge:** Real-time bidirectional linkages between design and PM tools.
**Why you:** Existing network of designers and PMs for distribution testing.
**Why now:** Increased use of integrated design-development cycles.
**Monetization:** Subscriptions starting at $10/user/month.
**First step:** Test MVP with small tech teams and iterate based on feedback.
**Fit scores:** skill:7 dist:6 speed:7 money:7

**Zone: Design System Maintenance and Automation**
*Address inefficiencies in maintaining and updating design systems across teams.*

### Automated Design System Update Tool (score: 79)
> Automatically update and align design system elements across multiple projects.
**Audience:** Large design teams utilizing complex design systems
**Wedge:** Reduces manual updates and consistency errors.
**Why you:** Expertise in design systems; can leverage design community connections.
**Why now:** Proliferation of design systems and the need for updates automation.
**Monetization:** Enterprise licensing or subscription-based model at $199/month/team.
**First step:** Survey design teams working on multiple projects.
**Fit scores:** skill:9 dist:5 speed:6 money:8

### Design System Audit Platform (score: 78)
> Regularly audits design systems to ensure compliance and optimize performance.
**Audience:** Tech firms with established design systems
**Wedge:** Automates compliance checks and suggests optimizations.
**Why you:** Background in design systems and understanding of large-scale design needs.
**Why now:** Demand for design system consistency and efficiency is rising.
**Monetization:** Subscription model with auditing service premiums.
**First step:** Engage with design system leads to establish necessity and interest.
**Fit scores:** skill:8 dist:5 speed:7 money:7

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 6: [I06] Twitch streamer — solo SaaS under $500/mo, prove market first
**Duration:** 9.4s

**Input profile:**
```
Role: Software engineer
Skills / expertise: Full-stack development, React / Next.js, Community management, Content creation
Technical level: Strong developer
Communities / networks I have access to: Streamers (Twitch / Kick), YouTubers / video creators, Discord / online communities, TikTok creators
Goal: Build a profitable side project
Monetization preference: Subscriptions (recurring), Free + paid tier (freemium)
Preferred business type: Software / app
```
**Direct instruction:** Wants solo SaaS under $500/mo to start. Prove the market before going bigger.

**AI-parsed founder:** Role: Software engineer | Skills: Full-stack development, React / Next.js, Community management, Content creation | Communities: Streamers (Twitch / Kick), YouTubers / video creators, Discord / online communities
**Search context:** Integrate existing access and maximize recurring revenue models, starting small and scalable without large teams or capital.
**Total ideas generated:** 4

**Zone: Workflow Automation for Content Creators**
*Founder has strong connection with streamers and content creators, making them well-positioned to identify repetitive tasks ripe for automation.*

### Stream Schedule Automator (score: 78)
> Automate stream schedules across multiple platforms for consistency and reduced admin work.
**Audience:** Streamers on Twitch and Kick
**Wedge:** Streamers struggle to maintain consistent schedules manually across different platforms.
**Why you:** Access to streamer communities allows direct feedback and quick iteration.
**Why now:** Increasing complexity of managing multiple platforms necessitates automation.
**Monetization:** Subscription model at $20/month per streamer.
**First step:** Reach out to Twitch and Kick streamers to validate the pain point.
**Fit scores:** skill:8 dist:9 speed:7 money:8

### Content Repurposing Bot (score: 89)
> Automate the process of turning streams into engaging TikTok clips.
**Audience:** YouTubers and Twitch Streamers
**Wedge:** Manual clip creation is time-consuming and repetitive; creators need efficiency.
**Why you:** Access and trust within creator communities can drive initial adoption.
**Why now:** Short-form content platforms are exploding, increasing demand for efficient content repurposing.
**Monetization:** Freemium model with paid tiers starting at $10/month.
**First step:** Survey current YouTubers and Twitch streamers about their editing process.
**Fit scores:** skill:9 dist:9 speed:8 money:9

**Zone: Digital Tools for Online Communities**
*Direct access to Discord and online communities allows the founder to see operational challenges these communities face.*

### Custom Discord Bot Platform (score: 78)
> Create bots to automate community management tasks without needing to code.
**Audience:** Discord community managers
**Wedge:** Community managers lack the resources to develop custom bots for their specific needs.
**Why you:** Close ties to Discord communities give insight into daily challenges.
**Why now:** Increased reliance on online communities for interaction, need efficient tools to manage them.
**Monetization:** Tiered pricing based on bot complexity, starting at $5/bot/month.
**First step:** Engage with Discord communities to identify unmet needs.
**Fit scores:** skill:8 dist:8 speed:7 money:8

**Zone: Prosumer Scheduling Tools**
*Scheduling and time management are universal needs among content-driven professionals, tapping into prosumer markets offers simplicity and immediate validation.*

### Integrated Content Calendar (score: 82)
> Sync your content plans with your streaming and video platforms in real-time.
**Audience:** Content creators on Twitch, YouTube, and TikTok
**Wedge:** Scattered planning tools do not integrate directly with distribution platforms.
**Why you:** Existing contacts with content creators provide direct channels for feedback.
**Why now:** Increasing pressure on creators to manage consistent output across multiple platforms.
**Monetization:** Freemium with advanced features starting at $15/month.
**First step:** Survey online creators to assess interest and specific needs.
**Fit scores:** skill:9 dist:8 speed:8 money:8

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 7: [I07] Youth sports organizer — 6 leagues, scheduling/payments in spreadsheets
**Duration:** 9.9s

**Input profile:**
```
Role: Non-technical founder
Skills / expertise: Event operations / coordination, Community management, Sports coaching, Project management
Technical level: Little to none
Communities / networks I have access to: Youth sports parents & coaches, Local sports leagues / intramurals, Parents of young children, Parents of teens / student athletes
Goal: Build a profitable side project
Monetization preference: Subscriptions (recurring)
Preferred business type: Software / app, Service business
```
**Direct instruction:** I coordinate 6 youth leagues. Scheduling, communications, payments, and rosters are all in spreadsheets and text threads.

**AI-parsed founder:** Role: Non-technical founder | Skills: Event operations, Community management, Sports coaching, Project management | Communities: Youth sports parents & coaches, Local sports leagues / intramurals, Parents of young children
**Search context:** Focus on opportunities made possible through youth leagues where the founder has deep experience and community access.
**Total ideas generated:** 3

**Zone: Youth Sports League Management Tools**
*The founder has direct experience and access to youth leagues, making them well-positioned to build a tool addressing pain points in scheduling, communication, and payments.*

### LeagueMaster (score: 85)
> A platform to streamline scheduling, communication, and payments for youth leagues.
**Audience:** Youth league coordinators
**Wedge:** Automates and centralizes league operations in one platform.
**Why you:** Direct experience with pain points of coordinating youth leagues.
**Why now:** Increasing demand for digital transformation in community sports.
**Monetization:** $20/user/month or tiered league pricing.
**First step:** Reach out to league coordinators through existing contacts.
**Fit scores:** skill:9 dist:8 speed:7 money:8

**Zone: Team Communication and Coordination App**
*The need for simplified communication and team coordination tools in amateur sports is unmet by existing consumer apps.*

### TeamConnect (score: 80)
> A communication app designed for amateur sports teams to streamline interactions and updates.
**Audience:** Youth coaches and parents
**Wedge:** Dedicated channels for each team or group activity.
**Why you:** Existing connections with teams to test and validate the tool.
**Why now:** Growing frustration with fragmented communication tools.
**Monetization:** Subscription-based model at $10/team/month.
**First step:** Pilot with one league for direct feedback.
**Fit scores:** skill:8 dist:8 speed:6 money:7

**Zone: Youth Sports Payment Solutions**
*With a clear pain in managing payments, a tailored solution can be offered to increase efficiency and transparency in youth sports leagues.*

### PayPlay (score: 82)
> A payment management solution designed for youth sports leagues.
**Audience:** League treasurers and coordinators
**Wedge:** Integrates directly into team management tools, simplifying payment tracking.
**Why you:** Experience managing payments manually; access to individuals who can pilot the tool.
**Why now:** Rise in preference for digital payment tracking solutions.
**Monetization:** Transaction fees or subscription model.
**First step:** Survey existing leagues to confirm interest and need.
**Fit scores:** skill:8 dist:7 speed:7 money:8

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 8: [I08] Generic interests — fitness/gaming/productivity (should penalize)
**Duration:** 8.2s

**Input profile:**
```
Role: Software engineer
Skills / expertise: Full-stack development, React / Next.js
Technical level: Strong developer
Goal: Build a profitable side project
Monetization preference: Subscriptions (recurring)
Preferred business type: Software / app
```
**Direct instruction:** I want to build a SaaS. Interested in fitness, gaming, and productivity.

**AI-parsed founder:** Role: Software engineer | Skills: Full-stack development, React, Next.js | Communities: developer communities, open source projects, SaaS product forums
**Search context:** The founder seeks to build a SaaS product related to fitness, gaming, or productivity, leveraging technical skills and aiming for a profitable side project with subscription-based revenue.
**Total ideas generated:** 6

**Zone: Fitness SaaS Tools**
*The founder's interest in fitness combined with technical skills can solve specific workflow problems in fitness management or tracking.*

### Personal Trainer Client Management Tool (score: 66)
> Simplify client scheduling, progress tracking, and communication for personal trainers.
**Audience:** Independent personal trainers and small gyms
**Wedge:** All-in-one dashboard for client management to reduce admin workload.
**Why you:** Interest in fitness combined with technical skills to build SaaS.
**Why now:** Rise in remote training and individual fitness coaching post-pandemic.
**Monetization:** $15/month per trainer with tiered pricing for larger facilities.
**First step:** Survey fitness trainers on TrainerRoad forums and Reddit's r/personaltraining.
**Fit scores:** skill:8 dist:6 speed:7 money:8

### Online Fitness Class Booking System (score: 66)
> Platform for gyms to manage online class schedules and payments seamlessly.
**Audience:** Small to mid-sized gyms and studios
**Wedge:** Streamline class booking and payment processing in one system.
**Why you:** Developer skills to create a robust and secure booking platform.
**Why now:** Increase in online fitness class participation necessitates better booking solutions.
**Monetization:** Subscription model: $49/month per location.
**First step:** Approach local fitness studios and reach out to gym owners on LinkedIn.
**Fit scores:** skill:8 dist:5 speed:7 money:8

**Zone: Gaming Productivity Tools**
*Combining gaming and productivity to enhance workflows for gamers and streamers.*

### Streamer Task Manager (score: 64)
> A personal productivity and engagement tool for live streamers.
**Audience:** Twitch streamers and content creators
**Wedge:** Integrates with streaming platforms to optimize engagement and task management.
**Why you:** Understanding of both development and gaming ecosystems.
**Why now:** Growth in content creation and streaming markets demands robust tools.
**Monetization:** Freemium with $10/month premium tier.
**First step:** Test interest within streamer groups on Discord and Twitch communities.
**Fit scores:** skill:8 dist:5 speed:7 money:7

### Gamer Time Tracker (score: 64)
> Track gaming sessions to optimize playing time and productivity balance.
**Audience:** Casual and semi-professional gamers
**Wedge:** Helps gamers manage play time alongside other commitments.
**Why you:** Insight into gaming habits and ability to create user-centric software.
**Why now:** Increased awareness of screen time balance.
**Monetization:** Subscription: $5/month or $50/year.
**First step:** Engage gaming forums and subreddits like r/gaming and r/GamerPals.
**Fit scores:** skill:8 dist:5 speed:7 money:7

**Zone: Productivity Enhancement SaaS**
*Optimize productivity processes which leverage existing skills and communities.*

### Developer Daily Planner (score: 70)
> Customizable productivity tool tailored for developers managing complex projects.
**Audience:** Software engineers and developers
**Wedge:** Integrates with popular dev tools (GitHub, Jira) for personalized planning.
**Why you:** Deep understanding of developer workflows.
**Why now:** Increased complexity in remote and distributed dev teams.
**Monetization:** $12/month per user with team discounts.
**First step:** Survey developer communities on platforms like GitHub and Stack Overflow.
**Fit scores:** skill:9 dist:6 speed:7 money:8

### Focus Mode Scheduler (score: 68)
> Helps professionals schedule deep work sessions effectively.
**Audience:** Knowledge workers and freelancers
**Wedge:** Integrates with calendars to prioritize time blocks for focused work.
**Why you:** Ability to develop integrations with existing calendar systems.
**Why now:** Increased demand for work-life balance and focus tools.
**Monetization:** Freemium model with $9/month premium.
**First step:** Feedback from productivity enthusiasts groups and subreddit r/productivity.
**Fit scores:** skill:9 dist:5 speed:7 money:8

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 9: [I09] Broad consumer communities — targeting dog owners specifically
**Duration:** 9.6s

**Input profile:**
```
Role: Non-technical founder
Skills / expertise: Marketing (digital), Sales / closing deals
Technical level: Little to none
Communities / networks I have access to: College students / campus life, Pet owners (dogs, cats), Car enthusiasts / gearheads
Goal: Still figuring it out
Monetization preference: Not sure yet
Preferred business type: Not sure yet
```
**Direct instruction:** I want to build something for dog owners specifically. I personally know hundreds of dog owners through my community.

**AI-parsed founder:** Role: Non-technical founder | Skills: Marketing (digital), Sales / closing deals | Communities: Pet owners (dogs, cats)
**Search context:** The founder is focused on creating something specifically for dog owners, leveraging a strong personal network within that community to quickly gain initial traction and validate ideas.
**Total ideas generated:** 6

**Zone: Dog Owner Services**
*The founder has direct access to a large community of dog owners, making it feasible to reach initial customers quickly.*

### Pet Playdate Coordination Service (score: 66)
> An app to schedule playdates and connect dog owners in local communities.
**Audience:** Dog owners in urban areas
**Wedge:** Simplifies social interaction for pet enrichment
**Why you:** Direct connection to a large network of dog owners
**Why now:** Increasing urban pet ownership fostering need for more social interaction
**Monetization:** Subscription fee for premium features or access
**First step:** Survey existing network of dog owners for interest
**Fit scores:** skill:8 dist:9 speed:6 money:5

### Mobile Dog Grooming Marketplace (score: 64)
> A platform that connects dog owners with local mobile groomers.
**Audience:** Busy dog owners needing convenient grooming solutions
**Wedge:** Convenience and time-saving for a recurring need
**Why you:** Use network to find first customers and groomers
**Why now:** Rise in demand for at-home services post-pandemic
**Monetization:** Transaction fee from grooming services
**First step:** Interview dog owners about current grooming pain points
**Fit scores:** skill:7 dist:8 speed:6 money:6

**Zone: Dog Owner Education**
*Pet owners often seek educational resources, and existing networks can assist in building a learning platform.*

### Dog Training Tips Newsletter (score: 68)
> Subscription-based newsletter providing expert dog training advice.
**Audience:** New dog owners looking for accessible training advice
**Wedge:** Expert tips consolidated and delivered regularly
**Why you:** Leverage network to find subscribers and trainers
**Why now:** Growing interest in pet ownership and training resources
**Monetization:** Subscription model with premium content
**First step:** Create a sample newsletter and gather feedback from known dog owners
**Fit scores:** skill:7 dist:8 speed:7 money:6

### Dog Health & Nutrition Courses (score: 65)
> Online courses focused on canine health and nutrition.
**Audience:** Dog owners seeking to improve pet health through diet
**Wedge:** Expert-led courses with actionable insights
**Why you:** Access to network for beta testing and initial feedback
**Why now:** Increasing focus on pet wellness and organic diets
**Monetization:** Paid courses
**First step:** Survey dog owners about interest in health and nutrition courses
**Fit scores:** skill:7 dist:8 speed:6 money:6

**Zone: Dog Owner Products**
*Developing unique pet products that cater to the needs of dog owners has a tangible market with existing purchasing habits.*

### Customizable Dog Apparel (score: 60)
> Unique, customizable clothing for dogs based on owner preference.
**Audience:** Dog owners who enjoy dressing their pets
**Wedge:** Customizability and personalization for pet fashion
**Why you:** Network of dog owners to validate product demand
**Why now:** Rise in pet personalization and fashion trends
**Monetization:** Direct sales and custom orders
**First step:** Test the concept with community feedback and pre-orders
**Fit scores:** skill:6 dist:7 speed:6 money:5

### Eco-friendly Dog Toys Subscription (score: 62)
> A subscription service for durable and sustainable toys.
**Audience:** Environmentally conscious dog owners
**Wedge:** Focus on sustainability and longevity of products
**Why you:** Potential to engage community through shared values
**Why now:** Growing eco-awareness and pet product demand
**Monetization:** Monthly subscription
**First step:** Pre-sale eco-friendly toys via email list
**Fit scores:** skill:6 dist:7 speed:6 money:5

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
#### Case 10: [I10] No code, no budget — first $500 in 30 days
**Duration:** 11.6s

**Input profile:**
```
Role: Non-technical founder
Skills / expertise: Outbound / cold outreach, Copywriting, Community management
Technical level: Little to none
Communities / networks I have access to: Freelancers / consultants, Small business owners
Goal: Build a profitable side project
Monetization preference: Subscriptions (recurring)
Preferred business type: Service business
```
**Direct instruction:** No code at all. No budget. Need to make my first $500 within 30 days. Solo operation.

**AI-parsed founder:** Role: Non-technical founder | Skills: Outbound / cold outreach, Copywriting, Community management | Communities: Freelancers / consultants, Small business owners
**Search context:** The focus is on no-code, budget-free, solo-executable ideas that leverage the founder's core skills and networks to monetize quickly and effectively within a 30-day timeframe.
**Total ideas generated:** 6

**Zone: Cold Outreach as a Service**
*Leverages founder's skill in outbound sales and communication, requires no technical implementation.*

### Freelancer Cold Outreach Package (score: 82)
> A done-for-you cold outreach service for freelancers looking to expand their client base.
**Audience:** Freelancers and consultants
**Wedge:** Expertly crafted personalized emails and outreach strategies.
**Why you:** Leverage your outreach and copywriting skills to help others land clients.
**Why now:** Freelancers need new clients more than ever in a competitive market.
**Monetization:** Offer packages starting at $200 per month.
**First step:** Reach out to freelancer communities on LinkedIn or Facebook Groups.
**Fit scores:** skill:10 dist:8 speed:9 money:8

### SMB Lead Generation Service (score: 78)
> Bespoke cold outreach campaigns for small businesses to generate quality leads.
**Audience:** Small business owners
**Wedge:** Tailored outreach sequences for specific industries.
**Why you:** Use your access to SMB networks and cold outreach expertise.
**Why now:** Small businesses are increasingly relying on personalized marketing to stand out.
**Monetization:** Charge $300 per customized campaign.
**First step:** Contact small business owners via LinkedIn groups.
**Fit scores:** skill:9 dist:7 speed:8 money:8

**Zone: Copywriting Audit and Optimization**
*Builds on the founder's skill in copywriting without needing technical tools.*

### Freelancer Profile Optimization (score: 76)
> Optimize freelancer profiles to attract and convert more clients.
**Audience:** Freelancers on platforms like Upwork and Fiverr
**Wedge:** Expertly crafted profile audits and optimization tips.
**Why you:** Use your strong copywriting experience to improve others' profiles.
**Why now:** Saturation in freelancing platforms creates a need for differentiation.
**Monetization:** Pricing at $100 per profile audit and recommendation package.
**First step:** Find freelancers within LinkedIn freelancing groups.
**Fit scores:** skill:9 dist:6 speed:8 money:7

### Sales Page Audit Service (score: 78)
> Enhance SMB sales pages to improve conversion rates.
**Audience:** Small business owners
**Wedge:** Detailed analysis and actionable improvements for sales pages.
**Why you:** Your copywriting expertise can have a direct impact on sales improvements.
**Why now:** With increasing online presence, strong copy is crucial for SMBs.
**Monetization:** Starting at $150 per sales page review and optimization.
**First step:** Approach businesses on local Facebook groups.
**Fit scores:** skill:9 dist:6 speed:8 money:8

**Zone: Community Engagement Services**
*Utilizes community management skills to offer engagement solutions without tech needs.*

### Virtual Event Engagement Facilitation (score: 76)
> Provide personalized engagement plans for virtual events.
**Audience:** Event planners and small businesses hosting webinars
**Wedge:** Custom engagement strategies tailored to each event's audience.
**Why you:** Leverage your community management skills to enhance virtual interactions.
**Why now:** With the rise of virtual events, engagement is key for effectiveness.
**Monetization:** Offer plans at $150 per event.
**First step:** Contact event organizers on Eventbrite or LinkedIn.
**Fit scores:** skill:9 dist:6 speed:7 money:7

### Business Group Engagement Boost (score: 75)
> Tailored strategies to boost activity in small business mastermind groups.
**Audience:** Leaders of business mastermind groups
**Wedge:** Strategic engagement blueprints to drive group activity.
**Why you:** Use your community management expertise to maintain vibrant group discussions.
**Why now:** More businesses are forming online communities that need active management.
**Monetization:** Charge $100 per month for a customized engagement strategy.
**First step:** Research business group leaders via social media.
**Fit scores:** skill:9 dist:5 speed:8 money:7

**Evaluator notes:**
- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)
- [ ] Distribution alignment is correct for this founder
- [ ] Hard constraints honored
- [ ] Scores are calibrated (dist score matches actual access)
- [ ] Idea count is appropriate (not padded)
**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage
**Notes:** 

---
# Side-by-Side: Profile-Only vs With Instruction

For each profile: compare what the model produced with and without the instruction.

## Profile: T01 — Senior full-stack, indie hacker

| Version | Ideas | Avg Score | Avg Dist | Zones |
|---------|-------|-----------|----------|-------|
| No instruction | 6 | 84 | 6.8 | 3 |
| With instruction | 6 | 75 | 7.5 | 3 |

**No instruction** (6 ideas):
- CI/CD Pipeline Optimization Tool (85) — dist:7
- Database Query Optimization SaaS (79) — dist:6
- Automated Invoice Reconciliation Tool (79) — dist:7
- Customer Feedback Automation System (78) — dist:6
- Micro-SaaS Launch Toolkit (97) — dist:8
- Tech Conference Preparation Platform (84) — dist:7

**With instruction** (6 ideas):
*Instruction: "I want to build something specifically for Shopify store owners. I know several ..."*
- Automated Bundle Creator (78) — dist:8
- Customer Retention Analytics (74) — dist:7
- Multichannel Marketing Dashboard (74) — dist:8
- Influencer Collaboration Finder (72) — dist:8
- Automated Profit Margin Analyzer (75) — dist:7
- Cash Flow Forecasting Tool (76) — dist:7

**Evaluator judgment:**
- Instruction improved output: [ ] Yes  [ ] No  [ ] Mixed
- Notes: 

## Profile: T02 — ML engineer, funded startup

| Version | Ideas | Avg Score | Avg Dist | Zones |
|---------|-------|-----------|----------|-------|
| No instruction | 6 | 77 | 6.2 | 3 |
| With instruction | 6 | 76 | 4.8 | 3 |

**No instruction** (6 ideas):
- AI-Powered Compliance Monitoring (76) — dist:6
- Intelligent API Management Tools (74) — dist:6
- AI Code Quality Analyzer (78) — dist:7
- Smart Feature Flag Manager (80) — dist:7
- Automated Data Cleaning Platform (74) — dist:5
- Predictive Customer Insights (80) — dist:6

**With instruction** (6 ideas):
*Instruction: "I want ideas outside of generic AI wrappers - something with real workflow lock-..."*
- Legal Contract Analysis Automation (79) — dist:6
- Supply Chain Risk Monitoring (73) — dist:5
- Workplace Safety Compliance Manager (77) — dist:5
- Food Safety Audit Helper (74) — dist:4
- Retail Demand Forecasting AI (79) — dist:4
- Precision Agriculture Analytics (75) — dist:5

**Evaluator judgment:**
- Instruction improved output: [ ] Yes  [ ] No  [ ] Mixed
- Notes: 

## Profile: S04 — Student athlete, league organizer

| Version | Ideas | Avg Score | Avg Dist | Zones |
|---------|-------|-----------|----------|-------|
| No instruction | 7 | 82 | 7.6 | 4 |
| With instruction | 4 | 83 | 7.5 | 3 |

**No instruction** (7 ideas):
- LeagueHub (86) — dist:8
- YouthCoachConnect (80) — dist:7
- CampusInsight (80) — dist:7
- DormBuddy (81) — dist:8
- PlayAnalyser (82) — dist:7
- FitTrack Jr. (83) — dist:8
- RefereeConnect (81) — dist:8

**With instruction** (4 ideas):
*Instruction: "I run 3 intramural leagues and every single admin task is in Google Sheets or Gr..."*
- LeagueAdmin Pro (86) — dist:8
- Intramural Scheduler (84) — dist:7
- TeamTalk (82) — dist:8
- PlayerConnect (80) — dist:7

**Evaluator judgment:**
- Instruction improved output: [ ] Yes  [ ] No  [ ] Mixed
- Notes: 

## Profile: N01 — B2B sales, no coding

| Version | Ideas | Avg Score | Avg Dist | Zones |
|---------|-------|-----------|----------|-------|
| No instruction | 6 | 73 | 6.8 | 3 |
| With instruction | 6 | 77 | 7.2 | 3 |

**No instruction** (6 ideas):
- Outbound Outreach Automation (79) — dist:7
- CRM Cleanup and Enhancement (77) — dist:8
- Freelancer Proposal Generator (74) — dist:6
- Contract Automation Platform (68) — dist:6
- Simple Client Tracker (70) — dist:7
- Customer Feedback Collector (68) — dist:7

**With instruction** (6 ideas):
*Instruction: "No coding. Want something I can build or operate without developers. Fast moneti..."*
- Virtual Sales Assistant Service (81) — dist:8
- CRM Optimization Consultancy (78) — dist:7
- Email Follow-Up Automation Service (78) — dist:7
- Recurring Task Scheduling Service (71) — dist:6
- Sales Mastery Workshops (80) — dist:8
- Subscription-Based Sales Training Platform (76) — dist:7

**Evaluator judgment:**
- Instruction improved output: [ ] Yes  [ ] No  [ ] Mixed
- Notes: 

## Profile: N03 — UI/UX designer, funded startup

| Version | Ideas | Avg Score | Avg Dist | Zones |
|---------|-------|-----------|----------|-------|
| No instruction | 6 | 72 | 6.7 | 3 |
| With instruction | 6 | 78 | 5.5 | 3 |

**No instruction** (6 ideas):
- Real-Time Design Feedback Platform (77) — dist:7
- Design System Management SaaS (77) — dist:7
- AI-Powered User Persona Generator (68) — dist:6
- Feature Prioritization Dashboard (68) — dist:6
- Lean Design Audit Tool (71) — dist:7
- UX Feedback In a Click (71) — dist:7

**With instruction** (6 ideas):
*Instruction: "I want to build something that solves a real designer or PM workflow problem. No..."*
- Design Handoff Automation Tool (81) — dist:6
- Design Asset Version Control (75) — dist:5
- Design Brief Alignment Platform (78) — dist:6
- Design-PM Task Sync Tool (76) — dist:6
- Automated Design System Update Tool (79) — dist:5
- Design System Audit Platform (78) — dist:5

**Evaluator judgment:**
- Instruction improved output: [ ] Yes  [ ] No  [ ] Mixed
- Notes: 

## Profile: D04 — Twitch streamer + developer

| Version | Ideas | Avg Score | Avg Dist | Zones |
|---------|-------|-----------|----------|-------|
| No instruction | 4 | 73 | 7.5 | 3 |
| With instruction | 4 | 82 | 8.5 | 3 |

**No instruction** (4 ideas):
- Streamline (75) — dist:8
- ClipPro (70) — dist:7
- Discord Engagement Booster (75) — dist:8
- CreatorBi (70) — dist:7

**With instruction** (4 ideas):
*Instruction: "Wants solo SaaS under $500/mo to start. Prove the market before going bigger."*
- Stream Schedule Automator (78) — dist:9
- Content Repurposing Bot (89) — dist:9
- Custom Discord Bot Platform (78) — dist:8
- Integrated Content Calendar (82) — dist:8

**Evaluator judgment:**
- Instruction improved output: [ ] Yes  [ ] No  [ ] Mixed
- Notes: 

## Profile: D08 — Youth sports organizer

| Version | Ideas | Avg Score | Avg Dist | Zones |
|---------|-------|-----------|----------|-------|
| No instruction | 6 | 82 | 7.0 | 3 |
| With instruction | 3 | 82 | 7.7 | 3 |

**No instruction** (6 ideas):
- Youth Sports Scheduling Platform (81) — dist:7
- Parent-Coach Communication Hub (88) — dist:8
- Event Task Management Tool (78) — dist:6
- Event Volunteer Management System (84) — dist:7
- Athlete Performance Tracking App (80) — dist:7
- Virtual Coaching Assistant (83) — dist:7

**With instruction** (3 ideas):
*Instruction: "I coordinate 6 youth leagues. Scheduling, communications, payments, and rosters ..."*
- LeagueMaster (85) — dist:8
- TeamConnect (80) — dist:8
- PayPlay (82) — dist:7

**Evaluator judgment:**
- Instruction improved output: [ ] Yes  [ ] No  [ ] Mixed
- Notes: 

## Profile: E01 — Weak distribution, generic interests

| Version | Ideas | Avg Score | Avg Dist | Zones |
|---------|-------|-----------|----------|-------|
| No instruction | 6 | 80 | 3.7 | 3 |
| With instruction | 6 | 66 | 5.3 | 3 |

**No instruction** (6 ideas):
- Automated Client Onboarding Tool (82) — dist:4
- Team Collaboration Optimizer (82) — dist:4
- Personal Finance Tracker for Freelancers (75) — dist:3
- Content Monetization Dashboard for Creators (75) — dist:3
- Code Review Assistant (82) — dist:4
- Developer Onboarding Toolkit (82) — dist:4

**With instruction** (6 ideas):
*Instruction: "I want to build a SaaS. Interested in fitness, gaming, and productivity."*
- Personal Trainer Client Management Tool (66) — dist:6
- Online Fitness Class Booking System (66) — dist:5
- Streamer Task Manager (64) — dist:5
- Gamer Time Tracker (64) — dist:5
- Developer Daily Planner (70) — dist:6
- Focus Mode Scheduler (68) — dist:5

**Evaluator judgment:**
- Instruction improved output: [ ] Yes  [ ] No  [ ] Mixed
- Notes: 

## Profile: E02 — Broad consumer communities

| Version | Ideas | Avg Score | Avg Dist | Zones |
|---------|-------|-----------|----------|-------|
| No instruction | 6 | 53 | 8.2 | 3 |
| With instruction | 6 | 64 | 7.8 | 3 |

**No instruction** (6 ideas):
- Campus Event Management Service (58) — dist:9
- Student Budgeting Tool (54) — dist:9
- Pet Wellness Subscription Box (56) — dist:8
- Pet Owner Community Platform (50) — dist:8
- Car Modification Marketplace (48) — dist:7
- Car Meetup Event Coordination Service (54) — dist:8

**With instruction** (6 ideas):
*Instruction: "I want to build something for dog owners specifically. I personally know hundred..."*
- Pet Playdate Coordination Service (66) — dist:9
- Mobile Dog Grooming Marketplace (64) — dist:8
- Dog Training Tips Newsletter (68) — dist:8
- Dog Health & Nutrition Courses (65) — dist:8
- Customizable Dog Apparel (60) — dist:7
- Eco-friendly Dog Toys Subscription (62) — dist:7

**Evaluator judgment:**
- Instruction improved output: [ ] Yes  [ ] No  [ ] Mixed
- Notes: 

## Profile: E03 — No code, no budget

| Version | Ideas | Avg Score | Avg Dist | Zones |
|---------|-------|-----------|----------|-------|
| No instruction | 4 | 82 | 7.0 | 3 |
| With instruction | 6 | 78 | 6.3 | 3 |

**No instruction** (4 ideas):
- Freelancer Cold Outreach Platform (88) — dist:8
- Copywriting Templates for Freelancers (83) — dist:7
- Automated Outreach Generator for SMBs (82) — dist:6
- Freelancer Learning Hub (76) — dist:7

**With instruction** (6 ideas):
*Instruction: "No code at all. No budget. Need to make my first $500 within 30 days. Solo opera..."*
- Freelancer Cold Outreach Package (82) — dist:8
- SMB Lead Generation Service (78) — dist:7
- Freelancer Profile Optimization (76) — dist:6
- Sales Page Audit Service (78) — dist:6
- Virtual Event Engagement Facilitation (76) — dist:6
- Business Group Engagement Boost (75) — dist:5

**Evaluator judgment:**
- Instruction improved output: [ ] Yes  [ ] No  [ ] Mixed
- Notes: 
