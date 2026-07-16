# 🎤 5-Minute Presentation Speech
> ~720 words ≈ 5:00 at a normal speaking pace. Timing cues in brackets.
> Deliver the bolded lines with a pause after them — they're the punches.

---

**[0:00 — The hook]**

Let me start with a person, not a product. A woman in Pune walks home every night through a lane where the street lights died months ago. She wants to complain — but the government portal wants typed English, a photo she can't safely take, and it will route her complaint to the wrong department anyway. So she gives up. Millions of Indians give up every single day.

We built a grievance system where giving up is no longer the rational choice. **It's a portal where the AI works for the citizen — and nobody can lie to the system.**

**[0:40 — The problem, precisely]**

Public grievance portals fail at three exact points. One: routing — complaints reach the wrong department and silently die. Two: resolution — a department clicks "Resolved," nothing was fixed, and there is no proof either way. Three: access — if you can't type English, you effectively have no right to complain. Everything we built attacks one of these three failures.

**[1:10 — Feature one: speak it, in any language]**

First: filing a complaint now takes thirty seconds and zero literacy. You pick your language — Hindi, Marathi, Tamil, Telugu, Kannada, Bengali, Gujarati or English — press the mic, and just *speak*. Your words appear live, and then our locally-running AI translates them into a formal English complaint, writes the title for you, and routes it. The entire website itself also runs in all eight languages — and even if you *type* in your own language, the AI translates it before processing. **Language is no longer a barrier between a citizen and their government.**

**[1:55 — Feature two: AI routing and priority]**

The moment a complaint lands, a local LLM classifies it — department, category, severity, keywords — and a transparent priority engine scores it out of 100: safety risk, public impact, essential services, urgency, duplicates in the same area, proximity to hospitals and schools. Every score comes with a human-readable explanation. SLAs are enforced automatically — Critical means 24 hours — and breaches auto-escalate to supervisors. A vision model even audits the uploaded photo at intake: if the image doesn't match the complaint, it's flagged as possible fraud.

**[2:35 — Feature three: the demo-killer]**

Now the feature I'm proudest of. In every other portal, "Resolved" is a claim. In ours, **it's a verdict.** An administrator cannot close a ticket without uploading a photo of the completed fix. Our vision AI compares the citizen's *before* photo with the crew's *after* photo. If the pothole is still there — if the photo is unrelated — if it can't verify the fix — **the close-out is blocked.** The AI is the citizen's advocate, and the burden of proof now sits with the government. To our knowledge, no production grievance portal anywhere does closed-loop, photo-verified resolution.

**[3:20 — Feature four: public accountability]**

And once fixes are verified, we make performance public. Our scoreboard — open to anyone, no login — ranks every department with grades from A+ to D: fifty percent resolution rate, thirty percent SLA compliance, twenty percent citizen star ratings. Average fix times, breach percentages, medals for the top three. **When your D grade sits next to a rival department's A+, resolution speed becomes a matter of reputation.**

**[3:50 — Women safety + the assistant]**

For women, one switch turns the entire portal pink: Women Safety Mode. Photo evidence becomes optional — because harassment rarely poses for a camera — reports route to the Women Safety Cell with a dedicated priority boost, and helplines are one tap away. Safety complaints stay pink-flagged in every admin view, so they can never be overlooked. And a built-in AI assistant, Civic Sathi, answers questions from your *real* ticket data, twenty-four seven.

**[4:20 — Engineering credibility]**

Under the hood: React, FastAPI, and every gram of AI runs *locally* on Ollama — no cloud, no API keys, citizen data never leaves government hardware. Every request is JWT-authenticated. And every single dependency has a fallback: database fails over to SQLite, AI falls back to rule-based engines, the backend itself falls back to offline mode. **Pull the network cable mid-demo — the app keeps working.**

**[4:45 — Close]**

So here's the loop we built: a citizen speaks in her own language → AI routes and prioritizes → the crew must photograph the fix → the AI verifies it → she confirms and rates it → and the public scoreboard remembers forever. Voice in. Verified fix out. Public accountability, permanently. **Nobody can lie to the system — and that woman in Pune finally has a portal built for her.** Thank you.
