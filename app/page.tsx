"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [isRecognitionStarted, setIsRecognitionStarted] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [lastFinalTranscript, setLastFinalTranscript] = useState(""); // Added state for lastFinalTranscript

  useEffect(() => {
    let recognition: SpeechRecognition | undefined;

    const startRecognition = () => {
      if ("SpeechRecognition" in window) {
        recognition = new window.SpeechRecognition();
      } else if ("webkitSpeechRecognition" in window) {
        recognition = new window.webkitSpeechRecognition();
      } else {
        console.log("SpeechRecognition is not supported in this browser");
        return;
      }
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;

        // console.log(result, event.results.length);

        if (result.isFinal) {
          if (text == lastFinalTranscript) {
            return;
          }
          console.log("final transcript", text);
          console.log("lastFinalTranscript", lastFinalTranscript, "transcript", transcript);
          
          setTranscript((prev) => (prev + " " + lastFinalTranscript).trim());
          setLastFinalTranscript(text);
          setInterimTranscript('');
        } else {
          console.log("interim transcript", text);
          setInterimTranscript(text);
        }

      };

      recognition.start();
    };

    if (isRecognitionStarted) {
      startRecognition();
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isRecognitionStarted]);

  useEffect(() => {
    setIsRecognitionStarted(true);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-24">
      <div className="text-center">
        {!isRecognitionStarted && (
          <button
            className="rounded-lg px-5 py-4 bg-red-500 text-white text-2xl hover:bg-gray-300"
            onClick={() => setIsRecognitionStarted(true)}
          >
            Start Transcript
          </button>
        )}
        <span className="text-4xl text-blue-500">{transcript}</span>
        <span className="text-4xl text-green-500">{lastFinalTranscript}</span>
        <span className="text-4xl text-gray-500 italic">{interimTranscript}</span>
      </div>
    </main>
  );
}
