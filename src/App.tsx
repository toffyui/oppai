import React, { useEffect, useState } from "react";
import "./App.css";
import { Oppai } from "./components/Oppai";
import "@tensorflow/tfjs-backend-webgl";
import { Top } from "./components/Top";
import * as handpose from "@tensorflow-models/handpose";
import * as tf from "@tensorflow/tfjs";
import { Result } from "./components/Result";

enum Page {
  HOME = "home",
  OPPAI = "oppai",
  RESULT = "result",
}
function App() {
  const [page, setPage] = useState<Page>(Page.HOME);
  const [model, setModel] = useState<handpose.HandPose | null>(null);
  const [timer, setTimer] = useState(0);
  useEffect(() => {
    const loadModel = async () => {
      await tf.setBackend("webgl");
      await tf.ready();
      const loadedModel = await handpose.load();
      setModel(loadedModel);
    };
    loadModel();
  }, []);
  return (
    <>
      {page === Page.HOME && <Top onClick={() => setPage(Page.OPPAI)} />}
      {page === Page.OPPAI && model && (
        <Oppai
          loadedModel={model}
          setTimer={setTimer}
          onOppaiFound={() => setPage(Page.RESULT)}
        />
      )}
      {page === Page.RESULT && (
        <Result
          timer={timer}
          onRetry={() => {
            setPage(Page.HOME);
          }}
        />
      )}
    </>
  );
}

export default App;
