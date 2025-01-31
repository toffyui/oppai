import React, { useState } from "react";
import "./App.css";
import { Oppai } from "./components/Oppai";
import "@tensorflow/tfjs-backend-webgl";
import { Top } from "./components/Top";
import { Result } from "./components/Result";

enum Page {
  HOME = "home",
  OPPAI = "oppai",
  RESULT = "result",
}
function App() {
  const [page, setPage] = useState<Page>(Page.HOME);
  const [timer, setTimer] = useState(0);

  return (
    <>
      {page === Page.HOME && <Top onClick={() => setPage(Page.OPPAI)} />}
      {page === Page.OPPAI && (
        <Oppai setTimer={setTimer} onOppaiFound={() => setPage(Page.RESULT)} />
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
