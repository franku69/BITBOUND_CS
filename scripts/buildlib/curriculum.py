"""Adapt authored curriculum and story data for the classic game bundle."""
import html
import json
import re
from .files import read, read_json, write


def build_curriculum(root):
    curriculum = read_json(root / "app/curriculum.json")
    bank = [
        dict(id=item["id"], chapter=item["chapter"], title=item["title"],
             concept=item["concept"], type="code", topic=item["title"], q=item["prompt"])
        for item in curriculum["items"]
    ]
    world_ids = [[item["id"] for item in bank if item["chapter"] == chapter["id"]]
                 for chapter in curriculum["chapters"]]
    if len(bank) != 48 or len(world_ids) != 8 or not all(len(ids) == 6 for ids in world_ids):
        raise ValueError("Expected 48 missions: eight chapters with six missions each.")
    lessons = []
    for chapter in curriculum["chapters"]:
        tasks = [item for item in bank if item["chapter"] == chapter["id"]]
        guide = [dict(
            title=item["title"],
            html="<h3>" + html.escape(item["title"]) + "</h3><p>"
                 + html.escape(item["concept"]) + "</p><p>Open the coding mission for examples, "
                 "hints, and a runnable Python workspace.</p>"
        ) for item in tasks[:4]]
        lessons.append(dict(
            name=chapter["title"].upper(), subtitle=chapter["summary"], boss=chapter["boss"],
            mission="Restore four coding cores, complete two Python terminal tasks, then defeat the guardian.",
            guide=guide
        ))
    tutorials = read_json(root / "adventure/tutorials.json")
    story = read_json(root / "adventure/story.json")
    encounters = read_json(root / "adventure/encounter-questions.json")["items"]
    if len(story["chapters"]) != len(world_ids):
        raise ValueError("Story/curriculum chapter mismatch.")
    if [item["id"] for item in tutorials] != [item["id"] for item in bank]:
        raise ValueError("Tutorial/mission order mismatch.")
    if not all(len(item["choices"]) == 3 and 0 <= item["answer"] < 3 for item in tutorials):
        raise ValueError("Invalid tutorial answer.")
    payloads = {
        "ENCOUNTERS": encounters, "BANK": bank, "WORLDS": world_ids,
        "LESSONS": lessons, "TUTORIALS": {item["id"]: item for item in tutorials}, "STORY": story
    }
    source = re.sub(
        r"__(BANK|WORLDS|LESSONS|TUTORIALS|STORY|ENCOUNTERS)__",
        lambda match: json.dumps(payloads[match.group(1)], ensure_ascii=False),
        read(root / "scripts/questions-template.js")
    )
    write(root / "adventure/questions.js", source)
