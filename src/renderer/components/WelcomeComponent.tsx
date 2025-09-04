export default function WelcomeComponent() {

  return (
    <div className="flex pt-0 flex-col items-center gap-0 self-stretch">
      <span
        className="opacity-100 font-semibold text-lg leading-normal text-center text-white"
        style={{
          fontFamily: 'Akzidenz-Grotesk Pro',
        }}
      >
        Thanks for joining the rescue network !
      </span>
      <span
        className="mt-4 text-white text-center text-xs font-normal leading-normal"
        style={{
          fontFamily: 'Akzidenz-Grotesk Pro',
        }}
      >
        Choose where you'll host the data :
      </span>
    </div>
  );

}