#!/usr/bin/env python3
"""Convert the Instagram research workbook into the site's JSON data layer.

Usage:
    python3 scripts/build_data.py [path/to/workbook.xlsx]

Writes src/data/generated/index.json. The site never reads the workbook
directly, so a backend can later replace this file with the same shape.

Every derived field keeps its trust status: OBSERVED (seen on Instagram),
INFERRED (analyst or rule-based interpretation) or UNKNOWN.
"""

from __future__ import annotations

import datetime as dt
import json
import re
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_XLSX = ROOT / "data/raw/AI_Celebrity_Index_Instagram_Research_2026-10-09.xlsx"
OUT = ROOT / "src/data/generated/index.json"

YEAR = 2026


# ---------------------------------------------------------------- helpers


def sheet_rows(wb, name):
    rows = list(wb[name].iter_rows(values_only=True))
    header = [str(h).strip() if h is not None else "" for h in rows[0]]
    out = []
    for r in rows[1:]:
        if r[0] is None and (len(r) < 2 or r[1] is None):
            continue
        out.append(dict(zip(header, r)))
    return out


def iso(v):
    if isinstance(v, dt.datetime):
        return v.date().isoformat()
    if isinstance(v, dt.date):
        return v.isoformat()
    return None


def num(v):
    if isinstance(v, bool) or v is None:
        return None
    if isinstance(v, (int, float)):
        return v
    return None


def text(v):
    # Formula cells with no value come back as 0 in data_only mode.
    if v is None or (isinstance(v, (int, float)) and not isinstance(v, bool) and v == 0):
        return None
    s = str(v).strip()
    return s or None


def is_none_like(s):
    if s is None:
        return True
    t = str(s).strip().upper()
    return t in ("", "NONE", "UNKNOWN", "0") or t.startswith("NONE") or t.startswith("UNKNOWN")


def slugify(name):
    s = re.sub(r"\(.*?\)", "", name).strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def display_name(name):
    return re.sub(r"\s*\((parody account|copycat)\)\s*", "", name).strip()


def mmdd(s, year=YEAR):
    """'09-17' -> '2026-09-17'."""
    m = re.fullmatch(r"(\d{2})-(\d{2})", s)
    if not m:
        return None
    return f"{year}-{m.group(1)}-{m.group(2)}"


def parse_count(s):
    """'1.71M' / '921K' / '3,150,423' -> int."""
    m = re.search(r"([\d][\d,.]*)\s*([KkMm])\b", s)
    if m:
        n = float(m.group(1).replace(",", ""))
        return int(n * (1_000_000 if m.group(2).lower() == "m" else 1_000))
    m = re.search(r"(\d{1,3}(?:,\d{3})+)", s)
    if m:
        return int(m.group(1).replace(",", ""))
    return None


def strip_trust_prefix(s):
    if s is None:
        return None, None
    m = re.match(r"^(OBSERVED|INFERRED|UNKNOWN)(?:\s*\([^)]*\))?\s*:\s*", s)
    if m:
        return m.group(1), s[m.end():].strip()
    return None, s


def links_in(s):
    if not s:
        return []
    return re.findall(r"https?://[^\s;,)'\"]+", str(s))


# ---------------------------------------------------------------- universes

UNIVERSES = {
    "jean-phil-universe": {
        "name": "Jean Phil Universe",
        "tagline": "The Sep-2026 wave of AI 'humans' that orbit Jean Phil: rivals, lovers, clones.",
    },
    "ai-fight-league": {
        "name": "AI Fight League",
        "tagline": "Monkeys, greyhounds and a gorilla with running fight records and call-outs.",
    },
    "higgsfield-network": {
        "name": "Higgsfield Network",
        "tagline": "Characters that label themselves 'Made with @higgsfield.ai' or run its partner tag.",
    },
    "brazil-ai": {
        "name": "Brazil AI",
        "tagline": "A Brazilian mini-universe of serialized episodes and a caramel-dog spin-off.",
    },
    "arab-ai-characters": {
        "name": "Arab AI Characters",
        "tagline": "The dancing-uncle archetype that Abu Shalab made famous, and its fast followers.",
    },
    "crypto-ai-animals": {
        "name": "Crypto AI Animals",
        "tagline": "Animal characters launched alongside a token.",
    },
    "stretchy-universe": {
        "name": "Stretchy Universe",
        "tagline": "Cozy storybook characters with elastic limbs, and a couple franchise.",
    },
    "blur-studios": {
        "name": "Blur Studios Family",
        "tagline": "A studio-built family of sassy AI grandmothers and aunties.",
    },
    "classic-virtuals": {
        "name": "Classic Virtuals",
        "tagline": "Pre-2026 CGI and agency-run virtual influencers: the category benchmarks.",
    },
    "independents": {
        "name": "Independents",
        "tagline": "Characters with no observed links to another universe yet.",
    },
}


def universe_for(cluster):
    c = (text(cluster) or "").lower()
    if "jean phil universe" in c:
        return "jean-phil-universe"
    if "fight league" in c:
        return "ai-fight-league"
    if "higgsfield" in c:
        return "higgsfield-network"
    if "brazil" in c:
        return "brazil-ai"
    if "arab" in c:
        return "arab-ai-characters"
    if "crypto ai animals" in c:
        return "crypto-ai-animals"
    if "stretchy" in c:
        return "stretchy-universe"
    if "blur studios" in c:
        return "blur-studios"
    if any(k in c for k in ("legacy", "clueless", "zelu", "diigitals", "particle6", "cgi")):
        return "classic-virtuals"
    return "independents"


# ---------------------------------------------------------------- relationships

# Relationship types are an INFERRED reading of the observed tag/mention
# evidence. Keys are (source handle, target handle).
EDGE_TYPES = {
    ("archibald_brown", "jean_philanthrope"): ("RIVAL", "Rivalry call-outs: 'come to London and find out…'"),
    ("archibald_brown", "abunuttyofficial"): ("RIVAL", "'Casper was the warm-up, @abunuttyofficial… you're next'"),
    ("percival_ashcrofttt", "archibald_brown"): ("RIVAL", "Secondary rival in the Archibald Brown storyline"),
    ("abunuttyofficial", "casper.iggy"): ("RIVAL", "Fight-league storyline vs Casper"),
    ("casper.iggy", "abunuttyofficial"): ("RIVAL", "Fight-league storyline vs Abu Nutty"),
    ("abunuttyofficial", "don.gorillo"): ("RIVAL", "Fight-league opponents"),
    ("don.gorillo", "abunuttyofficial"): ("RIVAL", "Fight-league opponents"),
    ("abunuttyofficial", "candy.greyhound"): ("RIVAL", "Fight-league opponents"),
    ("don.gorillo", "casper.iggy"): ("STORYLINE", "Fight-league crossover"),
    ("brigittemacaron_", "jean_philanthrope"): ("STORYLINE", "Implied family lore: 'La Jeanconde', 'Your father insisted…'"),
    ("jadeorlhabit_", "jean_philanthrope"): ("STORYLINE", "Love interest: bio 'Oui Monsieur… Love U'"),
    ("grannyspills", "auntieauroraa"): ("STORYLINE", "Studio family: sibling character"),
    ("auntieauroraa", "grannyspills"): ("STORYLINE", "Studio family: sibling character"),
    ("mr._stretchy", "ms.stretchy"): ("STORYLINE", "Partner character"),
    ("ia.vacalha", "caramelinho.ia"): ("STORYLINE", "Serialized episodes featuring the spin-off"),
    ("caramelinho.ia", "ia.vacalha"): ("STORYLINE", "Spin-off of Cuca Beludo"),
    ("derek.mercer.2006", "jean_philanthrope"): ("COLLAB", "Crossover posts"),
    ("derek.mercer.2006", "sickmanai"): ("COLLAB", "Crossover: 'Pumping with GIGACAT'"),
    ("pik.vik1", "candy.greyhound"): ("COLLAB", "Crossover appearance"),
    ("abunuttyofficial", "pik.vik1"): ("COLLAB", "Crossover appearance"),
    ("sickmanai", "candy.greyhound"): ("COLLAB", "Crossover appearance"),
}


def parse_handle_counts(s):
    """'jean_philanthrope (9), abunuttyofficial (3)' -> [(handle, count, note)]."""
    if not s:
        return []
    out = []
    for m in re.finditer(r"([a-z0-9._]{3,})\s*\(([^)]*)\)", str(s)):
        handle, inner = m.group(1), m.group(2)
        cm = re.search(r"\d+", inner)
        out.append((handle, int(cm.group(0)) if cm else 1, inner))
    return out



def read_social_graph(wb):
    """SOCIAL GRAPH holds a per-character table, then an EDGE LIST table below it."""
    rows = list(wb["SOCIAL GRAPH"].iter_rows(values_only=True))
    header = [str(h).strip() if h is not None else "" for h in rows[0]]
    graph, edge_rows = {}, []
    i = 1
    while i < len(rows):
        r = rows[i]
        if r[0] and str(r[0]).startswith("EDGE LIST"):
            break
        if r[1]:
            graph[r[1]] = dict(zip(header, r))
        i += 1
    if i < len(rows):
        eh = [str(h).strip() if h is not None else "" for h in rows[i + 1]]
        for r in rows[i + 2:]:
            if r[0] and r[1]:
                edge_rows.append(dict(zip(eh, r)))
    return graph, edge_rows

# ---------------------------------------------------------------- timeline


def parse_milestones(s):
    events = []
    if not s:
        return events
    for raw in str(s).split("|"):
        item = raw.strip()
        if not item:
            continue
        date = None
        label = item
        m = re.match(r"^(~)?(\d{4}-\d{2}-\d{2}|\d{2}-\d{2})(?:\.\.(\d{2}))?\s+(.*)$", item)
        if m:
            d = m.group(2)
            date = d if len(d) == 10 else mmdd(d)
            label = m.group(4).strip()
            if m.group(1):
                label = "approx. " + label
        else:
            m2 = re.search(r"\bby (\d{2}-\d{2})\b", item)
            if m2:
                date = mmdd(m2.group(1))
        events.append({"date": date, "label": label, "value": parse_count(label)})
    return events


def classify_event(ev, peak_date):
    l = ev["label"].lower()
    if "debut" in l or "first visible" in l or "launched as" in l:
        return "debut"
    if "$" in ev["label"] or "on chain" in l or " ca " in f" {l} ":
        return "token"
    if ev.get("date") and ev["date"] == peak_date and (ev.get("value") or 0) > 0:
        return "peak"
    if "all-time high" in l:
        return "peak"
    if (ev.get("value") or 0) >= 100_000:
        return "viral"
    if "@" in ev["label"] or " x " in l or "crossover" in l or "call-out" in l:
        return "collab"
    if "single" in l or "merch" in l or "verified" in l or "milestone" in l or "thank you" in l:
        return "milestone"
    return "moment"


def parse_trajectory(s):
    """Period averages of likes per post -> [{start, end, posts, avgLikes, label}]."""
    out = []
    if not s:
        return out
    _, body = strip_trust_prefix(str(s))
    for seg in body.split("|"):
        seg = seg.strip()
        start = end = None
        m = re.search(r"(\d{2}-\d{2})\.\.(\d{2}-\d{2}|\d{2})", seg)
        if m:
            start = mmdd(m.group(1))
            e = m.group(2)
            end = mmdd(e) if "-" in e else f"{YEAR}-{m.group(1)[:2]}-{e}"
        else:
            mb = re.search(r"before (\d{2}-\d{2})", seg)
            ma = re.search(r"after (\d{2}-\d{2})", seg)
            if mb:
                end = mmdd(mb.group(1))
            if ma:
                start = mmdd(ma.group(1))
        avg = None
        mv = re.search(r"avg\s*~?\s*([\d][\d,.]*)\s*([KkMm])?", seg)
        if mv:
            n = float(mv.group(1).replace(",", ""))
            if mv.group(2):
                n *= 1_000_000 if mv.group(2).lower() == "m" else 1_000
            avg = int(n)
        mp = re.search(r"(\d+)\s*posts?", seg)
        if avg is None or (start is None and end is None):
            continue
        out.append({
            "start": start,
            "end": end,
            "posts": int(mp.group(1)) if mp else None,
            "avgLikes": avg,
            "label": seg,
        })
    return out


# ---------------------------------------------------------------- status


def heat_for(momentum):
    if momentum is None:
        return "DORMANT"
    if momentum >= 80:
        return "ON FIRE"
    if momentum >= 68:
        return "HOT"
    if momentum >= 58:
        return "RISING"
    if momentum >= 45:
        return "STEADY"
    if momentum >= 25:
        return "COOLING"
    return "DORMANT"


def status_for(days, phase, momentum):
    """Live status from known posting activity (never fake realtime)."""
    p = (phase or "").lower()
    hot_phase = any(k in p for k in ("breakout", "rising", "hot", "new /"))
    cooling_phase = any(k in p for k in ("decay", "cooling", "stall", "fading", "slowing", "low engagement"))
    if days is None:
        return "UNKNOWN", "No dated post captured"
    if days > 30:
        return "DORMANT", f"Last post {days} days before capture"
    if days <= 3 and hot_phase:
        return "BREAKING_OUT", f"Posted {days}d ago; phase: {phase}"
    if days == 0:
        return "ACTIVE_TODAY", "Posted on capture day (09 Oct 2026)"
    if cooling_phase:
        return "COOLING", f"Phase: {phase}; last post {days}d ago"
    if days <= 3:
        return "POSTING", f"Last post {days}d before capture"
    if days <= 14:
        return "STABLE", f"Last post {days}d before capture"
    return "COOLING", f"Last post {days}d before capture"


# ---------------------------------------------------------------- build


def build(xlsx):
    wb = openpyxl.load_workbook(xlsx, data_only=True)

    cand = sheet_rows(wb, "ALL CANDIDATES")
    seeds = {r["INSTAGRAM HANDLE"]: r for r in sheet_rows(wb, "SEED CHARACTERS") if r.get("INSTAGRAM HANDLE")}
    graph, edge_rows = read_social_graph(wb)
    career = {r["Handle"]: r for r in sheet_rows(wb, "CAREER TIMELINE") if r.get("Handle")}
    suff = {r["Handle"]: r for r in sheet_rows(wb, "DATA SUFFICIENCY") if r.get("Handle")}
    sources = [r for r in sheet_rows(wb, "SOURCES") if r.get("#")]
    method_rows = list(wb["SCORING METHOD"].iter_rows(values_only=True))

    asof = None
    for r in method_rows:
        if r and r[0] == "ASOF":
            asof = iso(r[2])
    asof = asof or f"{YEAR}-10-09"

    characters = []
    excluded = []
    for r in cand:
        if not isinstance(r.get("ID"), (int, float)):
            continue
        handle = r["Handle"]
        inclusion = r["Inclusion status"]
        name = r["Name"]
        if inclusion == "EXCLUDED":
            excluded.append({
                "name": name,
                "handle": handle,
                "profileUrl": r["Profile URL"],
                "reason": text(r["Status reason / caveat"]),
                "followers": num(r["Followers"]),
            })
            continue

        seed = seeds.get(handle)
        g = graph.get(handle, {})
        c = career.get(handle, {})
        s = suff.get(handle, {})

        caveat = text(r["Status reason / caveat"])
        ctype = text(r["Character type"]) or ""
        origin = text(r["Origin / wave"])
        verified_badge = r["Verified badge (Y/N)"] == "Y"

        # identity -------------------------------------------------------
        disamb = text(seed.get("PARODY / IDENTITY DISAMBIGUATION")) if seed else None
        parody_of = None
        if caveat and caveat.lower().startswith("parody"):
            parody_of = caveat
        elif "(parody account)" in name.lower():
            parody_of = disamb or caveat
        id_flag = s.get("VERIFIED IDENTITY")
        if parody_of:
            identity = "PARODY"
        elif verified_badge:
            identity = "VERIFIED"
        elif id_flag == "YES":
            identity = "OFFICIAL"
        elif id_flag == "PARTIAL":
            identity = "UNVERIFIED"
        else:
            identity = "UNKNOWN"

        # kind / tags ------------------------------------------------------
        lt = (ctype + " " + (text(r["Visual style"]) or "")).lower()
        animal = any(k in lt for k in ("monkey", "dog", "greyhound", "gorilla", "cat ", "cat-", "mutt", "pet", "bigfoot", "animal"))
        virtual = any(k in lt for k in ("cgi", "virtual", "3d-animated")) or (origin or "").startswith("Established")
        kind = "animal" if animal else ("virtual" if virtual and "human" not in ctype.lower() else "human")
        if "sausage" in lt or "stretchy" in lt or "storybook" in lt:
            kind = "toon"

        # token ------------------------------------------------------------
        ig_tok = text(r["Ticker / token - Instagram observed"])
        ext_tok = text(r["Ticker - external (non-IG)"])
        user_tok = text(r["Ticker - user supplied"])
        bio = text(r["Bio (verbatim)"])
        link = text(r["Link in bio"])
        token = {"status": "NONE", "ticker": None, "chain": None, "contractInBio": False,
                 "note": ig_tok, "url": None, "reported": None, "userSupplied": None}
        if ig_tok and not is_none_like(ig_tok):
            token["status"] = "IG_OBSERVED"
            tm = re.search(r"\$[A-Za-z][A-Za-z0-9]*", ig_tok)
            token["ticker"] = tm.group(0) if tm else None
            token["contractInBio"] = bool(re.search(r"contract|\bca\b|pump", ig_tok, re.I))
            if re.search(r"pump|solana|\.sol", ig_tok + " " + (bio or "") + " " + (link or ""), re.I):
                token["chain"] = "SOLANA"
            ca = re.search(r"CA:\s*([1-9A-HJ-NP-Za-km-z]{32,48})", bio or "", re.I)
            if ca:
                token["url"] = f"https://pump.fun/coin/{ca.group(1)}"
            elif link and "pump.fun" in link and "…" not in link:
                first = link.split()[0]
                token["url"] = first if first.startswith("http") else "https://" + first
        if ext_tok and not is_none_like(ext_tok) and not ext_tok.lower().startswith("none"):
            token["reported"] = ext_tok
        if user_tok and not is_none_like(user_tok):
            token["userSupplied"] = user_tok
        # Verification level (never invented):
        #   CONTRACT   - full contract address shown on the character's own profile
        #   PROFILE    - ticker / token link on the profile, contract not captured
        #   UNVERIFIED - ticker only reported off-Instagram or supplied with the brief
        #   NONE       - nothing token-related found
        ca = re.search(r"CA:\s*([1-9A-HJ-NP-Za-km-z]{32,48})", bio or "", re.I)
        token["contract"] = ca.group(1) if ca else None
        if token["status"] == "IG_OBSERVED":
            token["verification"] = "CONTRACT" if token["contract"] else "PROFILE"
        elif token["reported"] or token["userSupplied"]:
            token["verification"] = "UNVERIFIED"
        else:
            token["verification"] = "NONE"

        # scores -----------------------------------------------------------
        def f(col):
            v = num(r.get(col))
            return round(v, 4) if v is not None else None

        scores = {
            "fame": f("FAME SCORE (0-100)"),
            "momentum": f("MOMENTUM SCORE (0-100)"),
            "distinctiveness": f("DISTINCTIVENESS SCORE (0-100)"),
            "sufficiency": f("Data sufficiency (0-1)"),
            "index": f("INDEX CANDIDATE SCORE (0-100)"),
            "fameParts": {
                "followers": f("F: followers (0-1)"),
                "engagement": f("F: engagement (0-1)"),
                "viral": f("F: viral (0-1)"),
                "consistency": f("F: consistency (0-1)"),
                "longevity": f("F: longevity (0-1)"),
                "recognizability": f("F: recognizability (0-1)"),
            },
            "momentumParts": {
                "engagement": f("M: recent engagement (0-1)"),
                "viral": f("M: recent viral (0-1)"),
                "frequency": f("M: frequency (0-1)"),
                "growth": f("M: growth (0-1)"),
                "recency": f("M: recency (0-1)"),
            },
            "distinctParts": {
                "visual": num(r.get("INPUT Distinct: visual (0-5)")),
                "personality": num(r.get("INPUT Distinct: personality (0-5)")),
                "lore": num(r.get("INPUT Distinct: lore (0-5)")),
                "crossCharacter": num(r.get("INPUT Distinct: cross-character (0-5)")),
            },
            "recognizabilityInput": num(r.get("INPUT Recognizability (0-5)")),
        }

        days = num(r["Days since last post"])
        phase = text(c.get("Current phase (INFERRED)"))
        status_code, status_basis = status_for(days, phase, scores["momentum"])

        top_post = None
        if text(r["Top post URL"]) and str(r["Top post URL"]).startswith("http"):
            top_post = {
                "url": r["Top post URL"], "date": iso(r["Top post date"]),
                "likes": num(r["Max likes (analysed posts)"]), "comments": num(r["Top post comments"]),
                "caption": text(r["Top post caption / note"]),
            }
        top14 = None
        if text(r["Top 14d post URL"]) and str(r["Top 14d post URL"]).startswith("http"):
            top14 = {"url": r["Top 14d post URL"], "date": iso(r["Top 14d post date"]),
                     "likes": num(r["Top 14d post likes"])}

        # timeline ---------------------------------------------------------
        peak = None
        if c.get("Peak post likes"):
            peak = {"date": iso(c.get("Peak post date")), "likes": num(c.get("Peak post likes")),
                    "url": text(c.get("Peak post URL"))}
        debut = {"date": iso(c.get("Debut / first visible post")) or iso(r["First visible post date"]),
                 "basis": text(c.get("Debut basis")) or text(r["First-date basis"]),
                 "url": text(c.get("Debut post URL"))}
        events = parse_milestones(c.get("Key milestones (dated, with evidence)"))
        for ev in events:
            ev["kind"] = classify_event(ev, peak["date"] if peak else None)
            ev["status"] = "OBSERVED"
            if ev["kind"] == "debut" and debut["url"]:
                ev["url"] = debut["url"]
            if peak and ev["date"] == peak["date"] and ev["kind"] in ("peak", "viral") and peak["url"]:
                ev["url"] = peak["url"]
        if not events:
            if debut["date"]:
                events.append({"date": debut["date"], "label": "Debut / first visible post", "kind": "debut",
                               "value": None, "status": "OBSERVED", "url": debut["url"],
                               "note": debut["basis"]})
            if peak and peak["date"]:
                events.append({"date": peak["date"], "label": f"Peak post: {peak['likes']:,} likes", "kind": "peak",
                               "value": peak["likes"], "status": "OBSERVED", "url": peak["url"]})
            if top14 and top14["date"] and (not peak or top14["date"] != peak["date"]) and top14["likes"]:
                events.append({"date": top14["date"], "label": f"Best post of the last 14 days: {top14['likes']:,} likes",
                               "kind": "viral" if top14["likes"] >= 100_000 else "moment",
                               "value": top14["likes"], "status": "OBSERVED", "url": top14["url"]})
        last_post = iso(r["Last post date"])
        if last_post and not any(e.get("date") == last_post for e in events):
            events.append({"date": last_post, "label": "Latest post captured", "kind": "moment",
                           "value": None, "status": "OBSERVED"})
        tok_event = text(c.get("Token / ticker event on IG"))
        if tok_event and re.match(r"^\d{2}-\d{2}", tok_event) and not any(e["kind"] == "token" for e in events):
            events.append({"date": mmdd(tok_event[:5]), "label": tok_event[6:].split(";")[0].strip(),
                           "kind": "token", "value": None, "status": "OBSERVED",
                           "url": (links_in(tok_event) or [None])[0]})
        dated = sorted([e for e in events if e.get("date")], key=lambda e: e["date"])
        undated = [e for e in events if not e.get("date")]
        events = dated + undated

        evidence = []
        if seed:
            for line in str(seed.get("Evidence links (key posts)") or "").splitlines():
                line = line.strip()
                if line.startswith("http"):
                    parts = line.split(" ", 1)
                    evidence.append({"url": parts[0], "label": parts[1] if len(parts) > 1 else "post"})

        # social -----------------------------------------------------------
        out_links = parse_handle_counts(g.get("OUT -> fictional/AI characters (count)"))
        in_links = parse_handle_counts(g.get("IN <- fictional/AI characters (count)"))

        def split_list(v):
            if not v:
                return []
            return [x.strip() for x in re.split(r",\s*(?![^()]*\))", str(v)) if x.strip()]

        flags = {k: s.get(k) for k in ("VERIFIED IDENTITY", "FAME SCORE", "LIVE STATUS", "CAREER TIMELINE", "SOCIAL GRAPH")}

        ch = {
            "id": int(r["ID"]),
            "slug": slugify(name),
            "name": display_name(name),
            "fullName": name,
            "handle": handle,
            "profileUrl": r["Profile URL"],
            "group": r["Group"],
            "inclusion": inclusion,
            "caveat": caveat,
            "characterType": ctype,
            "origin": origin,
            "kind": kind,
            "virtual": bool(virtual),
            "universe": universe_for(g.get("Universe / cluster")) if inclusion == "INCLUDED" or g else "independents",
            "universeNote": text(g.get("Universe / cluster")),
            "identity": identity,
            "identityFlag": id_flag,
            "verifiedBadge": verified_badge,
            "parodyOf": parody_of,
            "disambiguation": disamb,
            "copycats": text(seed.get("ALT / COPYCAT ACCOUNTS FOUND")) if seed else None,
            "followers": num(r["Followers"]),
            "following": num(r["Following"]),
            "posts": num(r["Posts (media count)"]),
            "postsAnalysed": num(r["Posts analysed"]),
            "fullHistory": text(r["Full history loaded?"]),
            "firstPost": iso(r["First visible post date"]),
            "firstPostBasis": text(r["First-date basis"]),
            "lastPost": last_post,
            "daysSinceLastPost": days,
            "posts7d": num(r["Posts last 7d"]),
            "posts14d": num(r["Posts last 14d"]),
            "posts30d": num(r["Posts last 30d"]),
            "postsPerWeek": num(r["Posting freq (posts/week, 14d)"]),
            "avgLikes": num(r["Avg likes (last 12)"]),
            "medianLikes": num(r["Median likes (last 12)"]),
            "avgComments": num(r["Avg comments (last 12)"]),
            "likesHidden": num(r["Likes hidden (of last 12)"]),
            "engagementRate": num(r["Engagement rate"]),
            "engagementLevel": text(r["Engagement level"]),
            "avgLikes14d": num(r["Avg likes (14d)"]),
            "avgComments14d": num(r["Avg comments (14d)"]),
            "maxLikes": num(r["Max likes (analysed posts)"]),
            "topPost": top_post,
            "topPost14d": top14,
            "topPostNote": None if top_post else text(r["Top post caption / note"]),
            "bio": bio,
            "linkInBio": link,
            "token": token,
            "related": text(r["Related accounts (IG tags / mentions, count)"]),
            "personality": text(r["Personality / archetype"]),
            "visualStyle": text(r["Visual style"]),
            "contentFormat": text(r["Content format"]),
            "notes": text(r["Notes / evidence"]),
            "why": text(r["Why it matters"]),
            "scores": scores,
            "heat": heat_for(scores["momentum"]),
            "status": {"code": status_code, "basis": status_basis},
            "phase": phase,
            "debut": debut,
            "peak": peak,
            "trajectory": parse_trajectory(c.get("Weekly / period trajectory (avg likes per post)")),
            "timeline": events,
            "evidence": evidence,
            "realPeopleTagged": split_list(g.get("Real people tagged (parody/storyline)")),
            "brandsTagged": split_list(g.get("Brands / tools / creators tagged")),
            "suggestedNeighbours": text(g.get("IG 'suggested accounts' neighbours (algorithmic)")),
            "outLinks": [{"handle": h, "count": n, "note": note} for h, n, note in out_links],
            "inLinks": [{"handle": h, "count": n, "note": note} for h, n, note in in_links],
            "sufficiency": {"flags": flags, "basis": text(s.get("Basis / notes"))},
        }
        if seed:
            ch["seed"] = {
                "recentActivity": text(seed.get("RECENT ACTIVITY")),
                "debutNote": text(seed.get("FIRST VISIBLE POST / APPROXIMATE DEBUT")),
                "recurringThemes": text(seed.get("RECURRING JOKES / THEMES")),
                "mostSuccessfulPosts": text(seed.get("MOST SUCCESSFUL POSTS")),
                "notableReels": text(seed.get("NOTABLE REELS")),
                "viralMoments": text(seed.get("VIRAL MOMENTS")),
                "brandCollabs": text(seed.get("BRAND COLLABS (if visible)")),
                "interactions": text(seed.get("OTHER FICTIONAL / AI CHARACTERS THEY INTERACT WITH")),
                "active": text(seed.get("IS THE ACCOUNT ACTIVE?")),
            }
        characters.append(ch)

    included = [c for c in characters if c["inclusion"] == "INCLUDED"]
    by_handle = {c["handle"]: c for c in characters}

    # ranks (ties keep sheet order, as in the workbook) -------------------
    for key, field in (("index", "index"), ("fame", "fame"), ("momentum", "momentum"), ("distinctiveness", "distinctiveness")):
        ordered = sorted(included, key=lambda c: (-(c["scores"][field] or 0), c["id"]))
        for i, c in enumerate(ordered):
            c.setdefault("ranks", {})[key] = i + 1
    for c in characters:
        c.setdefault("ranks", None)

    # edges -------------------------------------------------------------
    node_handles = {c["handle"] for c in characters}
    edges = {}

    external = {}
    for er in edge_rows:
        src, tgt = er["Source handle"], er["Target handle"]
        kind = text(er.get("Target kind")) or ""
        link_type = text(er.get("Link type")) or ""
        evidence = [u for u in [text(er.get("Evidence / example"))] if u and u.startswith("http")]
        if kind != "character":
            external.setdefault(src, []).append({
                "handle": tgt, "kind": kind, "linkType": link_type,
                "count": num(er.get("Count observed")) or 1, "evidence": evidence})
            continue
        if src not in node_handles or tgt not in node_handles or src == tgt:
            continue
        etype, why = EDGE_TYPES.get((src, tgt), (None, None))
        if etype is None:
            etype = "RIVAL" if "rival" in link_type.lower() else "MENTION"
            why = link_type
        edges[(src, tgt)] = {
            "source": src, "target": tgt, "type": etype, "count": num(er.get("Count observed")) or 1,
            "note": why, "raw": link_type, "evidence": evidence,
            "observedOn": text(er.get("Observed on")),
            "status": "OBSERVED" if etype == "MENTION" else "INFERRED"}
    for c in characters:
        c["externalLinks"] = external.get(c["handle"], [])

    # SAME UNIVERSE edges: connect members with no in-universe link to the hub.
    for uid in UNIVERSES:
        members = [c for c in included if c["universe"] == uid]
        if len(members) < 2 or uid == "independents":
            continue
        member_handles = {m["handle"] for m in members}

        def in_universe_degree(c):
            return sum(1 for e in edges.values()
                       if c["handle"] in (e["source"], e["target"])
                       and e["source"] in member_handles and e["target"] in member_handles)

        hub = max(members, key=lambda c: (in_universe_degree(c), c["scores"]["fame"] or 0))
        for m in members:
            if m is hub:
                continue
            linked = any(
                (e["source"] == m["handle"] and e["target"] in member_handles)
                or (e["target"] == m["handle"] and e["source"] in member_handles)
                for e in edges.values()
            )
            if not linked:
                edges[(m["handle"], hub["handle"])] = {
                    "source": m["handle"], "target": hub["handle"], "type": "SAME_UNIVERSE", "count": 1,
                    "note": f"Same universe ({UNIVERSES[uid]['name']}) - no direct tag observed",
                    "raw": None, "evidence": [], "status": "INFERRED"}

    edge_list = list(edges.values())
    degree = {}
    for e in edge_list:
        if e["type"] == "SAME_UNIVERSE":
            continue
        degree[e["source"]] = degree.get(e["source"], 0) + 1
        degree[e["target"]] = degree.get(e["target"], 0) + 1
    for c in characters:
        c["degree"] = degree.get(c["handle"], 0)

    universes = []
    for uid, u in UNIVERSES.items():
        members = sorted([c for c in included if c["universe"] == uid], key=lambda c: c["ranks"]["index"])
        if not members:
            continue
        hubs = [e["target"] for e in edge_list if e["type"] == "SAME_UNIVERSE" and by_handle[e["target"]]["universe"] == uid]
        hub = by_handle[hubs[0]] if hubs else max(members, key=lambda c: (c["degree"], c["scores"]["fame"] or 0))
        universes.append({"id": uid, **u, "members": [m["slug"] for m in members], "hub": hub["slug"]})

    # sources -----------------------------------------------------------
    src_list = []
    for r in sources:
        title = text(r.get("Title / account")) or ""
        hm = re.match(r"@([a-z0-9._]+)", title)
        src_list.append({
            "n": int(r["#"]),
            "type": text(r.get("Source type")),
            "title": title,
            "url": text(r.get("URL")),
            "accessed": text(r.get("Accessed")) if not isinstance(r.get("Accessed"), dt.datetime) else iso(r.get("Accessed")),
            "usedFor": text(r.get("Used for")),
            "handle": hm.group(1) if hm else None,
        })
    for c in characters:
        c["sources"] = [s["n"] for s in src_list
                        if s["handle"] == c["handle"]
                        or (s["type"] or "").startswith("Secondary") and (c["name"].split()[0] in (s["title"] or "") or c["name"].split()[0] in (s["usedFor"] or ""))]

    # methodology -------------------------------------------------------
    params, definitions = [], []
    mode = None
    for r in method_rows:
        if not r or r[0] is None:
            continue
        if r[0] == "Parameter":
            mode = "params"
            continue
        if r[0] == "DEFINITIONS":
            mode = "defs"
            continue
        if mode == "params" and r[1] is not None:
            v = r[2]
            params.append({"key": r[0], "description": r[1], "value": iso(v) or v})
        elif mode == "defs":
            definitions.append(r[0])

    data = {
        "meta": {
            "title": "AI Celebrity Index",
            "asOf": asof,
            "generatedFrom": Path(xlsx).name,
            "counts": {
                "included": len(included),
                "watchlist": sum(1 for c in characters if c["inclusion"] == "WATCHLIST"),
                "excluded": len(excluded),
            },
            "legend": "OBSERVED = seen on Instagram; INFERRED = analyst interpretation; UNKNOWN = not verifiable on Instagram.",
        },
        "characters": characters,
        "edges": edge_list,
        "universes": universes,
        "excluded": excluded,
        "sources": src_list,
        "methodology": {"params": params, "definitions": definitions},
    }
    return data


def main():
    xlsx = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_XLSX
    data = build(xlsx)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    m = data["meta"]["counts"]
    print(f"wrote {OUT.relative_to(ROOT)}: {m['included']} included, {m['watchlist']} watchlist, "
          f"{m['excluded']} excluded, {len(data['edges'])} edges, {len(data['universes'])} universes")


if __name__ == "__main__":
    main()
