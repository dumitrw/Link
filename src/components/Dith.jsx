import Dither from './Dither';

function Dith() {
  return (

  <Dither
    waveColor={[0.5, 0.5, 0.5]}
    disableAnimation={false}
    enableMouseInteraction={true}
    mouseRadius={0.1}
    colorNum={8}
    waveAmplitude={0.25}
    waveFrequency={3.5}
    waveSpeed={0.02}
  />

  );
}

export default Dith;