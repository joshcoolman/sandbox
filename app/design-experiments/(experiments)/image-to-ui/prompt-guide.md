# Technical Photography Prompts for AI Image Generation

Reference guide for achieving specific photographic looks through technical specifications -- lighting, film stocks, lenses, and processing. Focused on the *look* of photography rather than composition or subject matter.

## SOUL 2.0 Presets

Higgsfield SOUL 2.0 ships with 20+ curated presets as aesthetic anchors. Start with a preset, then layer technical terms.

| Preset | Look |
|---|---|
| Flash editorial | On-camera flash, hard shadows, fashion energy |
| Subtle flash | Softer flash fill, lifestyle editorial |
| Street photography | Documentary, natural light, candid feel |
| Theatrical light | Dramatic stage lighting, high contrast |
| Digital camera | Consumer digital aesthetic |
| Old smartphone | Lo-fi mobile, low dynamic range |
| Retro BW | Classic black and white |
| Y2K studio / Y2K street | Early 2000s aesthetic |
| Asian nostalgia | Warm, muted, nostalgic tones |
| Surreal solarization | Inverted tones, experimental |
| Siren / Drain | Dark, moody subculture aesthetics |
| Candy pop | Bright, saturated, playful |
| Frutiger aero | Glossy, translucent, mid-2000s digital |

SOUL 2.0 understands subcultural language natively. Reference vibes and micro-trends without over-explaining. Use Soul HEX for precise color control via hex codes.

---

## Film Stocks

The single most powerful modifier. Each stock shifts color science, grain, and mood. Don't mix stocks in one prompt.

### Color Negative

| Stock | Look |
|---|---|
| **Kodak Portra 400** | Warm, natural skin tones, soft highlight roll-off, slightly desaturated. The default "beautiful photo" film |
| **Kodak Portra 800** | Same warmth as 400, more grain, better low-light rendering |
| **Kodak Ektar 100** | Ultra-saturated, vibrant, punchy. Fine grain. Landscape/travel |
| **Kodak Gold 200** | Warm, nostalgic consumer film. "Memory" feeling, golden cast |
| **FujiColor C200** | Balanced warm consumer aesthetic, everyday feel |
| **Fujifilm Pro 400H** | Soft, dreamy pastels. Ethereal, airy quality |
| **Fujifilm Superia 400** | Cool undertones, good contrast, slightly blue shadows |

### Slide / Transparency

| Stock | Look |
|---|---|
| **Kodak Ektachrome E100** | Fine grain, vibrant but controlled, slightly cool. Transparency sharpness |
| **Kodachrome 64** | Rich reds, deep blues, warm saturation. The iconic 1970s look |
| **Fujifilm Velvia 50** | Extreme saturation, deep blues, punchy greens. Landscape king |
| **Fujifilm Provia 100F** | Neutral, accurate, fine grain. Professional standard |

### Cinema

| Stock | Look |
|---|---|
| **Kodak Vision3 500T** | Tungsten-balanced cinema film. Blue-shifted under daylight, warm under tungsten |
| **CineStill 800T** | Dreamy nighttime glow, red halation around bright lights. The "neon night" film |

### Black & White

| Stock | Look |
|---|---|
| **Kodak Tri-X 400** | Strong contrast, visible grain. Photojournalism standard |
| **Ilford HP5 Plus 400** | Characteristic grain, good tonal range. Documentary feel |
| **Ilford Delta 3200** | Extreme grain, gritty, high-ISO push. Raw energy |

### Grain Control

- `"fine film grain"` -- subtle texture
- `"heavy classic film grain"` -- pronounced, visible
- `"visible grain like Ilford HP5"` -- reference a specific stock's grain structure
- `"dust particles and fine noise pattern"` -- adds analog imperfection

---

## Lenses

Focal length = emotional distance from subject.

### Focal Lengths

| Lens | Character |
|---|---|
| **18-24mm wide-angle** | Dramatic perspective distortion, foreground emphasis, environmental. Immersive |
| **35mm** | Natural perspective, street/documentary standard. The "being there" lens |
| **50mm f/1.4** | Normal eye perspective, shallow DOF. Intimate, honest |
| **85mm f/1.4** | Portrait king, beautiful bokeh, flattering facial compression |
| **135mm f/2** | Extreme compression, dreamy separation. Fashion/editorial |
| **200mm telephoto** | Voyeuristic compression, stacked backgrounds. Sports/surveillance feel |

### Named Lens Character

| Lens | Quality |
|---|---|
| **Helios 44-2** | Swirly bokeh, Soviet-era dreamy rendering |
| **Cooke S4** | Warm skin tones, gentle highlight roll-off. Cinema standard |
| **Leica Summilux 50mm** | Precision, micro-contrast, the "Leica glow" |
| **Anamorphic lens** | Horizontal flares, oval bokeh, widescreen cinema feel |
| **Petzval lens** | Extreme swirly bokeh, sharp center, vintage portrait quality |

### Aperture as Style

| Setting | Effect |
|---|---|
| **f/1.2 - f/1.4** | Dreamy subject isolation, heavy bokeh, razor-thin focus plane |
| **f/2.8** | Moderate separation, soft background, still retains context |
| **f/5.6** | More depth, balanced sharpness. General purpose |
| **f/8** | Sharp throughout. Product/studio standard |
| **f/11 - f/16** | Maximum depth of field. Landscape sharpness |

### Camera Bodies (format-specific qualities)

| Camera | Quality |
|---|---|
| **Hasselblad 500C** | Medium format, incredible detail, shallow focus plane, square format |
| **Mamiya RZ67** | Medium format, 6x7 ratio, portrait workhorse |
| **Leica M** | Rangefinder sharpness, street photography DNA |
| **Canon 5D Mark IV** | Modern digital full-frame baseline |
| **Ricoh GR III** | Street compact, distinct rendering, 28mm fixed |
| **Fujifilm X100V** | Street/lifestyle compact, film simulation character |
| **Phase One IQ4** | Digital medium format, maximum resolution |
| **Nikon D850** | High-resolution DSLR, editorial/commercial standard |

---

## Lighting

The difference between "cinematic" and actually looking cinematic.

### Portrait Lighting (named setups)

| Setup | Description |
|---|---|
| **Rembrandt lighting** | Single key light high and to the side. Triangle highlight on shadow-side cheek. Classic drama |
| **Butterfly / Paramount lighting** | Light directly above and in front. Butterfly shadow under nose. Glamour/beauty |
| **Split lighting** | Light from pure side. Half face lit, half in total shadow. Stark, editorial |
| **Loop lighting** | Key slightly off-center, small shadow loops from nose toward cheek. Versatile standard |
| **Broad lighting** | Lit side of face toward camera. Opens up narrow faces |
| **Short lighting** | Lit side away from camera. Slimming, moody, dimensional |

### Cinematic Lighting Techniques

| Technique | Effect |
|---|---|
| **Chiaroscuro** | Extreme light/dark contrast. Renaissance painting quality, Caravaggio |
| **Low-key lighting** | Mostly dark frame, selective highlights. Noir, thriller |
| **High-key lighting** | Bright, minimal shadows. Beauty, fashion, clinical |
| **Practical lighting** | Light sources visible in frame -- lamps, candles, screens. Realism |
| **Motivated lighting** | Light appears to come from a logical in-scene source |
| **Rim / edge lighting** | Backlight creating bright outline on subject. Premium separation |
| **Kicker light** | Side-rear accent. Adds dimension without flooding |
| **Hair light** | Overhead-rear light targeting hair. Separation from background |
| **Fill light, negative** | Intentional absence of fill. Lets shadows go deep |

### Natural / Environmental

| Condition | Quality |
|---|---|
| **Golden hour backlight** | Warm, soft, lens flare potential, glowing edges |
| **Blue hour** | Cool twilight, moody, transitional |
| **Overcast diffused** | Soft, even, no harsh shadows. Pastel quality |
| **Hard midday sun** | Strong shadows, high contrast, unforgiving |
| **Window light, single source** | Directional, painterly. Vermeer quality |
| **Tungsten mixed with daylight** | Warm/cool color contrast in same frame |
| **Candlelight only** | Warm, flickering, intimate or eerie |
| **Neon / mixed color sources** | Urban night, color-cast rim light, reflections |

### Effective Prompt Fragments

```
"large softbox key light at 45 degrees, soft wrap, subtle fill"
"strong rim light behind subject, clean edge highlights, minimal spill"
"single key light high camera-left, dramatic shadows, triangle cheek highlight"
"neon signs casting magenta and cyan light, colored rim light, soft bloom"
"soft diffused studio lighting, even exposure, gentle highlights"
"low key setup with strong rim light, moody contrast, subtle haze"
"on-camera flash, hard shadow behind subject, raw energy"
"warm practical lamp light, muted orange, analog indoor ambience"
```

---

## Color Grading / Processing

| Technique | Effect |
|---|---|
| **Bleach bypass** | Desaturated, high contrast, metallic/silver look. Saving Private Ryan |
| **Cross-processing** | Slide film as negative. Shifted colors, high saturation, unpredictable |
| **Teal and orange** | Complementary push. Hollywood blockbuster standard |
| **Lifted blacks** | Shadows don't reach full black. Faded, vintage, film-like |
| **Crushed shadows** | Deep blacks eat shadow detail. High contrast, noir |
| **Push processing +2** | Increased grain, contrast, saturation. Gritty, urgent |
| **Pull processing** | Reduced contrast, softer tones, lower grain |
| **Desaturated highlights** | Film-like roll-off, prevents blown-out digital look |
| **Orange and teal split tone** | Warm highlights, cool shadows. Modern cinema |
| **Sepia tone** | Warm monochrome. Historical, nostalgic |

---

## Era-Specific Looks

| Era | Key Modifiers |
|---|---|
| **1940s film noir** | High contrast B&W, hard side-lighting, deep shadows, fedora optional |
| **1950s Kodak Gold** | Sepia-warm, soft romantic nostalgia, Technicolor saturation |
| **1960s mod** | High contrast, bold primary colors, graphic quality |
| **1970s Kodachrome** | Rich reds, deep blues, warm saturation, light leaks |
| **1980s flash editorial** | On-camera flash, hard shadows, fashion energy, high saturation |
| **1990s disposable camera** | Flash, date stamp feel, slightly off-color, consumer grain |
| **Early 2000s digital** | Over-sharpened, digital noise, consumer white balance |
| **Polaroid SX-70** | Instant film, muted colors, soft focus, white border |

---

## Complete Prompt Examples

### Warm Portrait (Portra + Rembrandt)
```
Portrait at wooden desk, thoughtful expression, 85mm portrait lens,
shallow depth of field, sharp eyes, Rembrandt lighting with single key
light high camera-left, dramatic shadows, triangle cheek highlight,
warm tones, dark muted background, Kodak Portra 400
```

### Night Street (CineStill + Neon)
```
Street portrait at night in neon-lit alley, rain-slick pavement,
35mm lens, moderate depth of field, neon signs casting magenta and
cyan light, colored rim light, soft bloom, CineStill 800T, red
halation around bright lights, realistic skin tones
```

### Landscape (Velvia + Natural)
```
Solitary modern Scandinavian cabin with floor-to-ceiling windows
overlooks a misty lake at dawn, mountains reflected in still water,
Fujifilm Velvia 50, deep saturated greens and blues
```

### Editorial Flash (Direct + Hard)
```
8K studio portrait with on-camera flash, hard shadow behind subject,
neutral background, visible texture on skin and fabric, Nikon D850,
classic film contrast, vintage editorial energy
```

### Indoor Tungsten (Portra + Practical)
```
Woman sitting by lamp light, visible film grain and dust particles,
muted orange lighting, Canon RF 50mm lens depth, fine noise pattern,
true analog indoor ambience, Kodak Portra aesthetic
```

### 1970s Nostalgia (Mamiya + Light Leak)
```
Medium portrait with warm color palette from classic 1970s film,
dreamy glow, intentional light leak with amber and red wash, heavy
classic film grain, Mamiya RZ67 look, retro photography aesthetic
```

### Moody B&W (Ilford + Window)
```
Monochrome portrait, visible grain like Ilford HP5 film, soft window
light source, deep shadow fall-off, fine highlight preservation,
Leica SL2 85mm lens, timeless analog aesthetic, black and white
```

### Travel Documentary (Fuji + Natural)
```
Empty stylish office chair behind a trestle desk in the early morning
light in a modern glass architect's office, FujiColor C200, natural
window light, fine grain
```

---

## Prompting Principles

1. **Lighting + film stock is the power combo** -- these two define most of the look
2. **4-6 targeted modifiers** beat 15+ keywords
3. **Word order matters** -- prioritize subject, then setting, then technical specs
4. **Be specific about light direction** -- "key light at 45 degrees from camera-left" beats "dramatic lighting"
5. **Film stock overrides style settings** -- use for consistency
6. **Don't mix film stocks** -- each has distinct color science
7. **Natural time references work** -- "early morning light" or "late evening" convey more than technical descriptions
8. **Avoid generic descriptors** -- "cinematic" tells the model nothing. Specify *which* cinema look
