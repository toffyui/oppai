import React, { useEffect, useRef, useState } from "react";
import * as handpose from "@tensorflow-models/handpose";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

const HandTrackingApp = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [randomPoint, setRandomPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [status, setStatus] = useState<string>("");

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

        // 四角い当たり範囲（近い判定用）
        const hitboxSize = 100; // 当たり範囲のサイズ
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

        // 状態を更新
        if (isHit) {
          setStatus("当たり！");
        } else if (isNear) {
          setStatus("近い！");
        } else {
          setStatus("");
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
      {/* 状態メッセージ */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          color: "red",
          fontSize: "24px",
          zIndex: 4,
        }}
      >
        {status}
      </div>
    </div>
  );
};

export default HandTrackingApp;
