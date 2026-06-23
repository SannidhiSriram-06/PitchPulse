# Render Hobby Tier (Free Plan) Specifications

## Overview
The **Hobby Workspace Plan** on Render is free ($0/month) and designed for building personal projects, prototypes, and testing out the platform. Render separates workspace plan costs from specific compute/service tier pricing. Under the free tier, several service types are completely free but come with explicit usage hard limits and behaviors.

* **Price:** $0 / month (Hobby Workspace)
* **Team Members:** Max 1 user (Single-user workspace).
* **Service Limit:** Up to 25 total services per workspace (includes all active and suspended services).
* **Intended Use:** Non-production testing, hobby applications, or previewing developer experience.

---

## 1. Static Sites (Always Free)
* **Price:** $0 / month.
* **Global CDN:** Includes a lightning-fast CDN with instant cache invalidation.
* **CI/CD:** Automatic continuous deployments from connected Git repositories.
* **Custom Domains:** Fully managed TLS certificates.

---

## 2. Web Services (Free Compute Instance)
* **Hardware Specs:** 512 MB RAM and 0.1 vCPU.
* **Languages Supported:** Node, Python, Go, Rust, Ruby, Elixir, and custom Docker containers.
* **Spin Down on Idle (Cold Starts):** Render will automatically spin down a Free web service if it goes **15 minutes** without receiving any inbound HTTP traffic or WebSocket requests. Spinning back up on the next request introduces a **30 to 60-second cold-start latency**.
* **Monthly Instance Hours Pool:** Workspaces receive **750 Free instance hours** per month. Hours are consumed whenever a free web service is running. If you consume all 750 hours, all Free web services in that workspace are suspended until the next month's reset.
* **Exclusions & Limitations:**
    * Free web services **cannot** scale beyond a single instance (no horizontal autoscaling).
    * No support for persistent disks.
    * No edge caching.
    * No ability to run one-off jobs.
    * No shell access (via SSH or the Render Dashboard).
    * Cannot receive private network traffic (can only send requests).
    * Blocked outbound SMTP traffic on ports 25, 465, and 587.

---

## 3. Render Postgres (Free Instance)
* **Price:** $0 (with a strict time restriction).
* **Hardware Specs:** 256 MB RAM, 0.1 vCPU, 100 connection limit.
* **Storage Size:** 1 GB fixed storage capacity.
* **Strict 30-Day Expiry:** Free Postgres databases **expire and are deleted exactly 30 days after creation**. Once expired, the database is inaccessible and data is deleted unless upgraded to a paid instance type before the limit hits.
* **Workspace Limit:** Only 1 Free Render Postgres database can be active per workspace.
* **Other Limitations:** No automated backups, no point-in-time recovery (PITR), and no high availability (HA).

---

## 4. Render Key Value (Free Redis-Compatible Storage)
* **Price:** $0 / month.
* **Hardware Specs:** 25 MB RAM, 50 connection limit.
* **In-Memory Only:** Free Key Value instances **do not persist data to disk**. If the instance restarts or Render undergoes maintenance, all data is immediately lost.
* **Workspace Limit:** Only 1 Free Key Value instance can be active per workspace.
* **Upgrade Notice:** If you upgrade a Free Key Value instance to a paid instance type, its data is lost during the migration process.

---

## 5. Network, Bandwidth, & Build Pipelines
* **Outbound Bandwidth:** **5 GB per month** included across the workspace. Additional bandwidth is charged at $0.15 per GB. If no payment method is added and you hit the limit, services are suspended for the month.
* **Build Pipeline Minutes:** **500 minutes per month** included.
* **Custom Domains:** **2 custom domains included** per workspace. Additional domains cost $0.25/domain/month.
