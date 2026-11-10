# Sidekick orbs

Every orb, including the branded marks, uses one presence model. A style may add its own surface reaction, but it does not invent a separate size, hover, or audio rule.

## Sizes

The slot is a fixed box. Scale and glow happen inside it, with `transform`, so the layout does not move. Glow stays within 12% of the diameter (`ORB_GLOW_MARGIN`).

| Context | Diameter |
| --- | --- |
| Nav list | 31px |
| Composer | 32px |
| Editor picker | 36px |
| Add-a-sidekick card and voice mode | 48px |
| Boot | 56px |
| Mention, command palette, menu | 18 / 20 / 24px |

Voice styles are drawn at 144px and scaled into the slot, so the detail holds at 31px.

## States

Values are the shared baseline. Audio adds on top of listening and speaking: a fast attack (rate 22) and a release that settles in about half a second (rate 6.5). Quiet input is boosted. Loud input is compressed. If the browser's speech engine has no samples, listening and speaking use an irregular syllable envelope on the orb itself.

| State | Intensity | Speed | Glow | Scale | Enters |
| --- | --- | --- | --- | --- | --- |
| Rest | 0.16 | 0.35 | 0.10 | 1.00 | 5 /s |
| Hover | 0.16 | 0.35 | 0.10 | 1.00 | 5 /s |
| Selected | 0.16 | 0.35 | 0.10 | 1.00 | 5 /s |
| Listening | 0.70 | 1.00 | 0.18 | 1.00 | 14 /s |
| Thinking | 0.40 | 0.60 | 0.12 | 1.00 | 8 /s |
| Speaking | 0.78 | 1.10 | 0.20 | 1.00 | 14 /s |
| Reduced motion | 0.04 | 0 | 0.06 | 1.00 | 8 /s |

States blend. They do not snap. Hover and selected keep the same motion as rest: the circle does not grow, speed up, or tilt. Listening, thinking, and speaking are the reaction, and the silhouette stays inside the circle. Only the selected agent receives the microphone or the reply audio. The microphone opens when dictation or voice mode starts.

Visible orbs keep their idle motion, all at the same pace. Offscreen orbs and hidden tabs pause. Reduced motion holds a frame.

## How each style reacts

- **Plasma** is the Product ideas orb. The colors stay separated, a glass highlight sits on the sphere, and the flow is a step faster than before. Talking still speeds it further.
- **Mercury** is the Trends orb. The ripples and contour deepen with the level, and the idle flow is a step faster.
- **Twisted sphere** keeps the original twist. Chief of staff uses this style. Talking speeds it.
- **Aura Field** is the tool ring. It is the VoiceOrbs aura: overlapping bands that drift at rest and spring open while listening or talking.
- **Marble** is the Campaigns orb. A glass sphere with colored veins and a moving highlight. It stays inside the same circle as the others.
- **Glass** is a sphere of floating color balls. The balls are refracted through the glass and stippled. Listening and talking speed them and push them apart.
- **Grok Bot, Slackbot, and Muse** keep their artwork. The mark squashes and stretches with the level. Grok and Slackbot answer with their eyes. Neither grows a mouth.
