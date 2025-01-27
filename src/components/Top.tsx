import { Title } from "./Title";

type Props = {
  onClick: () => void;
};

export const Top: React.FC<Props> = ({ onClick }) => {
  return (
    <div className="App">
      <p className="App-title">どこかに隠れている</p>
      <Title />
      <p className="App-title">
        を探し出せ！
        <img src="/hand.gif" alt="hand" width={60} height={60} />
      </p>
      <button className="App-button" onClick={onClick}>
        おっぱいを探しに行く
      </button>
    </div>
  );
};
