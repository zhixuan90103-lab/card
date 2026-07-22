---
title: Research Notes
date: 2026-07-21 15:20
query: "Three.js Raycaster intersectObjects sort by distance multiple overlapping meshes 2D pick top"
type: tech
sources: 6
model: grok-4-1-fast
generated_by: grok-search
---
# Three.js Raycaster: intersectObject, Issues, and Related Techniques

## Table of Contents
- [Official Documentation: Raycaster.intersectObject](#official-documentation-raycasterintersectobject)
- [GitHub Issue #16031: Raycaster.intersectObjects Returns Wrong Order](#github-issue-16031-raycasterintersectobjects-returns-wrong-order)
- [GitHub Issue #12382: Feature Request - Consider Visibility When Picking Objects](#github-issue-12382-feature-request-consider-visibility-when-picking-objects)
- [Stack Overflow: Raycaster Intersecting Original Mesh Position After position.set()](#stack-overflow-raycaster-intersecting-original-mesh-position-after-positionset)
- [Blog Post: Clicking a Mesh in three.js with the Raycaster Class](#blog-post-clicking-a-mesh-in-threejs-with-the-raycaster-class)
- [Discourse Thread: Detecting Overlap Between Objects](#discourse-thread-detecting-overlap-between-objects)
- [Summary](#summary)

## Official Documentation: Raycaster.intersectObject
**Source:** https://threejs.org/docs/#api/en/core/Raycaster.intersectObject

### 1. Main Topic and Thesis
Official API reference for the `Raycaster.intersectObject` method in Three.js, which computes intersections between a ray and a 3D object.

### 2. Key Points and Arguments
- Part of the core `Raycaster` class.
- Computes and returns an array of intersections sorted by distance (closest first).
- Supports recursive checking of child objects.
- Related methods include `intersectObjects` for multiple objects.
- Parameters typically include the object, optional recursive flag, and optional target array for results.

### 3. Important Data, Statistics, Quotes
- N/A (reference documentation; no specific stats or quotes extracted due to page structure).

### 4. Conclusions
Provides the foundational API for ray-based picking and intersection testing in Three.js scenes.

## GitHub Issue #16031: Raycaster.intersectObjects Returns Wrong Order
**Source:** https://github.com/mrdoob/three.js/issues/16031

### 1. Main Topic and Thesis
Bug report that `Raycaster.intersectObjects` does not always return intersections in the expected (distance-sorted) order.

### 2. Key Points and Arguments
- Issue affects multi-object intersection queries.
- Potential causes include object hierarchy, transformations, or internal sorting logic.

### 3. Important Data, Statistics, Quotes
- N/A (limited page content fetched; title and description indicate ordering inconsistency).

### 4. Conclusions
Highlights a known limitation or bug in intersection ordering for complex scenes, requiring workarounds or future fixes.

## GitHub Issue #12382: Feature Request - Consider Visibility When Picking Objects
**Source:** https://github.com/mrdoob/three.js/issues/12382

### 1. Main Topic and Thesis
Enhancement request to make raycasting respect object visibility flags (`visible` property) during intersection tests.

### 2. Key Points and Arguments
- Current behavior intersects invisible objects.
- Proposal to skip or filter based on `Object3D.visible`.
- Relevant for UI picking and performance.

### 3. Important Data, Statistics, Quotes
- Labeled as "Enhancement".

### 4. Conclusions
Suggests improving raycaster to automatically respect visibility for more intuitive picking behavior.

## Stack Overflow: Raycaster Intersecting Original Mesh Position After position.set()
**Source:** https://stackoverflow.com/questions/14186209/three-raycaster-intersecting-original-mesh-position-after-position-set

### 1. Main Topic and Thesis
Problem where `Raycaster` continues to use an object's original world position even after calling `position.set()`.

### 2. Key Points and Arguments
- Issue occurs when objects are positioned before being added to the scene or before matrix updates.
- Raycaster relies on world transform matrices.
- Code example shows ray setup from a moving character toward targets.

### 3. Important Data, Statistics, Quotes
- "It seems that three.js uses the objects world transform matrix for ray intersection and depending on your order of operations, this may not have been updated after `position.set();`"
- Solution: Call `object.updateMatrixWorld()` before raycasting.

### 4. Conclusions
Always update world matrices (`updateMatrixWorld()`) after position/rotation changes for accurate ray intersections, especially outside the render loop.

## Blog Post: Clicking a Mesh in three.js with the Raycaster Class
**Source:** https://dustinpfister.github.io/2021/05/18/threejs-raycaster/

### 1. Main Topic and Thesis
Practical tutorial on using `THREE.Raycaster` for mouse-based mesh picking and surface positioning in Three.js.

### 2. Key Points and Arguments
- Basic usage: `setFromCamera(mouse, camera)` + `intersectObjects`.
- Examples include sphere/torus surface positioning and mouse-over scaling.
- Covers pointer events, normalized device coordinates, and recursive vs. non-recursive intersection.
- Advanced: Ray from arbitrary origin/direction for surface placement.

### 3. Important Data, Statistics, Quotes
- Code snippets demonstrate `raycaster.intersectObject(sphere, false)` returning hit points.
- Mouse handling: `mouse.x = (x / width) * 2 - 1; mouse.y = -(y / height) * 2 + 1;`

### 4. Conclusions
Raycaster enables interactive picking and precise surface placement; combine with event listeners and `setFromCamera` for common UI interactions. Version-specific notes (r127–r146) emphasize checking for API changes.

## Discourse Thread: Detecting Overlap Between Objects
**Source:** https://discourse.threejs.org/t/resolved-how-to-detect-if-two-objects-overlap/3789

### 1. Main Topic and Thesis
Discussion on detecting object overlaps/collisions without a full physics engine, using bounding boxes or raycasting.

### 2. Key Points and Arguments
- Raycasting used in voxel painter example to prevent placement overlaps.
- Alternative: Bounding box intersection after `updateMatrixWorld()` and matrix application.
- Performance note: Precompute bounding boxes when possible.

### 3. Important Data, Statistics, Quotes
- Code:  
  ```js
  box1.updateMatrixWorld();
  var bounding1 = box1.geometry.boundingBox.clone();
  bounding1.applyMatrix4(box1.matrixWorld);
  if (bounding1.intersectsBox(bounding2)) { /* collision */ }
  ```
- "The code in `onDocumentMouseMove()` ensures via simple raycasting and math that boxes can only be placed at points where no overlapping is produced."

### 4. Conclusions
Bounding box checks (with matrix transforms) or grid/ray-based placement validation provide lightweight overlap detection. Physics engines are an option for more complex cases.

## Summary
These sources collectively cover the core `Raycaster.intersectObject` API, common pitfalls (position/matrix updates, ordering, visibility), practical implementations for clicking/picking, and alternatives for overlap detection. Key takeaways include always calling `updateMatrixWorld()` after transforms, using `setFromCamera` for mouse interactions, and leveraging bounding boxes for collision checks. All techniques rely on accurate world transforms and proper ordering of operations in the Three.js scene graph. 

**All URLs Cited:**  
- https://threejs.org/docs/#api/en/core/Raycaster.intersectObject  
- https://github.com/mrdoob/three.js/issues/16031  
- https://github.com/mrdoob/three.js/issues/12382  
- https://stackoverflow.com/questions/14186209/three-raycaster-intersecting-original-mesh-position-after-position-set  
- https://dustinpfister.github.io/2021/05/18/threejs-raycaster/  
- https://discourse.threejs.org/t/resolved-how-to-detect-if-two-objects-overlap/3789