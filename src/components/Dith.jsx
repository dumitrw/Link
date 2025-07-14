import Dither from './Dither';

function Dith() {
  return (

  <Dither
    waveColor={[0.5, 0.5, 0.5]}
    disableAnimation={false}
    enableMouseInteraction={false}
    mouseRadius={0}
    colorNum={8}
    waveAmplitude={0.22}
    waveFrequency={2}
    waveSpeed={0.01}
  />

  );
}

export default Dith;