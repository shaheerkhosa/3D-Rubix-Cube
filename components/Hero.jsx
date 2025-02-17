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
      new THREE.MeshBasicMaterial({ color: this.faceColors.right }), // +X
      new THREE.MeshBasicMaterial({ color: this.faceColors.left }), // -X
      new THREE.MeshBasicMaterial({ color: this.faceColors.top }), // +Y
      new THREE.MeshBasicMaterial({ color: this.faceColors.bottom }), // -Y
      new THREE.MeshBasicMaterial({ color: this.faceColors.front }), // +Z
      new THREE.MeshBasicMaterial({ color: this.faceColors.back }), // -Z
    ];
  }

  rotateColors(axis, direction) {
    const { right, left, top, bottom, front, back } = this.faceColors;
    let newColors = { ...this.faceColors };

    if (axis === "x") {
      if (direction > 0) {
        newColors = {
          right,
          left,
          top: back,
          bottom: front,
          front: top,
          back: bottom,
        };
      } else {
        newColors = {
          right,
          left,
          top: front,
          bottom: back,
          front: bottom,
          back: top,
        };
      }
    } else if (axis === "y") {
      if (direction > 0) {
        newColors = {
          right: front,
          left: back,
          top,
          bottom,
          front: left,
          back: right,
        };
      } else {
        newColors = {
          right: back,
          left: front,
          top,
          bottom,
          front: right,
          back: left,
        };
      }
    } else if (axis === "z") {
      if (direction > 0) {
        newColors = {
          right: bottom,
          left: top,
          top: right,
          bottom: left,
          front,
          back,
        };
      } else {
        newColors = {
          right: top,
          left: bottom,
          top: left,
          bottom: right,
          front,
          back,
        };
      }
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

          // ✅ Rotate the cubie's face colors
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

    // 🔥 Add an Axis Helper (Shows X, Y, Z)
    const axesHelper = new THREE.AxesHelper(3);
    scene.add(axesHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(ambientLight, directionalLight);

    const rubiksCube = new Cube(scene);
    rubiksCubeRef.current = rubiksCube;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    window.addEventListener("keydown", (event) => {
      if (!rubiksCubeRef.current) return;
      const keyMap = {
        U: ["y", 1, 1],
        I: ["y", 1, -1],
        D: ["y", -1, 1],
        K: ["y", -1, -1],
        F: ["z", 1, 1],
        J: ["z", 1, -1],
        B: ["z", -1, 1],
        N: ["z", -1, -1],
        L: ["x", -1, 1],
        H: ["x", -1, -1],
        R: ["x", 1, 1],
        O: ["x", 1, -1],
      };
      if (keyMap[event.key.toUpperCase()]) {
        rubiksCubeRef.current.rotateFace(...keyMap[event.key.toUpperCase()]);
      }
    });
  }, []);

  return <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />;
}

export default Hero;
