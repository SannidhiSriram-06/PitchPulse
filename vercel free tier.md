# Vercel Hobby Tier (Free Plan) Specifications

## Overview
The **Hobby Plan** is free forever and serves as Vercel’s entry point for individual developers building personal web apps, portfolios, or experimental projects. 

* **Price:** $0 / month
* **Target Audience:** Solo developers, hobbyists, personal projects
* **Commercial Use:** **Strictly Prohibited.** Usage is restricted to non-commercial, non-revenue-generating personal projects.
* **Limit Behavior:** Hard cap. If you exceed the included usage allocations, your application or specific services will be paused until the next 30-day reset cycle (no automatic overage billing).

---

## 1. Core Hosting, CI/CD, & Delivery Network
* **Deployments per Day:** Up to 100 deployments.
* **Projects Limitation:** Up to 200 projects per account (maximum of one Hobby team/account format).
* **Build Infrastructure:**
    * **Build vCPUs:** 4 vCPUs (Standard machine type).
    * **Build Memory:** 8 GB RAM.
    * **Build Disk Size:** 32 GB.
* **Custom Domains:** Up to 50 domains per project.
* **Automatic CI/CD:** Connected git repositories (GitHub, GitLab, Bitbucket) build and deploy automatically on every push.
* **Global Edge CDN:** Automatic global content delivery network caching.

---

## 2. Infrastructure & Compute Limits
* **Fast Data Transfer (Bandwidth):** 100 GB / month included.
* **Edge Requests:** 1,000,000 requests / month included.
* **Serverless Function Invocations:** 1,000,000 invocations / month included.
* **Active CPU Execution:** 4 CPU-hours / month included (Fluid Compute model: only charges when CPU is processing code, not during I/O wait).
* **Provisioned Memory:** 360 GB-hours / month included.
* **Maximum Function Duration (Timeout):** Up to 300 seconds (5 minutes). 

---

## 3. Storage & Native Databases
* **Vercel Blob:**
    * **Storage Size:** 1 GB / month included.
    * **Simple Operations:** First 10,000 operations / month included.
    * **Advanced Operations:** First 2,000 operations / month included.
    * **Blob Data Transfer:** First 10 GB / month included.
* **Edge Config:**
    * **Edge Config Reads:** First 100,000 reads / month included.
    * **Edge Config Writes:** First 100 writes / month included.

---

## 4. Optimization & Media
* **Image Optimization (Transformations):** First 5,000 images transformed / month included.
* **Image Cache Reads:** First 300,000 reads / month included.
* **Image Cache Writes:** First 100,000 writes / month included.

---

## 5. Analytics & Observability
* **Web Analytics:** 50,000 events / month included (1 project, with 1 month of historical data retention). Collection pauses after the limit is reached and resets after 7 days or the monthly reset.
* **Speed Insights:** First 10,000 events / month included.

---

## 6. Advanced Features, AI, & Workflows
* **Vercel Workflows:**
    * **Events:** 50,000 events / month included.
    * **Data Written:** 1 GB / month included.
* **Vercel Sandbox:**
    * **Active CPU:** 5 hours / month included.
    * **Provisioned Memory:** 420 GB-hours / month included.
    * **Creation:** 5,000 sandboxes / month included.
    * **Network (Data Transfer):** 20 GB / month included.
    * **Concurrent Sandboxes:** Up to 10 simultaneous active sandboxes.
    * **Sandbox Storage:** 15 GB total storage.
* **Microfrontends:** 2 included projects supporting up to 50,000 routed requests / month.
* **Vercel Connect:** 5,000 requests / month included.
* **AI Gateway:** Basic features included under the free tier (Bring Your Own Key).

---

## 7. Security & Protection
* **DDoS Mitigation:** Automated mitigation against Layer 3, 4, and 7 DDoS attacks.
* **Web Application Firewall (WAF):** Included basic features.
    * **Optional Attack Challenge Mode:** Available and turned on by default.
    * **IP Blocking:** Up to 3 custom rules.
    * **Custom Rules:** Up to 3 custom firewall rules.
* **Deployment Protection:** Vercel Authentication enabled for deployment privacy.
* **Bot Management:** Basic structural checks included.

---

## 8. Exclusions & Limitations (What is NOT Included)
* **Team Collaboration:** No multiple user seats or role management (strictly single-user account).
* **Support:** Community support only (no dedicated email support, ticketing priority, or SLAs).
* **Advanced Add-ons:** Features like SAML Single Sign-On (SSO), HIPAA BAA compliance, Log Drains, Password Protection, and Custom Environment Configurations are excluded.
* **Spend Management:** No configuration for spend alerts or flexible overages (since it hard-caps at $0).
