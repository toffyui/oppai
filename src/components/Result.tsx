import { useEffect, useRef } from "react";
import { Title } from "./Title";

type Props = {
  timer: number;
  onRetry: () => void;
};

export const Result: React.FC<Props> = ({ timer, onRetry }) => {
  const oppaiAudioRef = useRef<HTMLAudioElement>(null);
  const resultText = () => {
    if (timer < 3) {
      return "I LOVE OPPAI";
    } else if (timer < 5) {
      return "かなりのOPPAI好きですね";
    } else if (timer < 10) {
      return "OPPAIに対する執念を感じました";
    } else if (timer < 15) {
      return "どこでもOPPAIを探す姿勢が素晴らしい";
    } else if (timer < 20) {
      return "やはりOPPAIは最高ですね";
    } else if (timer < 25) {
      return "OPPAI、それはロマン";
    } else if (timer < 30) {
      return "OPPAIを愛する心が感じられます";
    } else {
      return "OPPAIに対する愛情が足りませんね";
    }
  };

  useEffect(() => {
    if (oppaiAudioRef.current) {
      oppaiAudioRef.current.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oppaiAudioRef.current]);
  return (
    <div className="App">
      <div className="Result-container">
        <Title />
        <p className="App-title">結果: {timer}秒</p>
        <p className="App-title">{resultText()}</p>
        <button className="App-button" onClick={onRetry}>
          もう一度挑戦する
        </button>
      </div>
      <audio ref={oppaiAudioRef} src="/wow.mp3" preload="auto" />
    </div>
  );
};
