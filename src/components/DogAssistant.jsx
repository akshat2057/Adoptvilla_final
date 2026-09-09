import React from 'react';
import './DogAssistant.css';

export default function DogAssistant(){
  return (
    <div className="dog-assistant" aria-hidden="true">
      <video autoPlay loop muted playsInline preload="auto">
        <source src="/assets/dog/dog-assistant-alpha.webm" type="video/webm" />
        <source src="/assets/dog/dog-assistant.webm" type="video/webm" />
      </video>
    </div>
  );
}