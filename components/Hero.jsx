import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const FACE_COLORS = {
  right: "#FF6F61", // Red
  left: "#FF8C00", // Orange
  top: "#FFD700", // Yellow
  bottom: "#FFFFFF", // White
  front: "#00CC66", // Green
  back: "#1E90FF", // Blue
};

class Cubie extends THREE.Mesh {
  constructor(x, y, z) {
    super(new THREE.BoxGeometry(1, 1, 1), []);

    this.faceColors = {
      right: x === 1 ? FACE_COLORS.right : "#000000",
      left: x === -1 ? FACE_COLORS.left : "#000000",
      top: y === 1 ? FACE_COLORS.top : "#000000",
      bottom: y === -1 ? FACE_COLORS.bottom : "#000000",
      front: z === 1 ? FACE_COLORS.front : "#000000",
      back: z === -1 ? FACE_COLORS.back : "#000000",
    };

    this.updateMaterials();
    this.position.set(x, y, z);
  }

  updateMaterials() {
    this.material = [
      new THREE.MeshBasicMaterial({ color: this.faceColors.right }),
      new THREE.MeshBasicMaterial({ color: this.faceColors.left }),
      new THREE.MeshBasicMaterial({ color: this.faceColors.top }),
      new THREE.MeshBasicMaterial({ color: this.faceColors.bottom }),
      new THREE.MeshBasicMaterial({ color: this.faceColors.front }),
      new THREE.MeshBasicMaterial({ color: this.faceColors.back }),
    ];

    this.material.forEach((mat) => (mat.needsUpdate = true)); // ✅ Ensures update
  }

  rotateColors(axis, direction) {
    const { right, left, top, bottom, front, back } = this.faceColors;
    let newColors = { ...this.faceColors };

    if (axis === "x") {
      newColors =
        direction > 0
          ? { right, left, top: back, bottom: front, front: top, back: bottom }
          : { right, left, top: front, bottom: back, front: bottom, back: top };
    } else if (axis === "y") {
      newColors =
        direction > 0
          ? { right: front, left: back, top, bottom, front: left, back: right }
          : { right: back, left: front, top, bottom, front: right, back: left };
    } else if (axis === "z") {
      newColors =
        direction > 0
          ? { right: bottom, left: top, top: right, bottom: left, front, back }
          : { right: top, left: bottom, top: left, bottom: right, front, back };
    }

    this.faceColors = newColors;
    this.updateMaterials();
  }
}

class Cube {
  constructor(scene) {
    this.scene = scene;
    this.cubies = [];
    this.isRotating = false;
    this.initCube();
  }

  initCube() {
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const cubie = new Cubie(x, y, z);
          this.cubies.push(cubie);
          this.scene.add(cubie);
        }
      }
    }
  }

  rotateFace(axis, index, direction, duration = 300) {
    if (this.isRotating) return;
    this.isRotating = true;

    let affectedCubies = this.cubies.filter(
      (cubie) => Math.round(cubie.position[axis]) === index
    );

    let rotationGroup = new THREE.Group();
    affectedCubies.forEach((cubie) => rotationGroup.add(cubie));
    this.scene.add(rotationGroup);

    let startTime = performance.now();
    let targetRotation = (direction * Math.PI) / 2;
    let initialRotation = rotationGroup.rotation[axis];

    const animateRotation = (time) => {
      let elapsed = time - startTime;
      let progress = Math.min(elapsed / duration, 1);
      rotationGroup.rotation[axis] =
        initialRotation + targetRotation * progress;

      if (progress < 1) {
        requestAnimationFrame(animateRotation);
      } else {
        affectedCubies.forEach((cubie) => {
          let { x, y, z } = cubie.position;
          let newPos = this.rotatePosition(x, y, z, axis, direction);
          cubie.position.set(newPos.x, newPos.y, newPos.z);
          cubie.rotation.set(0, 0, 0);

          cubie.rotateColors(axis, direction);
          this.scene.add(cubie);
        });

        this.scene.remove(rotationGroup);
        this.isRotating = false;
      }
    };

    requestAnimationFrame(animateRotation);
  }

  rotatePosition(x, y, z, axis, direction) {
    let rotated = { x, y, z };

    if (axis === "x") {
      rotated.y = direction > 0 ? -z : z;
      rotated.z = direction > 0 ? y : -y;
    } else if (axis === "y") {
      rotated.x = direction > 0 ? z : -z;
      rotated.z = direction > 0 ? -x : x;
    } else if (axis === "z") {
      rotated.x = direction > 0 ? -y : y;
      rotated.y = direction > 0 ? x : -x;
    }

    return rotated;
  }

  scramble(moves = 30, duration = 100) {
    const axes = ["x", "y", "z"];
    const directions = [1, -1];
    const indices = [-1, 1];

    for (let i = 0; i < moves; i++) {
      const axis = axes[Math.floor(Math.random() * axes.length)];
      const direction =
        directions[Math.floor(Math.random() * directions.length)];
      const index = indices[Math.floor(Math.random() * indices.length)];

      setTimeout(() => {
        this.rotateFace(axis, index, direction, duration);
      }, i * duration);
    }
  }
}

function Hero() {
  const containerRef = useRef(null);
  const rubiksCubeRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(4, 4, 8);

    const rubiksCube = new Cube(scene);
    rubiksCubeRef.current = rubiksCube;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleKeyDown = (event) => {
      if (!rubiksCubeRef.current) return;
      const key = event.key.toUpperCase();

      const rotations = {
        S: () => rubiksCubeRef.current.scramble(),
        R: () => rubiksCubeRef.current.rotateFace("x", 1, 1),
        L: () => rubiksCubeRef.current.rotateFace("x", -1, -1),
        U: () => rubiksCubeRef.current.rotateFace("y", 1, 1),
        D: () => rubiksCubeRef.current.rotateFace("y", -1, -1),
        F: () => rubiksCubeRef.current.rotateFace("z", 1, 1),
        B: () => rubiksCubeRef.current.rotateFace("z", -1, -1),
      };

      if (rotations[key]) {
        rotations[key]();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />;
}

export default Hero;
