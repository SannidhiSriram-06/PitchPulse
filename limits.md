# PitchPulse Hosting & API Limits Reference

This document serves as the single source of truth for the free tier resource constraints across our entire stack, incorporating details from our hosting environments: **Vercel** (frontend), **Render** (API backend), and **Supabase** (PostgreSQL database).

---

## 1. Groq API Free Tier Quotas
Groq enforces strict quotas based on Requests per Minute (RPM), Requests per Day (RPD), Tokens per Minute (TPM), and Tokens per Day (TPD).

| Model ID / Name | RPM | RPD | TPM | TPD |
| :--- | :--- | :--- | :--- | :--- |
| **`llama-3.1-8b-instant`** | 30 | 14.4K | 6K | 500K |
| **`llama-3.3-70b-versatile`** | 30 | 1.0K | 12K | 100K |
| **`meta-llama/llama-4-scout-17b-16e-instruct`** | 30 | 1.0K | 30K | 500K |
| **`groq/compound`** | 30 | 250 | 70K | N/A |
| **`groq/compound-mini`** | 30 | 250 | 70K | N/A |
| **`openai/gpt-oss-120b`** | 30 | 1.0K | 8K | 200K |

> [!WARNING]
> **TPM Constraints**: The TPM limit is shared organization-wide. If `llama-3.1-8b-instant` has a **6K TPM** limit, a single full brief generation (typically containing ~3K to 5K input tokens due to search contexts plus ~1K output tokens) will immediately trigger a `429 Too Many Requests` error. 

---

## 2. Render Free Tier Constraints (Backend API)
Render hosts our Python Flask API and has several runtime constraints (from [render free tier.md](file:///Users/sannidhidurgapavansriram/Sriram/My%20Edu/BITSOM%20Programs/Pitchpulse_Upgrade/render%20free%20tier.md)):

* **Inactivity Auto-Sleep**: Web services automatically spin down (sleep) after 15 minutes of inactivity. The next incoming request will trigger a cold-start delay of **30 to 60 seconds**.
* **RAM & CPU Caps**: Free instances are limited to **512 MB RAM** and **0.1 vCPU**. 
  * *OOM Risk*: Heavy synchronous file processing (e.g., extracting text from multi-megabyte PDFs using PyPDF2) or running multiple CPU-intensive threads will crash the container.
* **Monthly Instance Hours Pool**: Workspaces receive **750 Free instance hours** per month. Hours are consumed whenever a free web service is running. If you consume all 750 hours, all Free web services in that workspace are suspended.
* **Bandwidth & Build Time**: 
  * Outbound bandwidth is capped at **5 GB per month** across the workspace.
  * Build pipeline minutes are capped at **500 minutes per month**.
* **Request Timeout**: Render enforces a hard HTTP request execution timeout of **100 seconds**.
* **Database (Render Postgres)**: Render Postgres has a **strict 30-day expiry**, after which the database is deleted. *Because of this, PitchPulse uses Supabase instead.*

---

## 3. Supabase Free Tier Constraints (PostgreSQL Database)
Supabase hosts our production database and handles state storage (from [supabase free tier.md](file:///Users/sannidhidurgapavansriram/Sriram/My%20Edu/BITSOM%20Programs/Pitchpulse_Upgrade/supabase%20free%20tier.md)):

* **Database Storage Size**: 500 MB database size limit.
* **Inactivity Pause**: Free projects will be automatically paused after **1 week of inactivity**.
* **Authentication**: Up to **50,000 Monthly Active Users (MAUs)**.
* **Realtime Connections**: Up to **200 concurrent connections** and 2 million messages per month.
* **Storage limits**: 1 GB file storage size with **2 GB per month** bandwidth.

---

## 4. Vercel Free Tier Constraints (Frontend)
Vercel hosts the React + Vite static assets (from [vercel free tier.md](file:///Users/sannidhidurgapavansriram/Sriram/My%20Edu/BITSOM%20Programs/Pitchpulse_Upgrade/vercel%20free%20tier.md)):

* **Bandwidth Limit**: Capped at **100 GB per month**.
* **Deployments per Day**: Up to **100 deployments**.
* **Image Optimization**: First **5,000 images transformed** per month.
* **Serverless Functions Invocations**: 1,000,000 invocations / month included.
* **Maximum Function Duration (Timeout)**: Up to 10 seconds (default for Hobby plan; can be configured up to 300 seconds under Pro configurations, but Hobby has a hard default).
