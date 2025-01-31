import React, { useEffect, useRef, useState } from "react";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-converter";
import "@mediapipe/hands";
import { Loading } from "./Loading";

enum Status {
  FAR = "FAR",
  NEAR = "NEAR",
  HIT = "HIT",
}

type Props = {
  setTimer: React.Dispatch<React.SetStateAction<number>>;
  onOppaiFound: () => void;
};

export const Oppai: React.FC<Props> = ({ setTimer, onOppaiFound }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [randomPoint, setRandomPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [status, setStatus] = useState<Status>(Status.FAR);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const [timerIntervalId, setTimerIntervalId] = useState<NodeJS.Timer>();

  useEffect(() => {
    const setupCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current!.width = videoRef.current!.videoWidth;
          videoRef.current!.height = videoRef.current!.videoHeight;
          setIsVideoReady(true);
          if (timerIntervalId) clearInterval(timerIntervalId);
          const intervalId = setInterval(() => {
            setTimer((prev) => prev + 1);
          }, 1000);
          setTimerIntervalId(intervalId);
        };

        await new Promise((resolve) => {
          videoRef.current!.onloadeddata = resolve;
        });
      }
    };

    setupCamera();

    const margin = 100; // 端からのマージン（px）
    setRandomPoint({
      x: margin + Math.random() * (window.innerWidth - 2 * margin),
      y: margin + Math.random() * (window.innerHeight - 2 * margin),
    });
  }, []);

  useEffect(() => {
    if (!randomPoint || !isVideoReady) return;
    const detectHands = async (model: handPoseDetection.HandDetector) => {
      if (!videoRef.current) return;

      const video = videoRef.current;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      const detect = async () => {
        const hands = await model.estimateHands(video);
        if (hands.length > 0 && randomPoint) {
          let isNear = false;
          let isHit = false;

          hands.forEach((hand) => {
            const landmarks = hand.keypoints; // 両手の `keypoints` を処理

            // 手のひら中心の計算
            const palmLandmarksIndices = [0, 1, 5, 9, 13, 17];
            const palmLandmarks = palmLandmarksIndices.map(
              (index) => landmarks[index]
            );
            const palmCenter = palmLandmarks.reduce(
              (acc, { x, y }) => {
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
              window.innerWidth -
              (palmCenter.x / videoWidth) * window.innerWidth;
            const scaledY = (palmCenter.y / videoHeight) * window.innerHeight;

            // 手のランドマークをスケーリング
            const scaledLandmarks = landmarks.map(({ x, y }) => ({
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

            // どちらかの手が範囲内に触れているか判定
            if (
              scaledLandmarks.some(
                ({ x, y }) =>
                  x >= hitbox.xMin &&
                  x <= hitbox.xMax &&
                  y >= hitbox.yMin &&
                  y <= hitbox.yMax
              )
            ) {
              isNear = true;
            }

            // どちらかの手の中心が当たり判定の中心にあるか
            if (
              Math.abs(scaledX - randomPoint.x) < 50 &&
              Math.abs(scaledY - randomPoint.y) < 50
            ) {
              isHit = true;
            }
          });

          if (isHit) {
            setStatus(Status.HIT);
            clearInterval(timerIntervalId);
            onOppaiFound();
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

    const loadHandposeModel = async () => {
      await tf.setBackend("webgl");
      await tf.ready();

      const model = await handPoseDetection.createDetector(
        handPoseDetection.SupportedModels.MediaPipeHands,
        { runtime: "tfjs", modelType: "full" }
      );
      detectHands(model);
    };
    loadHandposeModel();
  }, [randomPoint, isVideoReady]);

  return (
    <div className="Oppai-container">
      {!isVideoReady && <Loading />}
      {/* カメラ画像を背景として表示 */}
      <video ref={videoRef} autoPlay playsInline muted />
      <audio ref={audioRef} src="/oppai.mp3" preload="auto" />
      {status === Status.NEAR && <div className="near"></div>}
    </div>
  );
};
