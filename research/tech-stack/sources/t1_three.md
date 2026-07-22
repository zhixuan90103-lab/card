---
title: Research Notes
date: 2026-07-21 15:16
query: "Three.js orthographic camera 2D sprites Raycaster mobile web best practices"
type: tech
sources: 6
model: grok-4-1-fast
generated_by: grok-search
---
**Three.js Raycasting with Orthographic Cameras: Key Issues, Solutions, and Best Practices**

## Table of Contents
- [Source 1: Stack Overflow - Raycaster with Negative Near Plane](#source-1-stack-overflow-raycaster-with-negative-near-plane)
- [Source 2: three.js Discourse - Sprite vs Mesh for Orthographic Camera](#source-2-threejs-discourse-sprite-vs-mesh-for-orthographic-camera)
- [Source 3: GameDev Stack Exchange - Orthographic Camera and Raycasting](#source-3-gamedev-stack-exchange-orthographic-camera-and-raycasting)
- [Source 4: GitHub Issue - Raycasting of Sprites](#source-4-github-issue-raycasting-of-sprites)
- [Source 5: Dustin Pfister Blog - The Orthographic Camera in three.js](#source-5-dustin-pfister-blog-the-orthographic-camera-in-threejs)
- [Source 6: three.js Discourse - Raycaster with Orthographic Camera and z Position](#source-6-threejs-discourse-raycaster-with-orthographic-camera-and-z-position)
- [Summary](#summary)
- [Citations](#citations)

## Source 1: Stack Overflow - Raycaster with Negative Near Plane
**URL:** https://stackoverflow.com/questions/63083684/how-to-use-three-js-raycaster-with-orthographiccamera-with-negative-near-plane

**1. Main topic and thesis**  
Investigates compatibility of `THREE.Raycaster` with `OrthographicCamera` when using a negative `near` plane value (e.g., -1000) to render objects with z ≥ 0 without clipping. Thesis: Negative near breaks raycasting intersections for positive-z geometry.

**2. Key points and arguments**  
- Camera setup: `new THREE.OrthographicCamera(-1, 1, -1, 1, -1000, 1000)`.  
- Raycaster internals inspect: uses `(camera.near + camera.far) / (camera.near - camera.far)` for ray origin z.  
- Objects at z ≥ 0 render but are never intersected.  
- Alternative unproject + ray setup recommended from related answers.

**3. Important data, statistics, quotes**  
- "the documentation says must be set to a value >= 0."  
- Expression: `( camera.near + camera.far ) / ( camera.near - camera.far )`.  
- Linked PR and alternative code snippet using `vector.set(..., -1)` then `unproject` + `transformDirection`.

**4. Conclusions**  
Negative near plane enables desired rendering but disables standard raycaster behavior. Use manual ray setup (unproject + direction) or avoid negative near when raycasting is required.

## Source 2: three.js Discourse - Sprite vs Mesh for Orthographic Camera
**URL:** https://discourse.threejs.org/t/sprite-vs-mesh-for-orthographic-camera-and-without-lighting/87517

**1. Main topic and thesis**  
Compares `Sprite` vs `Mesh` (plane geometry + material) for 2D UI/icons in an orthographic scene without lighting. Thesis: Sprites offer convenience but meshes with instancing or manual layering are often preferable for performance and control.

**2. Key points and arguments**  
- Sprites auto-face camera and include built-in features.  
- Meshes allow instancing (though textures differ) and explicit z-ordering via position.z or multiple render passes.  
- Instancing + texture atlas discussed for performance.  
- Layering issues resolved by z-position changes or `renderer.autoClear` + `clearDepth`.

**3. Important data, statistics, quotes**  
- "Sprites aren’t inherently more performant than a quad rendered with a 'face the camera' shader."  
- Code examples for `setMatrixAt`, `position.z`, and multi-pass rendering.  
- Performance focus on reducing draw calls.

**4. Conclusions**  
Meshes are often chosen for instancing flexibility and z-control despite sprites' simplicity. Manual z-positioning or render-order tricks handle layering; texture atlases help when many unique images are needed.

## Source 3: GameDev Stack Exchange - Orthographic Camera and Raycasting
**URL:** https://gamedev.stackexchange.com/questions/80412/orthographic-camera-and-raycasting-in-three-js

**1. Main topic and thesis**  
Debugging failed raycasting on an orthographic camera in a 2D-style tower game. Thesis: Incorrect vector setup and `Projector.pickingRay` misuse prevent intersections.

**2. Key points and arguments**  
- Camera: `OrthographicCamera` with near=0, far=1000, position at (0,0,0).  
- Common mistakes: setting vector z to camera z before unproject, wrong ray direction.  
- Correct approach: create normalized device coordinate point, unproject, then form ray from camera to that point.

**3. Important data, statistics, quotes**  
- "The whole point of `vector` is to convert the mouse location into a 3d point in front of the camera."  
- Suggested code: `var vector = new THREE.Vector3(event.clientX, event.clientY, 1); projector.unprojectVector(vector, camera);` followed by ray creation.  
- Ray direction should be `(0,0,-1)` after proper pickingRay.

**4. Conclusions**  
Use `unproject` on a point with z=1 (or -1 depending on convention) rather than camera z. Avoid mixing old `Projector` and new `Raycaster` patterns; ensure ray origin and direction are correctly computed in world space.

## Source 4: GitHub Issue - Raycasting of Sprites
**URL:** https://github.com/mrdoob/three.js/issues/13751

**1. Main topic and thesis**  
Reports that sprite raycasting ignores `center` and `scale` properties.

**2. Key points and arguments**  
- `Sprite` ray intersections do not respect custom center offset or non-uniform scaling.  
- Affects accurate picking of scaled or offset sprites.

**3. Important data, statistics, quotes**  
- Title: "Raycasting of Sprites Does Not Account for Center and Scale".

**4. Conclusions**  
Known limitation in three.js sprite raycasting implementation at the time of the issue. Workarounds may involve custom ray logic or using meshes instead of sprites for precise picking.

## Source 5: Dustin Pfister Blog - The Orthographic Camera in three.js
**URL:** https://dustinpfister.github.io/2018/05/17/threejs-camera-orthographic/

**1. Main topic and thesis**  
Tutorial explaining `OrthographicCamera` construction, usage, and differences from perspective cameras. Thesis: Orthographic projection keeps object sizes constant regardless of distance, useful for 2D/UI or isometric views.

**2. Key points and arguments**  
- Constructor: `left, right, top, bottom, near, far` (box frustum).  
- Basic examples with grid, meshes, camera movement via position/lookAt.  
- Comparison to perspective camera; objects maintain size at any distance.  
- Code samples for scene setup, animation loops, and cube-stack models.

**3. Important data, statistics, quotes**  
- Example: `new THREE.OrthographicCamera(left, right, top, bottom, near, far)`.  
- "an object size will remain the same regardless of the distance".  
- Multiple live code snippets demonstrating camera movement and rendering.

**4. Conclusions**  
Orthographic camera is straightforward to set up and ideal when perspective distortion is undesirable. Combine with standard Object3D methods for positioning and animation.

## Source 6: three.js Discourse - Raycaster with Orthographic Camera and z Position
**URL:** https://discourse.threejs.org/t/raycaster-with-orthographic-camera-and-z-position/43881

**1. Main topic and thesis**  
Raycasting fails on meshes whose z-position changes when using `setFromCamera` with an orthographic camera that has a negative near plane.

**2. Key points and arguments**  
- Camera: negative near (-1000), positive far.  
- `raycaster.setFromCamera(mouse, camera)` works until `mesh.position.z` is modified.  
- z-position used for layering in 2D UI.  
- Workaround: custom ray setup from Stack Overflow answer.

**3. Important data, statistics, quotes**  
- Camera creation includes `near = -1000`.  
- "why the raycaster doesn’t detect mesh with the changed z-position."  
- Reference to manual unproject + direction technique.

**4. Conclusions**  
`setFromCamera` does not fully handle negative near or post-position z-changes in some orthographic setups. Manual ray construction (unproject mouse to world point, set ray origin/direction) provides reliable intersections.

## Summary
Common themes across sources include challenges with negative `near` planes in `OrthographicCamera`, the need for manual ray setup instead of relying solely on `setFromCamera` or legacy `Projector`, sprite vs mesh trade-offs for 2D content, and z-position layering for rendering order. Best practices: prefer positive near when possible, use unproject-based ray creation for reliability, and manage draw calls/layering explicitly with meshes or render passes. These techniques enable robust picking and rendering in orthographic 2D/UI-style three.js applications.

## Citations
- All URLs listed in section headers and the Table of Contents.