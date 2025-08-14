export default function WelcomeComponent() {
  
    return (
    <div className="flex pt-0 flex-col items-center gap-0 self-stretch">
      <span 
        className="w-[166px] h-9 opacity-100 font-medium text-lg leading-none text-center text-white tracking-tight"
        style={{ 
          fontFamily: 'Akzidenz-Grotesk Pro',
          letterSpacing: '-1%'
        }}
      >
        Thanks for joining the rescue network!
      </span>
      <span 
        className="mt-4 mb-4 text-white text-center text-xs font-normal leading-normal"
        style={{ 
          fontFamily: 'Akzidenz-Grotesk Pro',
          letterSpacing: '-0.12px'
        }}
      >
        Choose where you'll host the data:
      </span>
    </div>
  );
  
}