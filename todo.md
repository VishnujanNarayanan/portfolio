The Vision

Transform the flat card system into a 3D gallery where images appear as physical objects floating in space with realistic lighting, shadows, and depth - all while maintaining the horizontal scroll journey.
📋 Requirement Breakdown
What Changes
Current	New
6 decorative cards per panel (.flow-card)	1-2 hero images as 3D objects per panel
Cards fly in/out with CSS transforms	Images float in 3D space with Three.js
Flat shadows via CSS	Real-time shadows cast by lights
Static appearance	Dynamic with mouse tilt & scroll depth
No lighting interaction	Responds to light bulb & environment
What Stays

    Horizontal track with 4 panels

    Text content (titles, subtitles) as HTML overlay

    Scroll-driven progress system

    Journey spine at bottom

    Mobile fallback (images become plain HTML)

🏗️ Architecture Layers
text

┌─────────────────────────────────────────────┐
│  Z-INDEX: 10  (TOP)                         │
│  ┌─────────────────────────────────────┐    │
│  │  HTML Text Overlay                  │    │ ← Stays crisp, no 3D
│  │  • Title with char reel             │    │
│  │  • Index, subtitle, pills           │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  Z-INDEX: 5                                  │
│  ┌─────────────────────────────────────┐    │
│  │  THREE.JS SCENE                     │    │ ← New: Image objects
│  │  ┌─────────────────────────────┐   │    │
│  │  │  Image Objects (4 panels)   │   │    │
│  │  │  • Floating in 3D space     │   │    │
│  │  │  • Cast/receive shadows     │   │    │
│  │  │  • Tilt with mouse          │   │    │
│  │  └─────────────────────────────┘   │    │
│  │  ┌─────────────────────────────┐   │    │
│  │  │  Lights                     │   │    │
│  │  │  • Ambient fill             │   │    │
│  │  │  • Directional (key light)  │   │    │
│  │  │  • Point (bulb)             │   │    │
│  │  └─────────────────────────────┘   │    │
│  │  ┌─────────────────────────────┐   │    │
│  │  │  Particle Field (existing)  │   │    │
│  │  └─────────────────────────────┘   │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  Z-INDEX: 1  (BOTTOM)                        │
│  ┌─────────────────────────────────────┐    │
│  │  Sky Gradient + Horizon (existing)  │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  💡 Light Bulb (fixed position, Z-index: 100)│
└─────────────────────────────────────────────┘

📦 Implementation Phases
Phase 1: Replace Cards with Image Objects (Week 1)

Goal: Remove .flow-card system, replace with Three.js image planes

Tasks:

    Remove 6 .flow-card elements from HTML

    Create createImageObject() function in Three.js

    Load 1 image per panel (4 images total)

    Position images along track using global progress

    Apply basic float animation (bobbing)

Files to modify:

    index.html - remove card divs

    flow.js - add image creation to renderGL()

    styles.css - remove card styles

Success criteria: Images appear along track, float gently
Phase 2: Add Realistic Shadows (Week 2)

Goal: Make images feel grounded with shadow planes

Tasks:

    Add ShadowMaterial plane beneath each image

    Enable shadow maps on renderer

    Configure directional light to cast shadows

    Shadow opacity fades with distance from center

    Shadow scales slightly with scroll position

Success criteria: Images cast soft shadows, shadow moves with image
Phase 3: Lighting System (Week 2-3)

Goal: Full lighting setup with dynamic bulb

Tasks:

    Ambient light (0.4 intensity)

    Key directional light (sun-like, shadows)

    Point light at bulb position

    Connect HTML bulb to Three.js point light

    Light intensity varies with scroll progress

    Warm glow on images near bulb

Success criteria: Images respond to lighting, bulb illuminates scene
Phase 4: Mouse-Driven Depth (Week 3)

Goal: Images tilt and respond to mouse movement

Tasks:

    Track mouse X/Y position

    Apply subtle rotation to image planes (-3° to +3°)

    Smooth interpolation (lerp) for tilt

    Shadow follows tilt

    Parallax offset between image and shadow

Success criteria: Images feel physical, respond to mouse like real objects
Phase 5: Scroll-Driven Depth Effects (Week 3)

Goal: Depth changes based on scroll position

Tasks:

    Move images in Z-space based on progress

    Scale images slightly when centered (active panel)

    Add depth-of-field blur (post-processing)

    Image rotates on Y-axis as it slides across

    Floating amplitude varies with scroll speed

Success criteria: Images feel 3D, depth changes during scroll
Phase 6: Text Integration (Week 4)

Goal: Text sits perfectly on top of 3D objects

Tasks:

    Keep HTML text at z-index: 10

    Add subtle text shadow for readability

    Text reacts to lighting (color shift from bulb)

    Smooth transitions between active/passed states

    Text "pops" slightly on active panel

Success criteria: Text looks like it's hovering over 3D objects
Phase 7: Polish & Performance (Week 4)

Goal: Smooth, optimized experience

Tasks:

    LOD (Level of Detail) for performance

    Texture compression (max 2048px)

    Reduce motion guard (disables Three.js)

    Mobile fallback (images become HTML)

    Resize handler for canvas

    Smooth 60fps animation loop

    Loading states (blur-up technique)

Success criteria: Works on all devices, 60fps on desktop
🎨 Visual Enhancements (Optional)
Glass/Frame Effect

    Add clearcoat to images (glass-like shine)

    Subtle reflection from environment map

    Rounded corners on image planes

Particle Interaction

    Particles react to image positions

    Light particles around active image

    Sparks from bulb when scroll fast

Depth of Field

    Blur background images when a panel is active

    Focus on active panel's image

    Smooth transition between focal points

🔧 Technical Requirements
Libraries to Add
json

{
  "three": "^0.160.0",
  "three/addons/": "./node_modules/three/examples/jsm/"
}

New Files

    flow-3d.js - Three.js image object management

    flow-lighting.js - Lighting setup

    flow-texture-loader.js - Image loading with progress

Existing Files to Modify

    flow.js - Integrate new 3D system

    index.html - Remove cards, add image sources

    styles.css - Adjust z-index layers

📊 Success Metrics
Metric	Target
FPS	60 (desktop), 30 (mobile)
Texture load time	< 2s per image
Scroll smoothness	No jank
Shadow quality	Soft, no artifacts
Mouse response	< 50ms latency
Memory usage	< 200MB
⚠️ Risk Management
Risk	Mitigation
Performance on mobile	Disable Three.js on mobile, show HTML images
Texture loading delay	Blur-up placeholder, progressive loading
Lighting complexity	Start simple, add layers gradually
Scroll/lag sync	Use requestAnimationFrame, not scroll events
Browser compatibility	Fallback to CSS transform version
🚀 Quick Wins (Day 1)

    Replace one panel with a 3D image

    Get it floating with basic animation

    Add one shadow to see the depth effect

    Test mouse tilt for immediate "wow" factor

🎯 Final Deliverable

A 3D image gallery where:

    Images float like physical objects

    Cast realistic shadows

    React to mouse movement

    Respond to the hanging bulb light

    Scroll horizontally with track

    Text sits crisply on top

    Works smoothly on all devices
