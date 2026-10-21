/**
 * useFaceROI — loads MediaPipe FaceMesh via CDN script tag (avoids Vite WASM bundling issues)
 * Falls back to center-crop ROI if face not detected
 */
import { useRef, useEffect, useState } from 'react';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.crossOrigin = 'anonymous';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

let faceMeshInstance = null;
let loadPromise = null;

async function getFaceMesh() {
  if (faceMeshInstance) return faceMeshInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');

      const fm = new window.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      fm.setOptions({
        maxNumFaces: 3,
        refineLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      // Warm up
      fm.onResults(() => {});
      await fm.initialize();
      faceMeshInstance = fm;
      return fm;
    } catch (e) {
      console.warn('FaceMesh CDN load failed, using fallback ROI', e);
      return null;
    }
  })();

  return loadPromise;
}

export function useFaceROI(videoRef, canvasRef, active) {
  const [faceDetected, setFaceDetected] = useState(false);
  const [multipleFaces, setMultipleFaces] = useState(false);
  const [angleValid, setAngleValid] = useState(true);
  const [faceCount, setFaceCount] = useState(0);

  const roiRef = useRef(null);
  const landmarksRef = useRef(null);
  const allFacesRef = useRef([]);
  const validationRef = useRef({ valid: false, status: 'no_face', error: 'No face detected' });
  const fmRef  = useRef(null);

  useEffect(() => {
    if (!active) {
      setFaceDetected(false);
      setMultipleFaces(false);
      setAngleValid(true);
      setFaceCount(0);
      landmarksRef.current = null;
      roiRef.current = null;
      allFacesRef.current = [];
      validationRef.current = { valid: false, status: 'inactive', error: null };
      return;
    }
    let cancelled = false;

    getFaceMesh().then(fm => {
      if (cancelled || !fm) return;
      fm.setOptions({
        maxNumFaces: 3,
        refineLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      fmRef.current = fm;

      fm.onResults((results) => {
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const W = canvas.width, H = canvas.height;

        const count = results.multiFaceLandmarks ? results.multiFaceLandmarks.length : 0;
        setFaceCount(count);

        if (count === 0) {
          landmarksRef.current = null;
          roiRef.current = null;
          allFacesRef.current = [];
          validationRef.current = { valid: false, status: 'no_face', error: 'No face detected. Please position your face in the camera.' };
          setFaceDetected(false);
          setMultipleFaces(false);
          setAngleValid(false);
          return;
        }

        if (count > 1) {
          // Multiple faces detected: reject measurement
          const faces = results.multiFaceLandmarks.map((fLm, i) => {
            const xs = fLm.map(p => p.x * W);
            const ys = fLm.map(p => p.y * H);
            return {
              idx: i + 1,
              x: Math.min(...xs),
              y: Math.min(...ys),
              w: Math.max(...xs) - Math.min(...xs),
              h: Math.max(...ys) - Math.min(...ys),
            };
          });
          allFacesRef.current = faces;
          landmarksRef.current = null;
          roiRef.current = null;
          validationRef.current = {
            valid: false,
            status: 'multiple_faces',
            error: `Multiple faces detected (${count} people)! Only 1 person allowed during measurement.`,
          };
          setFaceDetected(false);
          setMultipleFaces(true);
          setAngleValid(false);
          return;
        }

        // Exactly 1 face detected
        setMultipleFaces(false);
        const lm = results.multiFaceLandmarks[0];
        landmarksRef.current = lm;

        const xs = lm.map(p => p.x * W);
        const ys = lm.map(p => p.y * H);
        allFacesRef.current = [{
          idx: 1,
          x: Math.min(...xs),
          y: Math.min(...ys),
          w: Math.max(...xs) - Math.min(...xs),
          h: Math.max(...ys) - Math.min(...ys),
        }];

        // Angle / Pose Estimation:
        // Key landmarks: 33 (left eye outer), 263 (right eye outer), 1 (nose tip), 10 (forehead center), 152 (chin)
        const leftEye = lm[33];
        const rightEye = lm[263];
        const nose = lm[1];
        const forehead = lm[10];
        const chin = lm[152];

        // 1. Roll angle (head tilt)
        const dX = (rightEye.x - leftEye.x) * W;
        const dY = (rightEye.y - leftEye.y) * H;
        const rollDeg = Math.round(Math.atan2(dY, dX) * (180 / Math.PI));

        // 2. Yaw ratio (turned left / right)
        const distL = Math.abs(nose.x - leftEye.x);
        const distR = Math.abs(rightEye.x - nose.x);
        const yawRatio = distL / (distR || 0.001);

        // 3. Pitch ratio (tilted up / down)
        const distUp = Math.abs(nose.y - forehead.y);
        const distDown = Math.abs(chin.y - nose.y);
        const pitchRatio = distUp / (distDown || 0.001);

        let angleError = null;
        if (Math.abs(rollDeg) > 14) {
          angleError = `Head tilted (${rollDeg}°). Please keep your head level.`;
        } else if (yawRatio < 0.58 || yawRatio > 1.72) {
          angleError = 'Face turned sideways. Please look directly at the camera.';
        } else if (pitchRatio < 0.50 || pitchRatio > 1.70) {
          angleError = 'Head tilted up/down. Please look straight at the camera.';
        }

        if (angleError) {
          roiRef.current = null;
          validationRef.current = {
            valid: false,
            status: 'invalid_angle',
            error: angleError,
            roll: rollDeg,
            yawRatio,
            pitchRatio,
          };
          setAngleValid(false);
          setFaceDetected(false);
        } else {
          // Angle is valid! Extract Forehead ROI
          const fhIdx = [10, 338, 297, 332, 284, 251, 109, 67, 103, 54, 21, 162, 127];
          const fhXs = fhIdx.map(i => lm[i]?.x * W).filter(Boolean);
          const fhYs = fhIdx.map(i => lm[i]?.y * H).filter(Boolean);
          if (fhXs.length && fhYs.length) {
            const minX = Math.min(...fhXs), maxX = Math.max(...fhXs);
            const minY = Math.min(...fhYs);
            const faceH = Math.max(...ys) - Math.min(...ys);
            roiRef.current = {
              x: Math.max(0, Math.round(minX + (maxX - minX) * 0.15)),
              y: Math.max(0, Math.round(minY)),
              w: Math.round((maxX - minX) * 0.7),
              h: Math.round(faceH * 0.22),
            };
          }
          validationRef.current = {
            valid: true,
            status: 'ok',
            error: null,
            roll: rollDeg,
            yawRatio,
            pitchRatio,
          };
          setAngleValid(true);
          setFaceDetected(true);
        }
      });
    });

    return () => {
      cancelled = true;
      landmarksRef.current = null;
      allFacesRef.current = [];
      roiRef.current = null;
    };
  }, [active, canvasRef]);

  const sendFrame = async (videoEl) => {
    if (!fmRef.current || !videoEl) return;
    try { await fmRef.current.send({ image: videoEl }); } catch {}
  };

  return { roiRef, faceDetected, sendFrame, landmarksRef, allFacesRef, validationRef, multipleFaces, angleValid, faceCount };
}
