interface NoConnexionProps {
  onSubmitError: () => void;
}
const flag = new URL('../assets/icons/flag.svg', import.meta.url).href;
const NoConnexion: React.FC<NoConnexionProps> = ({ onSubmitError }) => {

  return (
    <div
      className="w-full h-[96px] flex flex-col items-center gap-6 py-4 mb-[39px]"
      style={{ transform: "rotate(0deg)" }}
    >

      <span
        className="text-white font-medium text-center leading-none tracking-tighter w-29 h-3 rotate-0 opacity-100"
        style={{
          fontFamily: "Akzidenz-Grotesk Pro",
          fontSize: "18.57px",
          letterSpacing: '-1%'
        }}
      >
        No connexion.
      </span>

      <div className="flex flex-col justify-center gap-2 items-center">
        <button
          onClick={onSubmitError}
          className="w-31 h-8 rounded-full border-2 flex items-center justify-between rotate-0 opacity-100 py-2 px-3 text-white"
          style={{
            background: '#9D0003',
            border: '2px solid #D50003'
          }}
        >
          <span
            className="text-sm font-normal leading-none tracking-normal rotate-0 opacity-100"
            style={{
              fontFamily: 'Akzidenz-Grotesk Pro'
            }}
          >Submit error</span>
          <img
            src={flag}
            alt="flag"
            className="w-3 h-3 rotate-0 opacity-100"
          />
        </button>
      </div>

    </div>
  );
};
export default NoConnexion;
