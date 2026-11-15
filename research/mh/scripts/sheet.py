import bpy, sys, os, json, math, random, re, subprocess
import numpy as np
from pathlib import Path
from mathutils.bvhtree import BVHTree
from bl_ext.blender_org.mpfb.services.humanservice import HumanService
from bl_ext.blender_org.mpfb.services.assetservice import AssetService
from bl_ext.blender_org.mpfb.services.targetservice import TargetService
from bl_ext.blender_org.mpfb.entities.clothes.mhclo import Mhclo

# usage: blender -b --python sheet.py -- <set> <out.png> [faces] [export=DIR] [only=N] [tris=N] [turn=DEG] [nohair]
# sets: crowd (the game's 36 townsfolk), marozas (the player), hairs / wears (every licensed hair style / garment, for picking
# the allow-lists), and the fixed test sets below
args = sys.argv[sys.argv.index("--") + 1:]
which, out = args[:2]
FACES = "faces" in args
EXPORT = next((a[7:] for a in args if a.startswith("export=")), None)
TRIS = next((int(a[5:]) for a in args if a.startswith("tris=")), 12000)
# share of TRIS the clothes may use, and how much of the face survives; the rest of the body takes what is left
CLOTH_SHARE = 0.36
FACE_KEEP = next((float(a[5:]) for a in args if a.startswith("face=")), 0.5)
# debugging: hairkeep=R decimates every hair style to that ratio, to see which styles survive it
HAIR_KEEP = next((float(a[9:]) for a in args if a.startswith("hairkeep=")), 1.0)
TURN = next((float(a[5:]) for a in args if a.startswith("turn=")), -18.0)

# 0.7 on hips and waist looked like a cartoon; the volume goes into bust and buttocks instead of a pinched waist
CURVY = {"buttocks-volume-incr": 0.9, "hip-scale-horiz-incr": 0.4, "measure-hips-circ-incr": 0.45, "measure-waist-circ-decr": 0.3,
         "measure-bust-circ-incr": 0.45, "l-upperleg-fat-incr": 0.3, "r-upperleg-fat-incr": 0.3}
BUFF = {"torso-vshape-incr": 0.7, "torso-muscle-pectoral-incr": 0.8, "torso-muscle-dorsi-incr": 0.6, "measure-shoulder-dist-incr": 0.5,
        "measure-neck-circ-incr": 0.5, "stomach-tone-incr": 0.6,
        **{f"{s}-{part}-muscle-incr": 0.8 for s in "lr" for part in ("upperarm", "upperarm-shoulder", "lowerarm", "upperleg", "lowerleg")}}

# gender 0 = female, 1 = male; age 0.19 = child, 0.5 = 25 y, 1.0 = 90 y
SETS = {
    "base": [
        dict(n="young man",      g=1.0, age=0.50, w=0.45, m=0.55, h=0.60, skin="young_caucasian_male",       hair="short02", wear=["male_casualsuit01", "shoes01"]),
        dict(n="heavy man",      g=1.0, age=0.68, w=0.95, m=0.35, h=0.50, skin="middleage_caucasian_male",   hair="short04", wear=["male_casualsuit04", "shoes03"]),
        dict(n="old man",        g=1.0, age=0.95, w=0.40, m=0.25, h=0.40, skin="old_caucasian_male",         hair="short01", wear=["male_casualsuit05", "shoes02", "fedora01"]),
        dict(n="worker",         g=1.0, age=0.60, w=0.60, m=0.80, h=0.55, skin="middleage_caucasian_male",   hair="short03", wear=["male_worksuit01", "shoes05"]),
        dict(n="man in suit",    g=1.0, age=0.62, w=0.50, m=0.50, h=0.65, skin="middleage_caucasian_male",   hair="short01", wear=["male_elegantsuit01", "shoes04"]),
        dict(n="teen boy",       g=1.0, age=0.33, w=0.35, m=0.40, h=0.45, skin="young_caucasian_male2",      hair="short03", wear=["male_casualsuit02", "shoes06"]),
        dict(n="young woman",    g=0.0, age=0.50, w=0.40, m=0.45, h=0.50, skin="young_caucasian_female",     hair="long01",  wear=["female_casualsuit01", "shoes01"]),
        dict(n="heavy woman",    g=0.0, age=0.70, w=0.95, m=0.30, h=0.40, skin="middleage_caucasian_female", hair="bob01",   wear=["female_casualsuit02", "shoes02"]),
        dict(n="old woman",      g=0.0, age=0.97, w=0.55, m=0.20, h=0.30, skin="old_caucasian_female",       hair="bob02",   wear=["female_elegantsuit01", "shoes03"]),
        dict(n="sporty woman",   g=0.0, age=0.48, w=0.35, m=0.75, h=0.60, skin="young_caucasian_female2",    hair="ponytail01", wear=["female_sportsuit01", "shoes06"]),
        dict(n="office woman",   g=0.0, age=0.60, w=0.50, m=0.45, h=0.55, skin="middleage_caucasian_female", hair="braid01", wear=["female_elegantsuit01", "shoes04"]),
        dict(n="girl, 10",       g=0.0, age=0.19, w=0.45, m=0.40, h=0.50, skin="young_caucasian_female",     hair="ponytail01", wear=["female_casualsuit01", "shoes01"]),
    ],
    "curvy": [
        dict(n="tube top + shorts",      g=0.0, age=0.50, w=0.55, m=0.50, h=0.55, cup=1.0, firm=0.85, prop=1.0, t=CURVY, skin="young_caucasian_female2", hair="long01",        wear=["skalldyrssuppe_tube_top_funky_colors", "cortu_jeans_shorts", "punkduck_comfortable_sneakers"]),
        dict(n="crop top + leggings",    g=0.0, age=0.52, w=0.55, m=0.55, h=0.60, cup=1.0, firm=0.85, prop=1.0, t=CURVY, skin="young_caucasian_female",  hair="ponytail01",    wear=["female_sportsuit01", "punkduck_running_shoes_01"]),
        dict(n="off-shoulder top + mini skirt",  g=0.0, age=0.54, w=0.58, m=0.45, h=0.50, cup=1.0, firm=0.85, prop=1.0, t=CURVY, skin="young_caucasian_female2", hair="elvs_wavy_bob", wear=["punkduck_off-shoulder_long-sleeve_top", "frankyaye_mini_skirt_01", "dressupdoc_balletflat1"]),
        dict(n="halter + tiered mini",   g=0.0, age=0.50, w=0.52, m=0.50, h=0.65, cup=1.0, firm=0.85, prop=1.0, t=CURVY, skin="young_caucasian_female",  hair="braid01",       wear=["toigo_turtleneck_halter_top", "toigo_tiered_mini_skirt", "punkduck_tennis_shoes"]),
        dict(n="cut-out dress",          g=0.0, age=0.55, w=0.55, m=0.45, h=0.55, cup=1.0, firm=0.85, prop=1.0, t=CURVY, skin="young_caucasian_female2", hair="bob01",         wear=["toigo_cut_out_dress", "elvs_flatshoe_plain1"]),
        dict(n="tank top + mini skirt",  g=0.0, age=0.53, w=0.60, m=0.45, h=0.45, cup=1.0, firm=0.85, prop=1.0, t=CURVY, skin="young_caucasian_female",  hair="elvs_lara_hair", wear=["toigo_keyhole_tank_top", "frankyaye_mini_skirt_02", "culturalibre_sneakers"]),
    ],
    # the player: a marozas in a black tracksuit. `flat` paints a garment one colour (the game adds the three stripes)
    "marozas": [dict(n=f"marozas {hair} {legs.split('_')[-2]}", g=1.0, age=0.47, w=0.42, m=0.72, h=0.58, prop=0.8, skin="young_caucasian_male", hair=hair,
                     wear=["elvs_hooded_sweat_jacket1", legs, "punkduck_tennis_shoes"] + cap,
                     flat={"elvs_hooded_sweat_jacket1": (0.012, 0.012, 0.014), legs: (0.012, 0.012, 0.014)})
                for hair, legs, cap in (("short03", "elvs_male_trouser", []), ("short01", "toigo_wool_pants", []), (None, "elvs_male_trouser", ["jujube_newsboy_cap"]),
                                        ("short02", "cortu_cargo_pants", []))],
    "try": [dict(n=top, g=0.0, age=0.52, w=0.55, m=0.50, h=0.55, cup=1.0, firm=0.85, prop=1.0, t=CURVY, skin="young_caucasian_female2", hair="ponytail01",
                 wear=[top] + ([] if "dress" in top else ["frankyaye_mini_skirt_01"]) + ["dressupdoc_balletflat1"])
            for top in ("punkduck_off-shoulder_long-sleeve_top", "toigo_basic_tucked_t-shirt", "joepal_crude_t-shirt_female", "punkduck_lace_up_blouse",
                        "toigo_strapless_ruffle_top_dress", "toigo_halter_dress_knee_length")],
    "fit": [
        dict(n="curvy, sport",   g=0.0, age=0.50, w=0.50, m=0.55, h=0.55, cup=1.0, firm=0.85, prop=1.0, t=CURVY, skin="young_caucasian_female2", hair="long01",     wear=["female_sportsuit01", "shoes06"]),
        dict(n="curvy, casual",  g=0.0, age=0.52, w=0.55, m=0.45, h=0.50, cup=1.0, firm=0.80, prop=1.0, t=CURVY, skin="young_caucasian_female",  hair="bob01",      wear=["female_casualsuit02", "shoes02"]),
        dict(n="curvy, elegant", g=0.0, age=0.55, w=0.50, m=0.45, h=0.60, cup=0.9, firm=0.80, prop=1.0, t=CURVY, skin="young_caucasian_female2", hair="ponytail01", wear=["female_elegantsuit01", "shoes04"]),
        dict(n="buff, t-shirt",  g=1.0, age=0.52, w=0.55, m=1.0,  h=0.65, prop=1.0, t=BUFF, skin="young_caucasian_male",     hair="short02", wear=["male_casualsuit04", "shoes03"]),
        dict(n="buff, casual",   g=1.0, age=0.55, w=0.60, m=1.0,  h=0.70, prop=1.0, t=BUFF, skin="young_caucasian_male2",    hair="short04", wear=["male_casualsuit03", "shoes01"]),
        dict(n="buff, worker",   g=1.0, age=0.60, w=0.65, m=1.0,  h=0.60, prop=1.0, t=BUFF, skin="middleage_caucasian_male", hair="short03", wear=["male_casualsuit06", "shoes05"]),
    ],
}

# ---- licences: the repo is public, so townsfolk only ever wear CC0 and CC BY assets
def header(path):
    """Licence and author from the comment lines of an .mhclo, plus the licence of the material it names."""
    text = open(path, errors="replace").read()
    notes = " ".join(l for l in text.splitlines() if l.startswith("#"))
    for m in re.findall(r"^material\s+(\S+)", text, re.M):
        mat = Path(path).parent / m
        if mat.exists():
            notes += " " + " ".join(l for l in open(mat, errors="replace").read().splitlines() if l.startswith("#"))
    by = re.search(r"cc[\s_-]*by(?:[\s_-]*(\d\.\d))?", notes, re.I)
    lic = None if re.search(r"agpl", notes, re.I) else "CC0" if re.search(r"cc[\s_-]*0", notes, re.I) else \
        ("CC BY " + (by.group(1) or "")).strip() if by else None
    who = re.search(r"#\s*author:?\s*([^#]+?)\s*(?:#|$)", notes, re.I) or re.search(r"#\s*([^#]+?)\s*-\s*CC0", notes)
    author = who.group(1).strip() if who else "MakeHuman team" if "released as CC0 in september 2020" in notes else None
    return {"license": lic, "author": author, "path": str(path)}


META = {(kind, p.parent.name): header(p) for kind in ("clothes", "hair", "eyebrows", "eyelashes", "eyes")
        for p in AssetService.list_mhclo_assets(kind)}
FREE = {key for key, m in META.items() if m["license"] and m["author"] and m["author"].lower() != "unknown"}


# ---- wardrobe: every garment the townsfolk may wear, each checked through web/review.html (run the `wears` set).
# "role sexes bands flags": bands c(hild) t(een) y(oung) m(iddle) o(ld). warm tops never meet short bottoms; curvy and buff
# mark the tops that suit those builds; formal is rationed; dye marks one-colour cloth that is re-coloured per person.
# Left out after the check: glasses (float off the face), janexx_old_female_sweater (hem tears), male_casualsuit03 and
# elvs_male_shirt_untucked_bd1 (chest pockets read as breasts), mindfront_male_trousers_2 (seams open), the lace-up blouse,
# camisole top and open cardigan (gape), the pink tiered skirt, everything costume-like, the women's oxfords (white socks) and
# every shoe with spikes or 10,000 triangles. The male t-shirt is moulded on a chest: on a boy or an old man it reads as breasts.
WEAR = {name: dict(zip(("role", "sex", "bands"), spec.split()[:3]), flags=set(spec.split()[3:])) for name, spec in {
    "elvs_crude_t-shirt_male": "top m ym light buff dye", "namuhekam_male_polo_shirt": "top m ymo light buff dye",
    "toigo_basic_tucked_t-shirt": "top fm tymo light dye", "joepal_crude_t-shirt_female": "top f ctymo light dye",
    "toigo_fisherman_sweater": "top fm ctymo warm dye", "mindfront_knitted_sweater_01": "top fm tymo warm dye",
    "mindfront_knitted_sweater_02": "top fm tymo warm dye", "mindfront_lusekofta": "top f mo warm",
    "elvs_hooded_sweat_jacket1": "top fm cty warm dye", "toigo_keyhole_tank_top": "top f ym light curvy",
    "punkduck_off-shoulder_long-sleeve_top": "top f y light curvy dye", "toigo_turtleneck_halter_top": "top f y light curvy",
    "toigo_wool_pants": "legs fm ctymo dye", "cortu_cargo_pants": "legs fm ctym", "elvs_jeans_straight_leg": "legs m ctymo",
    "elvs_jeans_bootcut": "legs fm tymo", "elvs_male_trouser": "legs m ymo dye", "mindfront_male_trousers_1": "legs m ctymo",
    "punkduck_male_classic_jeans": "legs m tymo", "mindfront_female_trousers_1": "legs f ctym", "punkduck_female_tight_jeans": "legs f tym",
    "elvs_disco_pants_skinny": "legs f ym dye", "cortu_jeans_shorts": "legs f cty short", "toigo_long_full_skirt": "legs f mo skirt",
    "toigo_skirt_with_lace_ruffle": "legs f cty skirt short",
    "toigo_tiered_mini_skirt": "legs f y skirt short dye",
    "male_casualsuit01": "full m ymo", "male_casualsuit02": "full m cty", "male_casualsuit04": "full m cty buff",
    "male_casualsuit05": "full m ymo", "male_casualsuit06": "full m ctym buff", "male_worksuit01": "full m ym buff",
    "male_elegantsuit01": "full m mo formal", "toigo_male_double-breasted_suit": "full m mo formal", "toigo_male_suit_3": "full m ym formal",
    "toigo_male_suit_tie_and_jacket": "full m mo formal", "toigo_suit_with_jacket_and_bowtie": "full m o formal",
    "female_casualsuit01": "full f cty", "female_casualsuit02": "full f cty", "female_elegantsuit01": "full f mo skirt",
    "female_sportsuit01": "full f y curvy", "toigo_female_suit": "full f mo skirt formal", "toigo_female_double-breasted_suit": "full f m formal",
    "toigo_shift_dress": "full f ymo skirt dye", "toigo_keyhole_neck_dress": "full f mo skirt", "toigo_halter_dress_knee_length": "full f y skirt curvy",
    "toigo_halter_dress_midi": "full f ym skirt curvy", "toigo_camisole_dress_with_full_skirt": "full f ym skirt",
    "toigo_dress_with_tiered_skirt": "full f ym skirt", "toigo_cut_out_dress": "full f y skirt curvy",
    "toigo_strapless_ruffle_top_dress": "full f y skirt curvy", "toigo_bodice_dress_with_lace_ruffle_skirt": "full f y skirt curvy",
    "aethelraed_flapper_dress": "full f o skirt",
    # the system shoes carry socks, which look wrong under a skirt, so only men wear them
    **{f"shoes0{k}": "shoe m ctymo" for k in range(1, 7)}, "mindfront_shoes_oxford_male": "shoe m ymo", "mindfront_shoes_monk_strap_male": "shoe m mo",
    **{f"elvs_flatshoe_{k}": "shoe f tymo flat" for k in ("bow1", "buckle_1", "gemmed1", "plain1", "pointy1")},
    "punkduck_comfortable_sneakers": "shoe fm ctym", "punkduck_running_shoes_01": "shoe fm ctymo", "punkduck_tennis_shoes": "shoe fm ctymo",
    "punkduck_cycling_shoes": "shoe fm cty", "punkduck_kill_bill_shoes": "shoe fm cty", "culturalibre_sneakers": "shoe fm ctym",
    "fedora01": "hat m mo", "fedora_cocked": "hat m mo",
}.items() if ("clothes", name) in FREE}
# colours as the eye should see them in the game (the textures are darkened to allow for the game's brightening)
DYES = {"red": (0.70, 0.22, 0.20), "burgundy": (0.48, 0.16, 0.22), "navy": (0.18, 0.24, 0.44), "blue": (0.30, 0.45, 0.72), "sky": (0.55, 0.70, 0.86),
        "teal": (0.18, 0.46, 0.48), "green": (0.24, 0.44, 0.30), "olive": (0.42, 0.44, 0.26), "mustard": (0.80, 0.62, 0.22), "brown": (0.44, 0.31, 0.22),
        "beige": (0.78, 0.70, 0.56), "cream": (0.90, 0.86, 0.76), "white": (0.93, 0.93, 0.91), "grey": (0.58, 0.58, 0.60), "charcoal": (0.27, 0.27, 0.29),
        "black": (0.15, 0.15, 0.16), "pink": (0.88, 0.58, 0.66), "lilac": (0.68, 0.58, 0.82)}
LEG_DYES = ("navy", "charcoal", "black", "grey", "brown", "beige", "olive")
ROLES = (("glasses", "glasses"), ("hat", "hat"), ("fedora", "hat"), ("cap", "hat"), ("bag_on_head", "hat"),
         ("shoe", "shoe"), ("sneaker", "shoe"), ("sandal", "shoe"), ("balletflat", "shoe"), ("maryjane", "shoe"),
         ("suit", "full"), ("dress", "full"), ("tunic", "full"), ("kimono", "full"),
         ("pants", "legs"), ("trouser", "legs"), ("jeans", "legs"), ("skirt", "legs"), ("shorts", "legs"))


def role_of(name):
    return WEAR[name]["role"] if name in WEAR else next((role for key, role in ROLES if key in name), "top")


# hair styles that survive the game's alpha test at a sane triangle count (run the `hairs` set):
# style -> (groups it suits as sex + band letter, share of its triangles kept; 1 leaves alpha cards untouched).
# Left out: elvs_short_side_do (98,660 triangles), elvs_braided_rows, elvs_lara_hair, elvs_adrienne_hair, elvs_ashley_may_hair,
# elvs_island_princess_hair, elvs_that_80s_babe_hair (too heavy, or blocky once thinned), bob01 and elvs_katherine_hair (cover an
# eye), ponytail01 (hairline halfway up the skull), elvs_grump_hair (reads as a woman's set on a man), the afros and
# elvs_inverted_curly_bob (not this town), elvs_witchy_lil_bob (AGPL), afro01 (a perm that reads as tin foil or straw in any
# colour). short03 hides an eye: fine on a woman or a teen, odd on a grown man.
HAIR = {name: spec for name, spec in {
    "short01": ("mc mt my mm mo", 0.5), "short02": ("mc mt my mm mo fo", 0.5), "short03": ("mt fm", 1), "short04": ("my mm mo", 1),
    "elvs_maxwell_hair": ("mt my", 1),
    "bob02": ("fc ft fy fm fo", 1), "elvs_50s_updo": ("fm fo", 1), "elvs_short_daisy_hair": ("fc ft fy fm fo", 0.5),
    "long01": ("fc ft fy", 0.5), "braid01": ("fc ft fy fm", 0.4), "elvs_hazel_hair": ("ft fy", 0.5),
    "elvs_keylth_hair": ("fy fm", 0.5), "elvs_lady_hippy_hair": ("ft fy", 0.5), "elvs_wavy_bob": ("fm fo", 1),
    "elvs_braid_bun": ("fy fm fo", 0.15), "elvs_daisy_hair": ("ft fy", 0.4),
}.items() if ("hair", name) in FREE}
# colours as the eye should see them in the game; the texture is darkened to allow for the game's brightening
HAIR_COLOURS = {"blond": (0.80, 0.66, 0.40), "dark blond": (0.62, 0.48, 0.30), "light brown": (0.48, 0.35, 0.22), "brown": (0.36, 0.25, 0.16),
                "dark brown": (0.26, 0.18, 0.12), "black": (0.15, 0.13, 0.12), "auburn": (0.50, 0.24, 0.14), "ginger": (0.72, 0.40, 0.20),
                "grey": (0.62, 0.62, 0.62), "white": (0.88, 0.88, 0.86), "dark grey": (0.40, 0.40, 0.41)}
AGES = {"child": (0.17, 0.22), "teen": (0.28, 0.38), "young": (0.45, 0.56), "middle": (0.60, 0.78), "old": (0.85, 1.0)}
# (sex, band, build): 3 girls, 10 women, 5 old women, 3 boys, 10 men, 5 old men
CROWD = [(0.0, "child", ""), (0.0, "teen", ""), (0.0, "teen", "")] + [(0.0, "young", k) for k in ("curvy", "curvy", "", "")] \
    + [(0.0, "middle", k) for k in ("curvy", "", "", "", "", "")] + [(0.0, "old", "")] * 5 \
    + [(1.0, "child", ""), (1.0, "child", ""), (1.0, "teen", "")] + [(1.0, "young", k) for k in ("buff", "", "", "")] \
    + [(1.0, "middle", k) for k in ("buff", "", "", "", "", "")] + [(1.0, "old", "")] * 5

HEADS = ["oval", "round", "square", "rectangular", "triangular", "invertedtriangular", "diamond"]
# (negative target, positive target); "{s}" pairs are applied to both sides so faces stay symmetric
FACE_AXES = [
    ("nose-scale-vert-decr", "nose-scale-vert-incr"), ("nose-scale-horiz-decr", "nose-scale-horiz-incr"), ("nose-hump-decr", "nose-hump-incr"),
    ("nose-point-down", "nose-point-up"), ("nose-curve-concave", "nose-curve-convex"), ("nose-volume-decr", "nose-volume-incr"),
    ("nose-scale-depth-decr", "nose-scale-depth-incr"), ("chin-width-decr", "chin-width-incr"), ("chin-height-decr", "chin-height-incr"),
    ("chin-prominent-decr", "chin-prominent-incr"), ("chin-jaw-drop-decr", "chin-jaw-drop-incr"), ("chin-bones-decr", "chin-bones-incr"),
    ("mouth-scale-horiz-decr", "mouth-scale-horiz-incr"), ("mouth-scale-vert-decr", "mouth-scale-vert-incr"),
    ("mouth-lowerlip-volume-decr", "mouth-lowerlip-volume-incr"), ("forehead-scale-vert-decr", "forehead-scale-vert-incr"),
    ("forehead-temple-decr", "forehead-temple-incr"), ("head-fat-decr", "head-fat-incr"), ("head-scale-horiz-decr", "head-scale-horiz-incr"),
    ("{s}-cheek-bones-decr", "{s}-cheek-bones-incr"), ("{s}-cheek-volume-decr", "{s}-cheek-volume-incr"),
    ("{s}-eye-scale-decr", "{s}-eye-scale-incr"), ("{s}-eye-trans-in", "{s}-eye-trans-out"), ("{s}-eye-height2-decr", "{s}-eye-height2-incr"),
    ("{s}-eye-corner1-down", "{s}-eye-corner1-up"), ("{s}-ear-wing-decr", "{s}-ear-wing-incr"), ("{s}-ear-scale-decr", "{s}-ear-scale-incr"),
]


def face_any(rng):
    """The first version: every slider at +-0.6 whatever the sex. Kept because the player's face comes from it."""
    t = {"head-" + rng.choice(HEADS): rng.uniform(0.4, 0.9)}
    for neg, pos in FACE_AXES:
        v = rng.uniform(-0.6, 0.6) * (0.5 if "eye-" in pos else 1)
        for s in ("lr" if "{s}" in pos else "x"):
            t[(pos if v > 0 else neg).format(s=s)] = abs(v)
    return t


# what tells a woman's face from a man's: jaw, chin, nose and brow size. Ranges by positive target; the rest is symmetric.
SOFT = {"chin-width-incr": (-0.5, 0.05), "chin-height-incr": (-0.4, 0.1), "chin-prominent-incr": (-0.35, 0.1), "chin-jaw-drop-incr": (-0.4, 0.05),
        "chin-bones-incr": (-0.5, 0.0), "nose-scale-vert-incr": (-0.4, 0.15), "nose-scale-horiz-incr": (-0.45, 0.1), "nose-hump-incr": (-0.4, 0.1),
        "nose-volume-incr": (-0.45, 0.05), "nose-scale-depth-incr": (-0.4, 0.1), "nose-curve-convex": (-0.35, 0.1),
        "mouth-lowerlip-volume-incr": (-0.05, 0.5), "mouth-scale-vert-incr": (-0.05, 0.45), "head-scale-horiz-incr": (-0.35, 0.15),
        "{s}-cheek-bones-incr": (-0.1, 0.45), "{s}-eye-scale-incr": (-0.05, 0.4), "{s}-ear-wing-incr": (-0.4, 0.1), "{s}-ear-scale-incr": (-0.4, 0.1)}
HARD = {"chin-width-incr": (-0.15, 0.55), "chin-bones-incr": (-0.1, 0.55), "chin-prominent-incr": (-0.25, 0.45), "chin-jaw-drop-incr": (-0.2, 0.45),
        "nose-scale-horiz-incr": (-0.25, 0.5), "nose-volume-incr": (-0.25, 0.5), "mouth-lowerlip-volume-incr": (-0.4, 0.2),
        "{s}-eye-scale-incr": (-0.4, 0.15)}
HEAD_SHAPES = {0.0: ["oval", "oval", "round", "invertedtriangular", "diamond"], 1.0: ["oval", "round", "square", "rectangular", "triangular", "diamond"]}


def face(rng, g, band):
    grown = band not in ("child", "teen")
    t = {"head-" + rng.choice(HEAD_SHAPES[g]): rng.uniform(0.2, 0.55) if g == 0.0 or not grown else rng.uniform(0.35, 0.85)}
    span = 0.4 if g == 0.0 else 0.5 if grown else 0.3
    for neg, pos in FACE_AXES:
        lo, hi = (SOFT if g == 0.0 or not grown else HARD).get(pos, (-span, span))
        v = rng.uniform(lo, hi) * (0.5 if "eye-" in pos else 1)
        for s in ("lr" if "{s}" in pos else "x"):
            t[(pos if v > 0 else neg).format(s=s)] = abs(v)
    return t


def town(slots, seed):
    """The game's townsfolk. Each person has an own random stream, so one person's draw never moves another's body or face;
    clothes and hair are dealt least-worn first, so the crowd shares as little as it can."""
    clip = lambda v, lo=0.08, hi=1.0: min(hi, max(lo, v))
    deal = random.Random(seed)
    used = {}
    people = []

    def pick(options, keys=lambda o: [o]):
        """the least-worn option, ties broken at random"""
        options = sorted(options, key=str)
        worn = [sum(used.get(k, 0) for k in keys(o)) for o in options]
        return deal.choice([o for o, n in zip(options, worn) if n == min(worn)])

    for i, (g, band, build) in enumerate(slots):
        rng = random.Random(f"{seed}-{i}")
        grown = band in ("young", "middle", "old")
        sex = "female" if g == 0.0 else "male"
        p = dict(g=g, band=band, age=rng.uniform(*AGES[band]), h=clip(rng.gauss(0.5, 0.2), 0.1, 0.95), m=clip(rng.gauss(0.45, 0.12)),
                 w=clip(rng.gauss({"middle": 0.62, "old": 0.55}.get(band, 0.42), 0.2 if grown else 0.1), 0.15),
                 prop=clip(rng.gauss(0.55, 0.15)), cup=clip(rng.gauss(0.5, 0.15)), firm=clip(rng.gauss(0.5, 0.15)))
        if not grown:
            p.update(cup=0.15 if band == "child" else 0.35)
        if build == "curvy":
            p.update(cup=1.0, firm=0.85, prop=1.0, t=CURVY, w=clip(rng.gauss(0.55, 0.05)))
        if build == "buff":
            p.update(m=1.0, prop=1.0, t=BUFF, w=clip(rng.gauss(0.6, 0.05)))
        p["skin"] = {"old": "old", "middle": "middleage"}.get(band, "young") + f"_caucasian_{sex}" + (rng.choice(["", "2"]) if not grown or band == "young" else "")
        p["face"] = face(rng, g, band)
        # no brown: lit as the game lights them, brown irises come out red
        p["eye"] = rng.choice(["blue", "blue", "grey", "grey", "green", "bluegreen", "lightblue", "ice"])
        p["tone"] = rng.uniform(0.55, 0.68)
        p["brow"] = rng.randint(1, 12)

        fits = lambda c, role: WEAR[c]["role"] == role and sex[0] in WEAR[c]["sex"] and band[0] in WEAR[c]["bands"] and \
            (not build or role not in ("top", "full") or build in WEAR[c]["flags"])
        tops, bots, fulls, shoes = ([c for c in WEAR if fits(c, role)] for role in ("top", "legs", "full", "shoe"))
        outfits = [(t, b) for t in tops for b in bots if not ("warm" in WEAR[t]["flags"] and "short" in WEAR[b]["flags"])] + [(f,) for f in fulls]
        flag = lambda o, name: any(name in WEAR[c]["flags"] for c in o)
        # a small town on a weekday: two suits per sex at most
        outfits = [o for o in outfits if not (flag(o, "formal") and used.get(f"formal {sex}", 0) >= 2)]
        fresh = [o for o in outfits if o not in used and all(used.get(c, 0) < (3 if flag([c], "dye") else 2) for c in o)]
        outfit = pick(fresh or outfits, keys=lambda o: [o, *o])
        p["dye"] = {}
        for c in outfit:
            if flag([c], "dye"):
                shades = LEG_DYES if WEAR[c]["role"] == "legs" else [d for d in DYES if g == 0.0 or d not in ("pink", "lilac")]
                p["dye"][c] = pick([d for d in shades if d not in p["dye"].values()], keys=lambda d: [f"dye {c} {d}", f"dye {d} {sex}"])
                used[f"dye {c} {p['dye'][c]}"] = used[f"dye {p['dye'][c]} {sex}"] = 1 + used.get(f"dye {p['dye'][c]} {sex}", 0)
        # a skirt goes with flat shoes, not trainers
        shoe = pick([s for s in shoes if "flat" in WEAR[s]["flags"]] if flag(outfit, "skirt") and grown else shoes)
        hat = None
        hats = [c for c in WEAR if fits(c, "hat")]
        hats = [c for c in hats if not used.get(c)]
        if hats and rng.random() < 0.3:
            hat = pick(hats)
        styles = [h for h, (groups, _) in HAIR.items() if f"{sex[0]}{band[0]}" in groups.split()]
        p["hair"] = None if hat else pick(styles + ([None] if g == 1.0 and band in ("middle", "old") else []), keys=lambda h: [f"hair {h} {sex}"])
        shades = {"child": ["blond", "blond", "dark blond", "light brown"], "teen": ["blond", "dark blond", "light brown", "brown"],
                  "young": ["blond", "dark blond", "light brown", "brown", "dark brown", "black", "auburn", "ginger"],
                  "middle": ["dark blond", "light brown", "brown", "dark brown", "black", "auburn", "dark grey", "blond"],
                  "old": ["grey", "white", "grey", "white", "dark grey"] + (["auburn"] if g == 0.0 else [])}[band]
        p["haircol"] = pick(shades, keys=lambda c: [f"shade {c} {sex} {band}"])
        for k in (outfit, shoe, hat, *outfit, f"hair {p['hair']} {sex}", f"shade {p['haircol']} {sex} {band}", *([f"formal {sex}"] if flag(outfit, "formal") else [])):
            used[k] = used.get(k, 0) + 1
        p["wear"] = [*outfit, shoe] + ([hat] if hat else [])
        who = {"child": "girl" if g == 0.0 else "boy", "teen": "teen girl" if g == 0.0 else "teen boy"}.get(band, f"{band} {'woman' if g == 0.0 else 'man'}")
        p["desc"] = f"{build} {who}".strip()
        p["n"] = f"{i} {p['desc']}: {' + '.join(c + (' ' + p['dye'][c] if c in p['dye'] else '') for c in p['wear'])} | hair {p['hair']} {p['haircol']}"
        people.append(p)
    return people


TEST = dict(age=0.55, w=0.5, m=0.5, h=0.5)
if which == "crowd":
    SETS["crowd"] = town(CROWD, "raseiniai-crowd")
if which == "town":
    draw = random.Random("raseiniai")
    SETS["town"] = town([(draw.choice([0.0, 1.0]), draw.choices(list(AGES), [1, 1, 2.5, 3, 3])[0], "")
                         for _ in range(int(args[2]) if len(args) > 2 and args[2].isdigit() else 24)], "raseiniai")
if which == "hairs":
    pick = next((a[6:].split(",") for a in args if a.startswith("style=")), None)
    SETS["hairs"] = [dict(TEST, n=f"{h} {s}", g=g, skin=f"young_caucasian_{s}", hair=h, wear=["toigo_fisherman_sweater", "toigo_wool_pants", "shoes01"])
                     for h in sorted(n for k, n in FREE if k == "hair") for g, s in ((0.0, "female"), (1.0, "male")) if not pick or h in pick and g == 0.0]
if which == "brows":
    SETS["brows"] = [dict(TEST, n=f"brow {k} {s}", g=g, skin=f"young_caucasian_{s}", hair="short04", brow=k, face=face(random.Random("b"), g, "young"),
                          eye=("ice", "lightblue", "bluegreen", "green", "grey", "blue")[k % 6], tone=0.5 + 0.02 * k,
                          wear=["toigo_fisherman_sweater", "toigo_wool_pants", "shoes01"]) for g, s in ((0.0, "female"), (1.0, "male")) for k in range(1, 13)]
if which == "wears":
    HERS = ("female", "dress", "skirt", "blouse", "halter", "camisole", "bodice", "tank", "flatshoe", "disco", "off-shoulder", "cardigan", "kofta", "cut_out")
    SETS["wears"] = []
    for c in sorted(n for k, n in FREE if k == "clothes"):
        role = role_of(c)
        wear = {"top": [c, "toigo_wool_pants", "shoes01"], "legs": ["toigo_fisherman_sweater", c, "shoes01"], "full": [c, "shoes01"],
                "shoe": ["toigo_fisherman_sweater", "toigo_wool_pants", c]}.get(role, ["toigo_fisherman_sweater", "toigo_wool_pants", "shoes01", c])
        for g, s in ((0.0, "female"), (1.0, "male")):
            if not (g == 1.0 and any(k in c for k in HERS)) and not (g == 0.0 and "male" in c and "female" not in c):
                SETS["wears"].append(dict(TEST, n=f"{c} {s}", g=g, skin=f"young_caucasian_{s}", hair="short01" if g else "bob02", wear=wear))
PEOPLE = SETS[which]
# debugging aids: only=N renders one person large, nohair shows what the hair hides, res=PX sets pixels per column
ONLY = next((int(a[5:]) for a in args if a.startswith("only=")), None)
RES = next((int(a[4:]) for a in args if a.startswith("res=")), 500)
if ONLY is not None:
    PEOPLE = [PEOPLE[ONLY]]
if "nohair" in args:
    PEOPLE = [{**p, "hair": None} for p in PEOPLE]


def find(subdir, name, ext):
    for p in (AssetService.list_mhmat_assets(subdir) if ext == "mhmat" else AssetService.list_mhclo_assets(subdir)):
        if name in (p.stem, p.parent.name):
            return str(p)
    raise SystemExit(f"asset not found: {subdir}/{name}.{ext}")


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)


def tris_of(o):
    me = o.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh()
    me.calc_loop_triangles()
    return len(me.loop_triangles)


def shaders(o):
    return [(s.material, n) for s in o.material_slots for n in s.material.node_tree.nodes if n.type == "BSDF_PRINCIPLED"]


def diffuse_node(mat):
    """The image node that colours a material. MakeSkin materials mix it with intensity and occlusion nodes, which the glTF
    exporter cannot follow reliably, so it is wired straight into the shader."""
    for node in mat.node_tree.nodes:
        if node.type == "BSDF_PRINCIPLED":
            todo = [l.from_node for l in node.inputs["Base Color"].links]
            found = mat.node_tree.nodes.get("diffuseTexture")
            while todo and not found:
                n = todo.pop()
                if n.type == "TEX_IMAGE" and n.image:
                    found = n
                todo += [l.from_node for i in n.inputs for l in i.links]
            if found and found.image:
                mat.node_tree.links.new(found.outputs["Color"], node.inputs["Base Color"])
                return found


def repaint(img, seen=None, gain=1.0):
    """Recolour a texture to the colour the eye should see, keeping its light and dark; or only darken it."""
    px = np.empty(len(img.pixels), dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    if seen:
        # the game shows pow(linear, 0.6) * 1.5, about 1.2 * srgb ** 0.6: undo it
        want = (np.array(seen, dtype=np.float32) / 1.2) ** (1 / 0.6)
        lum = px[:, :3].mean(axis=1)
        solid = px[:, 3] > 0.5
        lum /= max(1e-4, float(lum[solid].mean()) if solid.any() else 1.0)
        if min(seen) > 0.55:
            # grey and white keep only half the texture's contrast, or dark strands turn them into tin foil
            lum = 0.5 + 0.5 * lum
        px[:, :3] = np.clip(lum[:, None] * want, 0, 1)
    px[:, :3] *= gain
    img.pixels.foreach_set(px.ravel())
    img.update()


def face_zone(base):
    """Vertices of the front of the head that face outward: brow, eyes, nose, mouth, cheeks, chin. Decimating them like the
    legs crumples the mouth and nose; the inside of the mouth and the back of the head can go."""
    gi = {g.name: g.index for g in base.vertex_groups}
    vs = base.data.vertices
    weight = lambda v, name: next((e.weight for e in v.groups if e.group == gi[name]), 0.0)
    body = {v.index for v in vs if weight(v, "body") > 0}
    polys = [tuple(p.vertices) for p in base.data.polygons if all(k in body for k in p.vertices)]
    head = [v for v in vs if v.index in body and weight(v, "head") > 0.5]
    ys = [v.co.y for v in head]
    cut = min(ys) + 0.5 * (max(ys) - min(ys))
    tree = BVHTree.FromPolygons([v.co for v in vs], polys)
    zone = {v.index for v in head if v.co.y < cut and tree.ray_cast(v.co + v.normal * 0.001, v.normal, 0.03)[0] is None}
    heads = {v.index for v in head}
    return zone | {k for poly in polys if any(v in zone for v in poly) for k in poly if k in heads}


# directions a surface point can be seen from, in its own frame (z along the normal); nothing is seen edge-on
SIGHT = [(math.sqrt(1 - z * z) * math.cos(k * 2.39996), math.sqrt(1 - z * z) * math.sin(k * 2.39996), z)
         for k, z in ((k, 0.2 + 0.8 * (k + 0.5) / 20) for k in range(20))]


def unseen(obj, covers):
    """Per vertex of `obj` (skin, or a garment worn under another): can nobody see it behind the `covers`?

    A vertex is unseen when every line of sight from it ends on a cover, or when it pokes out through one: a big bust or
    bottom pushes skin through tight cloth, and decimated cloth cuts corners. Poking means lying just outside cloth that
    faces the same way; the neck inside a wide collar is near cloth too, but that cloth faces it, and the first rule
    (distance alone) cut a hole there. The covers are read as they will be exported.
    """
    dg = bpy.context.evaluated_depsgraph_get()
    trees = [BVHTree.FromObject(g, dg) for g in covers]
    shown = [(m, m.show_viewport) for m in obj.modifiers]
    for m, _ in shown:
        m.show_viewport = False
    dg = bpy.context.evaluated_depsgraph_get()
    points = [(obj.matrix_world @ v.co, v.normal.copy()) for v in obj.evaluated_get(dg).to_mesh().vertices]
    for m, was in shown:
        m.show_viewport = was

    def hidden(c, n):
        for tree in trees:
            hit, normal, _, dist = tree.find_nearest(c, 0.015)
            if hit is not None and dist > 1e-6 and (c - hit).dot(normal) / dist > 0.6 and n.dot(normal) > 0.3:
                return True
        t = n.orthogonal().normalized()
        b = n.cross(t)
        return all(any(tree.ray_cast(c, t * x + b * y + n * z, 3.0)[0] is not None for tree in trees) for x, y, z in SIGHT)

    return [hidden(c, n) for c, n in points]


def hide_under(obj, covers, tuck=0.0):
    """Mask the faces of `obj` that are unseen behind the `covers`. Unseen vertices next to seen ones stay, so the edge of
    what is left lies inside the cloth; `tuck` pulls them inward so they stay behind it."""
    if not covers:
        return
    under = unseen(obj, covers)
    keep = [not u for u in under]
    for vs in [poly.vertices for poly in obj.data.polygons if any(keep[v] for v in poly.vertices)]:
        for v in vs:
            keep[v] = True
    group = obj.vertex_groups.new(name="under_clothes")
    group.add([i for i, u in enumerate(under) if u and not keep[i]], 1.0, "REPLACE")
    mask = obj.modifiers.new("Hide what is under clothes", "MASK")
    mask.vertex_group, mask.invert_vertex_group = group.name, True
    if tuck:
        for v in obj.data.vertices:
            if under[v.index] and keep[v.index]:
                v.co -= v.normal * tuck


def freeze(obj):
    """Make the mesh what its modifiers leave of it, so that what is hidden next is judged on the final surface."""
    dg = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
    for m in [m for m in obj.modifiers if m.type != "ARMATURE"]:
        obj.modifiers.remove(m)
    obj.data = mesh


def export_person(i, p, objs, base, parts):
    """One skinned GLB per person: shape keys baked, hidden skin removed, about TRIS triangles, small textures.

    Hair, brows, lashes, eyes, hats: untouched (collapsing alpha cards shreds them). Clothes: welded, then decimated to their
    share. Body: the face keeps FACE_KEEP of its triangles, the rest of the skin pays for it."""
    TargetService.bake_targets(base)
    clip = lambda v, lo: min(1.0, max(lo, v))
    before = sum(tris_of(o) for o, *_ in parts)
    height = round(max(v.co.z for v in base.data.vertices) * base.matrix_world.to_scale().z, 3)
    wearing = lambda *roles: [o for o, role, *_ in parts if role in roles]
    cloth = wearing("top", "legs", "full", "shoe")
    ratio = clip(CLOTH_SHARE * TRIS / max(1, sum(tris_of(o) for o in cloth)), 0.1)
    for o in cloth:
        if tris_of(o) > 300:
            # seams are split in the source meshes and open up when collapsed, unless welded first
            o.modifiers.new("weld", "WELD").merge_threshold = 0.0002
            o.modifiers.new("decimate", "DECIMATE").ratio = ratio
        freeze(o)
    if HAIR_KEEP < 1 or p.get("hair") in HAIR and HAIR[p["hair"]][1] < 1:
        for o in wearing("hair"):
            o.modifiers.new("decimate", "DECIMATE").ratio = HAIR_KEEP if HAIR_KEEP < 1 else HAIR[p["hair"]][1]
    # trousers under a sweater's hem and socks inside trouser legs poke through as well
    for o, covers in [(o, wearing("top")) for o in wearing("legs")] + [(o, wearing("legs", "full")) for o in wearing("shoe")]:
        hide_under(o, covers, tuck=0.012)
        freeze(o)
    # the garments' own lists of skin to delete go: they are drawn for the undecimated cloth and leave gaps at collars
    for m in [m for m in base.modifiers if m.type == "MASK" and m.name.startswith("Delete.")]:
        base.modifiers.remove(m)
    freeze(base)

    rig = base.parent
    at = lambda bone: (rig.matrix_world @ rig.data.bones[bone].head_local).z
    dg = bpy.context.evaluated_depsgraph_get()
    low = lambda o: min((o.matrix_world @ v.co).z for v in o.evaluated_get(dg).to_mesh().vertices)
    hems = [low(o) for o in wearing("legs", "full")]
    hair = wearing("hair")

    # the skin is decimated whole, as hard as it takes for what will show to fit, and only then is the unseen part cut away:
    # cut first, and the decimation eats into the edge of what is left
    zone = face_zone(base)
    for name, members in (("dec_face", zone), ("dec_rest", {v.index for v in base.data.vertices} - zone)):
        base.vertex_groups.new(name=name).add(sorted(members), 1.0, "REPLACE")
    under = unseen(base, cloth)
    shown = [poly for poly in base.data.polygons if not all(under[v] for v in poly.vertices)]
    face_tris = 2 * sum(all(v in zone for v in poly.vertices) for poly in shown)
    rest = 2 * len(shown) - face_tris
    left = TRIS - sum(tris_of(o) for o, *_ in parts if o is not base)
    keep = clip((left - FACE_KEEP * face_tris) / max(1, rest), 0.06)
    whole = 2 * len(base.data.polygons)
    zone_tris = 2 * sum(all(v in zone for v in poly.vertices) for poly in base.data.polygons)
    after = zone_tris + keep * (whole - zone_tris)
    for name, group, ratio in (("decimate body", "dec_rest", after / whole),
                               ("decimate face", "dec_face", (after - (1 - FACE_KEEP) * zone_tris) / after)):
        mod = base.modifiers.new(name, "DECIMATE")
        mod.vertex_group, mod.ratio, mod.use_symmetry = group, ratio, True
    freeze(base)
    hide_under(base, cloth, tuck=0.006)

    tint = []
    for o, role, kind, name in parts:
        label = {"skin": "skin", "eyeball": "eyeball", "brow": "brow", "lash": "lash"}.get(role, f"{role}_{name}")
        # the game picks alpha-tested cards by /hair|brow|lash/ and the eyes by /eye/
        assert bool(re.search("hair|brow|lash", label)) == (role in ("hair", "brow", "lash")) and ("eye" in label) == (role == "eyeball"), label
        o.name = o.data.name = label
        for mat, node in shaders(o):
            for link in list(node.inputs["Normal"].links):
                mat.node_tree.links.remove(link)
            mat.name = label
            tex = diffuse_node(mat)
            if not tex:
                continue
            # a copy: the next person with this garment must not inherit this one's scaling and dye
            src, img = tex.image, tex.image.copy()
            # every node showing it, or the exporter may take the alpha's node and ship the untouched original
            for n in mat.node_tree.nodes:
                if n.type == "TEX_IMAGE" and n.image == src:
                    n.image = img
            w, h = img.size
            # the face lives on the skin texture, so it keeps more pixels than clothes, hair and eyes
            cap = {"skin": 512, "eyeball": 128, "brow": 128, "lash": 128}.get(role, 256)
            if max(w, h) > cap:
                img.scale(max(1, w * cap // max(w, h)), max(1, h * cap // max(w, h)))
            # always rewritten: the exporter copies an unchanged .webp from disk, ignoring the scaling (a size change is not "dirty")
            seen = HAIR_COLOURS[p["haircol"]] if role == "hair" and p.get("haircol") else DYES[p["dye"][name]] if name in p.get("dye", {}) else None
            # the game's brightening burns MakeHuman's light skins out to white
            repaint(img, seen, gain=p["tone"] if role == "skin" and p.get("tone") else 1.0)
            img.name = label
        if name in WEAR and role in ("top", "legs", "full") and (role != "legs" or WEAR[name]["flags"] & {"skirt", "dye"}) \
                and not WEAR[name]["flags"] & {"formal"} and "suit" not in name:
            tint.append(label)
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    out = os.path.join(EXPORT, f"{which}_{i:02d}.glb")
    bpy.ops.export_scene.gltf(filepath=out, use_selection=True, export_apply=True, export_animations=False,
                              export_image_format="WEBP", export_image_quality=80, export_morph=False)
    # meshopt-compressed (the game's loader has the decoder); 85% of an uncompressed person was mesh data. Materials keep
    # their names (the game reads them); gltfpack drops the mesh nodes' names.
    subprocess.run(["npx", "-y", "gltfpack@0.25.0", "-i", out, "-o", out[:-4] + ".tmp.glb", "-cc", "-km", "-kn"], check=True, capture_output=True)
    os.replace(out[:-4] + ".tmp.glb", out)
    sex = "f" if p["g"] == 0.0 else "m"
    band = p.get("band", "young")
    knee, ankle = at("calf_l"), at("foot_l")
    meta = {"file": os.path.basename(out), "sex": sex, "age": {"child": "kid", "teen": "kid", "old": "old"}.get(band, "adult"), "band": band,
            "desc": p.get("desc") or p["n"].split(":")[0], "height": height,
            "skirt": any("skirt" in WEAR[name]["flags"] if name in WEAR else ("skirt" in name or "dress" in name)
                         for _, role, _, name in parts if role in ("legs", "full")),
            "bare_legs": not hems or min(hems) > ankle + 0.35 * (knee - ankle),
            "long_hair": bool(hair) and low(hair[0]) < at("neck_01"),
            "hat": any(role == "hat" for _, role, *_ in parts), "tint": tint,
            "credits": [{"asset": "MakeHuman base mesh and skin", "author": "MakeHuman team", "license": "CC0"}]
            + [{"asset": name, "author": META[(kind, name)]["author"], "license": META[(kind, name)]["license"]} for _, _, kind, name in parts if kind],
            "wear": p["wear"], "dye": p.get("dye", {}), "hair": p.get("hair"), "hair_colour": p.get("haircol"),
            "tris": {o.name: tris_of(o) for o, *_ in parts}}
    with open(out[:-4] + ".json", "w") as fh:
        json.dump(meta, fh)
    after = sum(meta["tris"].values())
    stats.append((p["n"], f"{before} -> {after} tris {meta['tris']}, {os.path.getsize(out) // 1024} KB"))
    for o in objs:
        bpy.data.objects.remove(o)
    # textures were scaled and repainted in place: the next person must load fresh ones
    bpy.data.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)


# faces: one strip, since a second row of heads would sit inside the first row's chests
COLS, DX, DZ = (len(PEOPLE), 0.42, 0.42) if FACES else (8 if len(PEOPLE) > 12 else min(6, len(PEOPLE)), 1.15, 2.15)
ROWS = math.ceil(len(PEOPLE) / COLS)
stats = []
for i, p in enumerate(PEOPLE):
    macro = TargetService.get_default_macro_info_dict()
    macro.update(gender=p["g"], age=p["age"], weight=p["w"], muscle=p["m"], height=p["h"],
                 cupsize=p.get("cup", 0.5), firmness=p.get("firm", 0.5), proportions=p.get("prop", 0.5))
    macro["race"] = dict(asian=0.0, caucasian=1.0, african=0.0)
    before = set(bpy.data.objects)
    base = HumanService.create_human(macro_detail_dict=macro, scale=0.1)
    # detail targets go on before clothes, which are fitted to the body as it is at load time
    rng = random.Random(f"{which}{i if ONLY is None else ONLY}")
    for name, weight in {**p.get("t", {}), **(p.get("face") or face_any(rng))}.items():
        path = TargetService.target_full_path(name)
        if not path:
            raise SystemExit(f"target not found: {name}")
        TargetService.load_target(base, path, weight=weight, name=name)
    if EXPORT:
        # Unreal-style bone names, the same ones the game's Quaternius skeleton uses
        HumanService.add_builtin_rig(base, "game_engine", import_weights=True)
    HumanService.set_character_skin(find("skins", p["skin"], "mhmat"), base, skin_type="GAMEENGINE")
    eyes = find("eyes", "low-poly", "mhclo")
    meta = Mhclo()
    meta.load(eyes, only_metadata=True)
    colour = p.get("eye") or rng.choice(["blue", "grey", "green", "bluegreen", "lightblue", "brown"])
    # the game-engine material renders the eye texture as a dark disc; MakeSkin handles it
    parts = [(base, "skin", None, None),
             (HumanService.add_mhclo_asset(eyes, base, asset_type="eyes", subdiv_levels=0, material_type="MAKESKIN", set_up_rigging=bool(EXPORT),
                                           alternative_materials={meta.uuid: f"materials/{colour}.mhmat"}), "eyeball", "eyes", "low-poly")]
    for part, role, name in (("eyebrows", "brow", f"eyebrow{p.get('brow') or rng.randint(1, 12):03d}"), ("eyelashes", "lash", "eyelashes01"), ("hair", "hair", p["hair"])):
        if name:
            parts.append((HumanService.add_mhclo_asset(find(part, name, "mhclo"), base, asset_type=part, subdiv_levels=0, material_type="MAKESKIN",
                                                       set_up_rigging=bool(EXPORT)), role, part, name))
    for name in p["wear"]:
        garment = HumanService.add_mhclo_asset(find("clothes", name, "mhclo"), base, asset_type="Clothes", subdiv_levels=0, material_type="GAMEENGINE", set_up_rigging=bool(EXPORT))
        for mat, node in shaders(garment):
            # several community materials come out as wet plastic; cloth is matte
            for socket, value in (("Roughness", 0.85), ("Metallic", 0.0)) + ((("Base Color", (*p["flat"][name], 1.0)),) if name in p.get("flat", {}) else ()):
                for link in list(node.inputs[socket].links):
                    mat.node_tree.links.remove(link)
                node.inputs[socket].default_value = value
        if role_of(name) == "top" and any(role_of(c) == "legs" for c in p["wear"]):
            # a top worn over separate trousers is pushed out a centimetre so the waistband does not poke through its hem
            push = garment.modifiers.new("over", "DISPLACE")
            push.strength, push.mid_level = 0.012, 0.0
        parts.append((garment, role_of(name), "clothes", name))
    mine = [o for o in bpy.data.objects if o not in before]
    if EXPORT:
        export_person(i, p, mine, base, parts)
        continue
    # garments that lie on the skin; glasses, hats and shoes are left out (a pair of glasses must not erase the face behind it)
    hide_under(base, [o for o, role, *_ in parts if role in ("top", "legs", "full")])
    dg = bpy.context.evaluated_depsgraph_get()
    stats.append((p["n"], sum(tris_of(o) for o in mine if o.type == "MESH")))
    x, z = (i % COLS - (COLS - 1) / 2) * DX, -(i // COLS) * DZ
    if FACES:
        # hang everyone by the top of the skull so heads line up whatever the height
        z -= max(v.co.z for v in base.evaluated_get(dg).to_mesh().vertices)
    for o in mine:
        if o.parent is None:
            o.location = (x, 0, z)
            o.rotation_euler = (0, 0, math.radians(TURN))

if EXPORT:
    for n, t in stats:
        print(f"STAT {n}: {t}")
    raise SystemExit(0)

scene = bpy.context.scene
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
scene.collection.objects.link(cam)
cam.data.type = "ORTHO"
cam.data.ortho_scale = COLS * DX + (0 if FACES else 0.3)
cam.location = (0, -10, (0.09 - ROWS * DZ / 2) if FACES else (0.95 - (ROWS - 1) * DZ / 2))
cam.rotation_euler = (math.radians(90), 0, 0)
scene.camera = cam
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
sun.data.energy = 3.0
sun.rotation_euler = (math.radians(55), 0, math.radians(25))
scene.collection.objects.link(sun)
world = bpy.data.worlds.new("w")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.9, 0.9, 0.9, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.9
scene.world = world
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 6000 if FACES else RES * COLS
scene.render.resolution_y = int(scene.render.resolution_x * (ROWS * DZ) / cam.data.ortho_scale)
scene.view_settings.view_transform = "Standard"
scene.render.filepath = out
bpy.ops.render.render(write_still=True)
for n, t in stats:
    print(f"STAT {n}: {t} tris")
