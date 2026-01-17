# Building a unified delivery tracking dashboard for home use

**No major delivery platform offers a consumer-facing API for personal order tracking**, making this project an exercise in creative integration rather than straightforward API consumption. The viable path forward combines browser automation for session-based platforms, email/SMS parsing for tracking number extraction, and third-party carrier APIs for package locations. DoorDash and Uber Eats provide merchant/driver APIs but explicitly block consumer access; Amazon's real-time driver tracking endpoint has been reverse-engineered by security researchers; and most grocery platforms route through Instacart's infrastructure.

This report provides actionable technical approaches for each platform, a recommended full-stack architecture, and security patterns for managing credentials across 11+ services.

---

## Platform integration reality check

The delivery tracking landscape divides into three categories based on integration difficulty. **Food delivery apps** (DoorDash, Uber Eats, Instacart, Shipt) have the tightest security with certificate pinning and aggressive bot detection. **Retail giants** (Amazon, Walmart) require sophisticated browser automation due to multi-factor authentication and device fingerprinting. **Specialty services** (Drizly, Total Wine) often use white-label delivery platforms like Onfleet that have more accessible APIs.

Every platform examined prohibits automated access in their Terms of Service. For personal use tracking your own orders, the legal risk is minimal, but expect ongoing maintenance as platforms frequently change their authentication flows and API endpoints.

---

## DoorDash: Webhook-based tracking for merchants only

DoorDash provides a well-documented **Drive API** for businesses requesting deliveries, but consumer order tracking remains locked behind their mobile app. The official API uses JWT authentication with HS256 signing, requiring a `developer_id`, `key_id`, and `signing_secret` obtained through their certification program.

**Reverse-engineered endpoints** discovered through the archived `n0shake/dash` GitHub repository reveal a consumer API pattern at `https://api.doordash.com/v2/restaurant/` for restaurant data. The more valuable tracking endpoint lives on `track.doordash.com`, which renders a JavaScript-based tracking page requiring authenticated session cookies.

For real-time driver location, **DoorDash offers webhooks** that update every 30 seconds with events like `DASHER_ENROUTE_TO_PICKUP` and `DASHER_CONFIRMED_DROPOFF_ARRIVAL`, including GPS coordinates in `{"lat": 43.333, "lng": -79.333}` format. However, webhook access requires contacting support and is reserved for Drive API partners, not consumer accounts.

The most viable approach for personal tracking: **scrape the authenticated web tracking page** using Puppeteer with persistent session cookies, or build a Chrome extension that intercepts tracking data client-side. The **BiteStats** and **SnackStats** browser extensions already accomplish this for order history and spending analytics.

---

## Uber Eats: OAuth ecosystem with partner restrictions

Uber's developer platform provides the **Marketplace API** for restaurants and the **Direct API** for delivery-as-a-service, both using OAuth 2.0 with a 30-day access token lifespan and one-year refresh tokens. The token endpoint at `https://auth.uber.com/oauth/v2/token` accepts both client credentials and authorization code grants.

Key scopes include `eats.store` for store data, `eats.order` for order processing, and `eats.report` for reporting access. However, production approval requires **99% order injection success rate** and explicit whitelisting by Uber's team—barriers designed for restaurant integrations, not personal tracking.

**Certificate pinning** on the mobile app makes traffic interception challenging. Security researchers report success using Frida for runtime SSL bypass combined with mitmproxy, but this requires a rooted Android device or jailbroken iOS. The web application presents an easier target—network inspection reveals GraphQL endpoints that handle order status and tracking metadata.

Consumer tracking data flows through the `order_tracking_metadata` field for "Bring Your Own Courier" orders, but standard Uber-fulfilled orders use proprietary driver location updates not exposed through any documented endpoint.

---

## Instacart: The gateway to Costco and grocery chains

Instacart powers same-day delivery for **Costco** (via `sameday.costco.com`), **Sam's Club**, and numerous grocery chains, making it a high-value integration target. Their **Connect API** uses OAuth 2.0 with client credentials flow at `https://connect.instacart.com/v2/oauth/token`, with tokens valid for 24 hours.

Available scopes—`connect:fulfillment`, `connect:data_ingestion`, and `connect:orders`—are designed for retail partners integrating fulfillment into their own platforms. Rate limiting enforces requests-per-second caps, returning 429 errors when exceeded.

**GitHub repositories** offer glimpses into the consumer API. The `kleinjm/instacart_api` Ruby wrapper and `marcobeltempo/InstacWrapper` Node.js library reveal session-based authentication patterns:

```javascript
// From InstacWrapper - session-based consumer access
login(email, password)           // Returns session token
getDeliveryTimes(retailerName)   // Check availability
getRetailers()                   // List retailers for address
```

The V3 REST API handles consumer functionality through email/password login returning session tokens. Social login (Google, Facebook, Apple) complicates automation since these OAuth flows aren't supported by the unofficial libraries.

For **Costco delivery tracking** specifically, the integration routes entirely through Instacart's infrastructure. Real-time shopper location, chat functionality, and status updates (`Order Placed → Shopper Assigned → Shopping → Delivery → Delivered`) display in the Instacart app after authenticating with your Costco-linked account.

---

## Amazon: The most heavily fortified tracking system

Amazon presents the most sophisticated anti-automation measures of any platform, employing **text and image CAPTCHAs**, browser fingerprinting (User-Agent, WebGL renderer, system fonts), behavioral analysis (mouse movements, scrolling patterns), IP rate limiting, and device fingerprinting to detect headless browsers.

Despite this, security researchers at Pen Test Partners documented Amazon's **real-time driver tracking endpoint**:

```
GET /DEANSExternalPackageLocationDetailsProxy/trackingObjectId/{TRACKING_ID}/clientName/AMZL
Host: securephotostorageservice-eu-external.amazon.co.uk
```

This endpoint returns GPS coordinates, stops remaining, and ETA—contradicting Amazon's public claim that tracking is limited to "10 stops prior." The required cookies include `session-id`, `ubid-main` (unique browser ID), `at-main` (authentication token), and `sess-at-main` (session auth token).

**Bypass strategies** require layered approaches. Stealth plugins like `undetected-chromedriver`, `Puppeteer Stealth`, or `SeleniumBase` mask automation signatures. Residential proxy rotation defeats IP blocking. Human-like timing with random delays between 2-7 seconds mimics organic behavior. For MFA challenges, the `Amazon-Order-History` GitHub project handles email/SMS verification codes via Selenium browser automation.

The **Selling Partner API** (SP-API)—which replaced MWS in March 2024—provides shipping and tracking endpoints for sellers, not consumers. The `getTrackingInformation` operation returns carrier info and GPS coordinates, but requires seller credentials.

---

## Walmart+: Marketplace APIs without consumer tracking

Walmart's developer portal offers the **Marketplace Orders API** with OAuth 2.0 authentication, using 15-minute access tokens refreshed via client credentials:

```bash
POST https://marketplace.walmartapis.com/v3/token
Authorization: Basic {base64(clientId:clientSecret)}
```

Required headers include `WM_QOS.CORRELATION_ID` (UUID), `WM_SVC.NAME`, and `WM_CONSUMER.CHANNEL.TYPE`. Order status values progress through `Created → SentForFulfillment → Shipped → Delivered → Cancelled`, with tracking info embedded in shipping confirmation payloads containing carrier name, tracking number, and tracking URL.

For **consumer orders**, no API access exists. The `Walmart-Invoice-Exporter` Chrome extension (GitHub: `hppanpaliya/Walmart-Invoice-Exporter`) demonstrates web scraping with 24-hour cached orders, extracting data directly from walmart.com order history pages. Similar Puppeteer automation can capture tracking information post-authentication.

**Sam's Club** shares Walmart's infrastructure patterns but has even less developer documentation. Express delivery tracking appears only in the Sam's Club app and order history web pages.

---

## Alcohol delivery: Drizly and Total Wine

**Drizly**, now owned by Uber, exposes a RESTful API discovered through the `DrizlyDash` project—an Amazon Dash Button integration for one-tap alcohol ordering. The workflow involves account creation, login for session token, store/product queries, and order submission. Environment variables store authentication credentials, default address, and payment info.

Given Uber's 2021 acquisition, expect Drizly's infrastructure to consolidate with Uber's authentication systems, potentially simplifying integration through Uber's existing OAuth ecosystem.

**Total Wine** uses **Onfleet** for last-mile delivery management, which provides a documented API:

```
POST /tasks         - Create delivery task
GET /tasks/{id}     - Get task details  
GET /workers/{id}/location - Real-time driver location
```

Onfleet webhooks push status updates automatically. Third-party tracking aggregators like **AfterShip** and **TrackingMore** already support Total Wine shipments, offering a simpler integration path than direct Onfleet API access.

---

## Recommended architecture: FastAPI backend with React frontend

For a self-hosted delivery dashboard, the stack balances performance, developer experience, and zero ongoing costs.

**Backend: FastAPI (Python)** emerges as the optimal choice for real-time applications. Native WebSocket support via Starlette eliminates additional dependencies. Full async/await enables concurrent polling of multiple delivery APIs—critical when aggregating 11+ services. Type hints with Pydantic provide automatic validation and documentation.

```python
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)
```

**Frontend: React with Tremor components** provides the richest ecosystem for dashboards. Tremor, recently acquired by Vercel, offers **35+ dashboard-specific components** including KPI cards, charts, and data tables—all with built-in dark mode and responsive breakpoints. For highly custom UI elements, supplement with shadcn/ui's accessible primitives.

**Maps: MapLibre GL** delivers WebGL-powered vector tile rendering with **zero usage limits**, unlike Mapbox's 50,000 monthly free loads. Compatible with free OpenStreetMap tiles, it handles multiple simultaneous driver markers efficiently through GeoJSON clustering.

**Real-time communication: Server-Sent Events** for server-push updates with automatic reconnection, WebSocket when bidirectional communication is needed. SSE consumes 30-40% fewer server resources than WebSocket while providing the simpler programming model a dashboard requires.

**Deployment: Docker Compose with Caddy** reverse proxy provides automatic HTTPS via Let's Encrypt with zero configuration. The full stack runs on a Raspberry Pi or small home server.

---

## Data flow and polling architecture

Each delivery platform requires different polling strategies based on update frequency and API availability.

The backend creates a unified schema normalizing responses across all services:

```python
class DeliveryUpdate(BaseModel):
    id: str
    service: str           # "amazon", "doordash", "instacart"
    status: str            # Normalized: pending, shopping, in_transit, delivered
    location: Optional[tuple[float, float]]
    eta: Optional[datetime]
    driver_name: Optional[str]
    stops_remaining: Optional[int]
```

**Polling intervals** vary by platform: Amazon driver tracking updates every 30 seconds during active delivery; DoorDash webhooks push every 30 seconds; Instacart shopper updates arrive every 1-2 minutes. For platforms without real-time endpoints, poll order status pages every 2-5 minutes.

A **circuit breaker pattern** prevents cascading failures when individual platforms are unreachable. Cache responses with TTL to reduce redundant requests, particularly for authentication tokens approaching expiry.

---

## Credential security and session persistence

Managing credentials across 11+ platforms demands careful security architecture.

**OS-level keychain integration** via `node-keytar` (Node.js) or `keyring` (Python) stores credentials in macOS Keychain, Windows Credential Vault, or Linux Gnome Keyring—encrypted by the operating system rather than application code.

```javascript
const keytar = require('keytar');
await keytar.setPassword('DeliveryTracker', 'doordash', encryptedToken);
const token = await keytar.getPassword('DeliveryTracker', 'doordash');
```

**Cookie jar management** with `tough-cookie` maintains separate session state per platform, preventing cross-service leakage:

```javascript
const jars = {
  doordash: new CookieJar(),
  ubereats: new CookieJar(),
  amazon: new CookieJar()
};
```

**Puppeteer session persistence** saves and restores cookies plus localStorage between runs:

```javascript
async saveSession(page, filePath) {
  const cookies = await page.cookies();
  const storage = await page.evaluate(() => ({
    localStorage: JSON.stringify(localStorage),
    sessionStorage: JSON.stringify(sessionStorage)
  }));
  fs.writeFileSync(filePath, JSON.stringify({ cookies, storage }));
}
```

**Token refresh automation** maintains long-lived sessions by proactively refreshing tokens 5 minutes before expiry, avoiding authentication disruption during active tracking.

For local HTTPS, **mkcert** generates locally-trusted certificates without the complexity of self-signed certificate warnings. Never share the generated `rootCA-key.pem`—it can intercept all secure requests from your machine.

---

## Existing projects to leverage

Several open-source projects provide foundational code and patterns worth examining.

**Karrio** stands out as a comprehensive shipping API platform supporting label generation, tracking, and carrier management—self-hostable as an alternative to commercial multi-carrier APIs. The Python/Docker architecture demonstrates patterns for normalizing data across dozens of carriers.

**PackageMate** offers a complete MERN stack (MongoDB, Express, React, Node) self-hosted package tracker supporting USPS, UPS, FedEx, and OnTrac. It combines carrier APIs with scraping fallbacks, providing a reference implementation for the hybrid approach this project requires.

**LibreTrack** prioritizes privacy as a cross-platform tracking app using carrier accounts directly without third-party services—a philosophy aligned with self-hosted dashboard goals.

**Browser extensions** like **BiteStats** (DoorDash, Grubhub) and **SnackStats** (Uber Eats, DoorDash, SkipTheDishes) demonstrate client-side scraping techniques for extracting order data from authenticated web sessions.

For traffic analysis, **mitmproxy** with the `android-unpinner` tool bypasses certificate pinning in Android APKs, enabling API endpoint discovery on mobile apps with Frida-based SSL bypass.

---

## Implementation roadmap

The pragmatic approach prioritizes platforms by integration feasibility, building incrementally.

**Phase 1: Email-based tracking** parses shipping confirmation emails from all platforms, extracts tracking numbers using regex patterns, and queries carrier APIs (UPS, FedEx, USPS) through AfterShip or 17TRACK's free tier. This provides universal coverage without platform-specific integration.

**Phase 2: Browser automation core** implements Puppeteer with persistent sessions for Amazon, DoorDash, and Uber Eats web tracking pages. Stealth plugins mask automation signatures; scheduled polling captures order status and driver location when available.

**Phase 3: Instacart integration** covers Costco, Sam's Club, and grocery chains through a single session-based integration. The unified Instacart infrastructure means one scraping implementation unlocks multiple retail brands.

**Phase 4: Chrome extension complement** intercepts tracking data client-side as a passive monitoring layer, capturing real-time updates from open browser tabs across all platforms without server-side polling.

The resulting dashboard aggregates delivery status, maps driver locations when available, and surfaces ETAs across the fragmented delivery landscape—all running locally without cloud dependencies or ongoing costs.

---

## Conclusion

Building a unified delivery tracking dashboard requires embracing the messy reality that **consumer tracking APIs don't exist**. The solution combines multiple technical approaches: browser automation with session persistence for authenticated platforms, email parsing for tracking number extraction, third-party carrier APIs for package location, and client-side extensions for real-time data capture.

The **FastAPI + React + MapLibre + Caddy** stack provides a robust, free foundation suitable for Raspberry Pi deployment. Security depends on OS-level credential storage and proper session isolation between platforms. Expect ongoing maintenance as platforms evolve their authentication and anti-automation measures—but for personal use, the engineering investment yields a genuinely useful aggregated view of delivery chaos.