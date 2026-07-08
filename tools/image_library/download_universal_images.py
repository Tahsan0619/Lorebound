#!/usr/bin/env python3
"""
Download a large, reusable curriculum image library from Pexels.

Requirements:
- Python 3.9+
- Environment variable PEXELS_API_KEY

Usage:
  python tools/image_library/download_universal_images.py
  python tools/image_library/download_universal_images.py --total 800 --per-topic-scale 1.2
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import random
import re
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple


PEXELS_BASE = "https://api.pexels.com/v1/search"
USER_AGENT = "LoreboundImageLibrary/1.0"


@dataclass
class Topic:
    slug: str
    label: str
    target_count: int
    queries: List[str]


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def load_topics(path: Path) -> Tuple[List[str], List[Topic]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    styles = [str(x).strip() for x in data.get("global_styles", []) if str(x).strip()]
    topics = []
    for row in data.get("topics", []):
        topics.append(
            Topic(
                slug=str(row["slug"]).strip(),
                label=str(row["label"]).strip(),
                target_count=int(row["target_count"]),
                queries=[str(q).strip() for q in row.get("queries", []) if str(q).strip()],
            )
        )
    return styles, topics


def pexels_search(api_key: str, query: str, page: int, per_page: int = 80) -> List[dict]:
    params = urllib.parse.urlencode(
        {
            "query": query,
            "page": page,
            "per_page": per_page,
            "orientation": "landscape",
            "size": "medium",
        }
    )
    url = f"{PEXELS_BASE}?{params}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": api_key,
            "User-Agent": USER_AGENT,
        },
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        payload = json.loads(res.read().decode("utf-8"))
    return payload.get("photos", [])


def choose_image_url(photo: dict) -> str:
    src = photo.get("src", {})
    return (
        src.get("large2x")
        or src.get("large")
        or src.get("landscape")
        or src.get("medium")
        or src.get("original")
        or ""
    )


def download_binary(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as res:
        content = res.read()
    dest.write_bytes(content)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--total", type=int, default=700, help="Total desired images across all topics.")
    parser.add_argument(
        "--per-topic-scale",
        type=float,
        default=1.0,
        help="Scale each topic target count before global normalization.",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed for query shuffling.")
    parser.add_argument(
        "--out",
        type=str,
        default="assets/universal_library",
        help="Output directory for downloaded assets and manifest.",
    )
    parser.add_argument(
        "--topic-file",
        type=str,
        default="tools/image_library/topics.json",
        help="Topic configuration JSON path.",
    )
    return parser.parse_args()


def topic_budget(topics: List[Topic], total: int, per_topic_scale: float) -> Dict[str, int]:
    scaled = {t.slug: max(10, int(round(t.target_count * per_topic_scale))) for t in topics}
    sum_scaled = sum(scaled.values())
    if sum_scaled <= 0:
        return {t.slug: 0 for t in topics}
    ratio = total / sum_scaled
    budgets = {slug: max(8, int(round(v * ratio))) for slug, v in scaled.items()}
    return budgets


def main() -> int:
    args = parse_args()
    api_key = os.environ.get("PEXELS_API_KEY", "").strip()
    if not api_key:
        print("ERROR: Missing PEXELS_API_KEY in environment.")
        print("Set it, then run again.")
        return 1

    random.seed(args.seed)

    root = Path(args.out)
    root.mkdir(parents=True, exist_ok=True)
    topic_file = Path(args.topic_file)
    styles, topics = load_topics(topic_file)
    budgets = topic_budget(topics, args.total, args.per_topic_scale)

    manifest_path = root / "manifest.csv"
    seen_photo_ids = set()
    rows = []

    for topic in topics:
        want = budgets.get(topic.slug, 0)
        topic_dir = root / topic.slug
        topic_dir.mkdir(parents=True, exist_ok=True)

        query_pool = topic.queries[:]
        random.shuffle(query_pool)
        if not query_pool:
            continue

        print(f"[{topic.slug}] target={want}")
        collected = 0
        page = 1
        query_idx = 0
        attempts_without_new = 0

        while collected < want and attempts_without_new < 8:
            base_query = query_pool[query_idx % len(query_pool)]
            style_hint = styles[(query_idx + page) % len(styles)] if styles else ""
            full_query = f"{base_query} {style_hint}".strip()
            query_idx += 1

            try:
                photos = pexels_search(api_key, full_query, page=page, per_page=80)
            except Exception as exc:  # noqa: BLE001
                print(f"  WARN search failed for '{full_query}' page {page}: {exc}")
                time.sleep(1.0)
                page += 1
                continue

            if not photos:
                attempts_without_new += 1
                page += 1
                continue

            added_this_round = 0
            for photo in photos:
                pid = int(photo.get("id", 0))
                if pid <= 0 or pid in seen_photo_ids:
                    continue

                image_url = choose_image_url(photo)
                if not image_url:
                    continue

                query_key = slugify(base_query)[:36]
                fname = f"{topic.slug}__{query_key}__{pid}.jpg"
                fpath = topic_dir / fname

                try:
                    download_binary(image_url, fpath)
                except Exception as exc:  # noqa: BLE001
                    print(f"  WARN download failed id={pid}: {exc}")
                    continue

                seen_photo_ids.add(pid)
                added_this_round += 1
                collected += 1

                rows.append(
                    {
                        "file": str(fpath.as_posix()),
                        "topic": topic.slug,
                        "label": topic.label,
                        "query": base_query,
                        "tags": ";".join(
                            sorted(
                                {
                                    topic.slug,
                                    slugify(topic.label),
                                    slugify(base_query),
                                    "universal",
                                    "curriculum",
                                    "background",
                                }
                            )
                        ),
                        "photo_id": str(pid),
                        "source": "pexels",
                        "source_url": str(photo.get("url", "")),
                        "image_url": image_url,
                        "photographer": str(photo.get("photographer", "")),
                        "license_note": "Pexels License; verify usage requirements before commercial redistribution.",
                    }
                )

                if collected >= want:
                    break

            if added_this_round == 0:
                attempts_without_new += 1
            else:
                attempts_without_new = 0

            page += 1
            time.sleep(0.2)

        print(f"  downloaded={collected}")

    with manifest_path.open("w", newline="", encoding="utf-8") as fp:
        writer = csv.DictWriter(
            fp,
            fieldnames=[
                "file",
                "topic",
                "label",
                "query",
                "tags",
                "photo_id",
                "source",
                "source_url",
                "image_url",
                "photographer",
                "license_note",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    index_by_topic: Dict[str, List[dict]] = {}
    for row in rows:
        index_by_topic.setdefault(row["topic"], []).append(
            {
                "file": row["file"],
                "tags": row["tags"].split(";"),
                "source_url": row["source_url"],
            }
        )

    summary = {
        "generated_at_unix": int(time.time()),
        "total_images": len(rows),
        "topics": {k: len(v) for k, v in index_by_topic.items()},
        "index": index_by_topic,
    }
    (root / "index.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(f"\nDone. Downloaded {len(rows)} images.")
    print(f"Manifest: {manifest_path.as_posix()}")
    print(f"Index: {(root / 'index.json').as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
