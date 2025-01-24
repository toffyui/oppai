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
    setRandomPoint({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
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
        const [x, y] = landmarks[9]; // 中指の根元（ランドマーク9）

        const scaledX =
          window.innerWidth - (x / videoWidth) * window.innerWidth;
        const scaledY = (y / videoHeight) * window.innerHeight;

        // ランダムポイントとの距離計算
        const distance = Math.sqrt(
          Math.pow(scaledX - randomPoint.x, 2) +
            Math.pow(scaledY - randomPoint.y, 2)
        );

        if (distance < 100) {
          setStatus("当たり！");
        } else if (distance < 300) {
          setStatus("近い！");
        } else {
          setStatus("");
        }
      }

      requestAnimationFrame(detect);
    };

    detect();
  };

  useEffect(() => {
    console.log(status);
  }, [status]);

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
