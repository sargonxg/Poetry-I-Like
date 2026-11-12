/** Small synthesized ambience engine. No recorded audio, downloads or autoplay. */
export class WoodlandAudio {
 constructor(onChange=()=>{}){this.context=null;this.gain=null;this.stopTimer=null;this.generation=0;this.onChange=onChange;this.active=false;}
 async stop(){this.generation++;clearTimeout(this.stopTimer);this.stopTimer=null;const context=this.context,gain=this.gain;this.context=null;this.gain=null;this.active=false;this.onChange(false);if(!context)return;if(gain)gain.gain.setTargetAtTime(0,context.currentTime,.12);await new Promise(resolve=>setTimeout(resolve,420));await context.close().catch(()=>{});}
 setVolume(value){if(this.context&&this.gain)this.gain.gain.setTargetAtTime(Math.max(0,Math.min(.35,Number(value)/100)),this.context.currentTime,.18);}
 setTimer(minutes){clearTimeout(this.stopTimer);if(this.active)this.stopTimer=setTimeout(()=>this.stop(),Math.max(5,Math.min(60,minutes))*60000);}
 async start(settings){const generation=this.generation+1;await this.stop();if(generation!==this.generation)return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('This browser does not support Web Audio.');const context=new Audio();this.context=context;try{await context.resume();if(generation!==this.generation||document.hidden){if(this.context===context)this.context=null;await context.close();return;}
 const gain=context.createGain();gain.gain.value=0;const limiter=context.createDynamicsCompressor();limiter.threshold.value=-18;limiter.knee.value=20;limiter.ratio.value=4;limiter.attack.value=.02;limiter.release.value=.4;gain.connect(limiter);limiter.connect(context.destination);this.gain=gain;
 for(let layer=0;layer<2;layer++){
  const seconds=layer?11:7,buffer=context.createBuffer(2,context.sampleRate*seconds,context.sampleRate);
  for(let channel=0;channel<2;channel++){const data=buffer.getChannelData(channel);let brown=0;for(let i=0;i<data.length;i++){const white=Math.random()*2-1;brown=(brown+.02*white)/1.02;data[i]=settings.sound==='rain'?(white*.3+brown*2):settings.sound==='stream'?(white*.17+brown*3):brown*3.4;}}
  const source=context.createBufferSource();source.buffer=buffer;source.loop=true;const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=settings.sound==='rain'?(layer?3000:1350):settings.sound==='stream'?(layer?1900:680):(layer?630:280);const level=context.createGain();level.gain.value=.45;source.connect(filter);filter.connect(level);level.connect(gain);source.start();
  const movement=context.createOscillator(),depth=context.createGain();movement.frequency.value=layer?.043:.027;depth.gain.value=.09;movement.connect(depth);depth.connect(level.gain);movement.start();
 }
 this.active=true;gain.gain.setTargetAtTime(Math.max(0,Math.min(.35,settings.volume/100)),context.currentTime,.65);this.setTimer(settings.timer);this.onChange(true,settings.sound);
 }catch(error){if(this.context===context)this.context=null;await context.close().catch(()=>{});throw error;}}
}
