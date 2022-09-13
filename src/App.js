import React, { useRef } from "react"; 
import { useEffect } from "react";
import { Howl } from "howler";
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import '@tensorflow/tfjs-backend-webgl';

import './App.css';
// import soundURL from './assets/hey_sondn.mp3'


// const sound = new Howl({
//   src: [soundURL]
// })

// sound.play();

const NOT_TOUCH_LABEL = 'not_touch';
const TOUCHED_LABEL = 'touched';
const TRAINING_TIMES = 50;

function App() {

  const video = useRef();
  const classifier = useRef();
  const mobilenetModule = useRef();

  const init = async () => {
    console.log("init...");
    await setupCamera();

    classifier.current = knnClassifier.create();
    mobilenetModule.current = await mobilenet.load();

    console.log("DO NOT TOUCH YOUR FACE AND CLICK TRAIN 1 BUTTON");
  }

  const setupCamera = () => {
    return new Promise((resolve, reject) => {
      navigator.getUserMedia = navigator.getUserMedia || 
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;

      if(navigator.getUserMedia) {
        navigator.getUserMedia(
          { video: true},
          stream => {
            video.current.srcObject = stream;
            video.current.addEventListener("loadeddata", resolve())
          },
          error => reject(error)
        );
      } else {
        reject();
      }
    })
  }

  const train = async label => {
    console.log(`${label}`);
    for (let i = 0; i < TRAINING_TIMES; i++) {
      console.log(`Progress ${Math.floor((i+1) / TRAINING_TIMES * 100)}%`);
      
      await training(label);
    }
  }

  const training = label => {
    return new Promise(async resolve => {
      const embedding = mobilenetModule.current.infer(
        video.current,
        true
      );
      classifier.current.addExample(embedding, label);
      await sleep(100);
      resolve();
    });
  }

  const run = async () => {
    const embedding = mobilenetModule.current.infer(
      video.current,
      true
    );
    const result = await classifier.current.predictClass(embedding);
    console.log('label: ', result);

    await sleep(200);

    run();
  }

  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  useEffect(() => {
    init();

    return () => {

    }
  }, []);

  return (
    <div className="main">
      <video 
        ref={video}
        className='video'
        autoPlay
      />

      <div className='controls'>
        <button className='btn' onClick={() => train(NOT_TOUCH_LABEL)}>Train 1</button>
        <button className='btn' onClick={() => train(TOUCHED_LABEL)}>Train 2</button>
        <button className='btn' onClick={() => run()}>Run</button>
      </div>
    </div>
  );
}

export default App;
