import React, { useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const ValidationAnimation = ({ message, type = 'success', onComplete }) => {
  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2500); // Ferme automatiquement l'animation après 2.5 secondes
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  const animationSrc = type === 'delete' 
    ? "https://lottie.host/c04582bf-f7e2-4b43-81e4-ae7f45e10a05/sEZbocZAAl.lottie"
    : "https://lottie.host/12c7b3cd-c959-4b4e-9b20-e2892a6f5298/JyGlNd3QFd.lottie";

  return (
    <div className="validation-overlay">
      <div className="validation-content">
        <div className="lottie-container">
          <DotLottieReact
            src={animationSrc}
            loop={false}
            autoplay
          />
        </div>
        {message && <h3>{message}</h3>}
      </div>
    </div>
  );
};

export default ValidationAnimation;
