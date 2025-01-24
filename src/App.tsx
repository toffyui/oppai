import React, { useEffect, useRef, useState } from "react";
import * as handpose from "@tensorflow-models/handpose";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

enum Status {
  FAR = "FAR",
  NEAR = "NEAR",
  HIT = "HIT",
}
const HandTrackingApp = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const oppaiAudioRef = useRef<HTMLAudioElement>(null);
  const [randomPoint, setRandomPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [status, setStatus] = useState<Status>(Status.FAR);

  useEffect(() => {
    const setupCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current!.width = videoRef.current!.videoWidth;
          videoRef.current!.height = videoRef.current!.videoHeight;
        };

        await new Promise((resolve) => {
          videoRef.current!.onloadeddata = resolve;
        });
      }
    };

    setupCamera();

    // ランダムポイントを更新
    const margin = 100; // 端からのマージン（px）
    setRandomPoint({
      x: margin + Math.random() * (window.innerWidth - 2 * margin),
      y: margin + Math.random() * (window.innerHeight - 2 * margin),
    });
  }, []);

  useEffect(() => {
    const loadHandposeModel = async () => {
      await tf.setBackend("webgl");
      await tf.ready();

      const model = await handpose.load();
      detectHands(model);
    };

    loadHandposeModel();
  }, [randomPoint]);

  const detectHands = async (model: handpose.HandPose) => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    const detect = async () => {
      const predictions = await model.estimateHands(video);
      if (predictions.length > 0 && randomPoint) {
        const landmarks = predictions[0].landmarks;

        // 手のひら中心の計算
        const palmLandmarksIndices = [0, 1, 5, 9, 13, 17];
        const palmLandmarks = palmLandmarksIndices.map(
          (index) => landmarks[index]
        );
        const palmCenter = palmLandmarks.reduce(
          (acc, [x, y]) => {
            acc.x += x;
            acc.y += y;
            return acc;
          },
          { x: 0, y: 0 }
        );
        palmCenter.x /= palmLandmarks.length;
        palmCenter.y /= palmLandmarks.length;

        // スケーリングと鏡像補正
        const scaledX =
          window.innerWidth - (palmCenter.x / videoWidth) * window.innerWidth;
        const scaledY = (palmCenter.y / videoHeight) * window.innerHeight;

        // 手のランドマークをスケーリング
        const scaledLandmarks = landmarks.map(([x, y]) => ({
          x: window.innerWidth - (x / videoWidth) * window.innerWidth,
          y: (y / videoHeight) * window.innerHeight,
        }));

        // おっぱいの位置
        const hitboxSize = 100;
        const hitbox = {
          xMin: randomPoint.x - hitboxSize / 2,
          xMax: randomPoint.x + hitboxSize / 2,
          yMin: randomPoint.y - hitboxSize / 2,
          yMax: randomPoint.y + hitboxSize / 2,
        };

        // 手が範囲内に触れているか判定
        const isNear = scaledLandmarks.some(({ x, y }) => {
          return (
            x >= hitbox.xMin &&
            x <= hitbox.xMax &&
            y >= hitbox.yMin &&
            y <= hitbox.yMax
          );
        });

        // 当たり判定（手の中心が当たり範囲の中心）
        const isHit =
          Math.abs(scaledX - randomPoint.x) < 50 &&
          Math.abs(scaledY - randomPoint.y) < 50;

        if (isHit) {
          setStatus(Status.HIT);
          if (oppaiAudioRef.current) {
            oppaiAudioRef.current.play();
          }
        } else if (isNear) {
          if (audioRef.current) {
            audioRef.current.play();
          }
          setStatus(Status.NEAR);
        } else {
          setStatus(Status.FAR);
        }
      }
      requestAnimationFrame(detect);
    };

    detect();
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* カメラ画像を背景として表示 */}
      <video
        ref={videoRef}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)",
          zIndex: 1,
        }}
        autoPlay
        playsInline
        muted
      />
      {/* ランダムポイントの四角い枠 */}
      {randomPoint && (
        <div
          style={{
            position: "absolute",
            top: randomPoint.y - 25,
            left: randomPoint.x - 25,
            width: 50,
            height: 50,
            border: "2px solid red",
            zIndex: 2,
          }}
        ></div>
      )}
      <audio ref={audioRef} src="/oppai.mp3" preload="auto" />
      <audio ref={oppaiAudioRef} src="/oppaioppai.mp3" preload="auto" />
      {status === Status.NEAR && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(206, 60, 66, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "4rem",
            color: "white",
            fontWeight: "bold",
            zIndex: 5,
            animation: "flash 1s infinite",
          }}
        ></div>
      )}
      <style>{`
        @keyframes flash {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default HandTrackingApp;
