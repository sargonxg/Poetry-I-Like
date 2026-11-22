/** Local, opt-in ambience. Recorded rain crossfades in the same AudioContext. */
export const SOUND_LABELS = Object.freeze({
 rain:'Light rain', forest:'Woodland rain', window:'Rain on a window', stream:'Stream'
});
const RAIN_FILES = Object.freeze({
 rain:'assets/ambience/light-rain.mp3',
 forest:'assets/ambience/woodland-rain.mp3',
 window:'assets/ambience/window-rain.mp3'
});

function localTexture(context, sound) {
 const seconds=9, length=Math.floor(context.sampleRate*seconds);
 const buffer=context.createBuffer(2,length,context.sampleRate);
 const weights=sound==='stream'?[.09,2.1]:[.21,1.9];
 for(let channel=0;channel<2;channel++){
  const data=buffer.getChannelData(channel);
  let drift=0;
  for(let i=0;i<data.length;i++){
   const white=Math.random()*2-1;
   drift=(drift+white*.022)/1.022;
   data[i]=white*weights[0]+drift*weights[1];
  }
  const fade=Math.floor(context.sampleRate*.07);
  for(let i=0;i<fade;i++){
   const blend=(i+1)/fade;
   data[length-fade+i]=data[length-fade+i]*(1-blend)+data[i]*blend;
  }
 }
 return {buffer,recorded:false,loopStart:.07};
}

export class WoodlandAudio {
 constructor(onChange=()=>{}) {
  this.onChange=onChange;
  this.context=null;
  this.gain=null;
  this.stopTimer=null;
  this.channel=null;
  this.active=false;
  this.generation=0;
  this.selection=0;
  this.buffers=new Map();
 }

 async start(settings) {
  if(this.context)return;
  const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
  if(!Audio)throw Error('This browser does not support Web Audio.');
  const context=new Audio();
  const generation=++this.generation;
  this.context=context;
  const gain=context.createGain();
  gain.gain.value=0;
  const limiter=context.createDynamicsCompressor();
  limiter.threshold.value=-12;
  limiter.knee.value=20;
  limiter.ratio.value=3;
  gain.connect(limiter);
  limiter.connect(context.destination);
  this.gain=gain;
  try{
   await context.resume();
   if(generation!==this.generation||document.hidden)return;
   if(await this.setSound(settings.sound)){
    this.setVolume(settings.volume);
    this.setTimer(settings.timer);
   }
  }catch(error){
   if(this.context===context)await this.stop();
   throw error;
  }
 }

 async setSound(sound) {
  if(!this.context||!Object.hasOwn(SOUND_LABELS,sound))return false;
  if(this.channel?.sound===sound)return true;
  const context=this.context;
  const selection=++this.selection;
  const audio=await this.getBuffer(context,sound);
  if(this.context!==context||selection!==this.selection||document.hidden)return false;
  const source=context.createBufferSource();
  source.buffer=audio.buffer;
  source.loop=true;
  source.loopStart=audio.loopStart||0;
  const level=context.createGain();
  const motion=context.createBiquadFilter();
  motion.type='lowpass';
  motion.frequency.value=audio.recorded?8600:sound==='stream'?900:2700;
  motion.Q.value=.55;
  source.connect(motion);
  motion.connect(level);
  level.connect(this.gain);
  const now=context.currentTime;
  level.gain.setValueAtTime(0,now);
  level.gain.linearRampToValueAtTime(1,now+.65);
  source.start(now);
  const old=this.channel;
  this.channel={source,level,sound};
  source.onended=()=>{source.disconnect();motion.disconnect();level.disconnect();};
  if(old){
   old.level.gain.cancelScheduledValues(now);
   old.level.gain.setTargetAtTime(0,now,.17);
   old.source.stop(now+.72);
  }
  this.active=true;
  this.onChange(true,sound,audio.recorded?'recorded':'local');
  return true;
 }

 getBuffer(context,sound) {
  if(this.buffers.has(sound))return this.buffers.get(sound);
  const url=RAIN_FILES[sound];
  const request=(url && location.protocol!=='file:'
   ? fetch(url,{credentials:'omit',signal:AbortSignal.timeout(6500)}).then(response=>{
     if(!response.ok)throw Error('Rain recording unavailable.');
     return response.arrayBuffer();
    }).then(bytes=>{
     if(bytes.byteLength>220_000)throw Error('Rain recording exceeds its size limit.');
     return context.decodeAudioData(bytes);
    }).then(buffer=>({buffer,recorded:true}))
   : Promise.resolve(localTexture(context,sound))
  ).catch(()=>localTexture(context,sound));
  this.buffers.set(sound,request);
  return request;
 }

 setVolume(value) {
  if(this.context&&this.gain){
   const volume=Math.max(0,Math.min(.35,(Number(value)||0)/100));
   this.gain.gain.setTargetAtTime(volume,this.context.currentTime,.18);
  }
 }

 setTimer(minutes) {
  clearTimeout(this.stopTimer);
  if(this.active)this.stopTimer=setTimeout(()=>void this.stop(),Math.max(5,Math.min(60,minutes))*60000);
 }

 async stop() {
  this.generation++;
  this.selection++;
  clearTimeout(this.stopTimer);
  this.stopTimer=null;
  const context=this.context,gain=this.gain,wasActive=this.active;
  this.context=null;this.gain=null;this.channel=null;this.active=false;
  this.buffers.clear();
  this.onChange(false);
  if(!context)return;
  if(wasActive&&gain&&context.state==='running'){
   gain.gain.setTargetAtTime(0,context.currentTime,.07);
   await new Promise(resolve=>setTimeout(resolve,240));
  }
  if(context.state!=='closed')await context.close().catch(()=>{});
 }
}
