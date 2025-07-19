import Dither from './Dither';

function Dith() {
  return (
  <Dither
    waveColor={[0.5, 0.5, 0.5]}
    disableAnimation={false}
    enableMouseInteraction={true}
    mouseRadius={0.35}
    colorNum={14}
    waveAmplitude={0.35}
    waveFrequency={2.5}
    waveSpeed={0.02}
  />

  );
}

export default Dith;