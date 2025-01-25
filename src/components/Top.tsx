type Props = {
  onClick: () => void;
};

export const Top: React.FC<Props> = ({ onClick }) => {
  return (
    <div className="App">
      <p className="App-title">空間のどこかにある</p>
      <header className="App-header">
        <img src="/title/o.gif" alt="O" width={100} height={100} />
        <img src="/title/p.gif" alt="P" width={100} height={100} />
        <img src="/title/p.gif" alt="P" width={100} height={100} />
        <img src="/title/a.gif" alt="A" width={100} height={100} />
        <img src="/title/i.gif" alt="I" width={100} height={100} />
      </header>
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
